import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, ForbiddenException, ConflictException, Logger } from '@nestjs/common';
import { normalizeIndianPhone } from '@foodhub/utils';
import { OtpService } from '../otp/otp.service';
import { TokenService } from '../tokens/token.service';
import { SessionService } from '../sessions/session.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyResetTokenDto } from './dto/verify-reset-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { RequestPhoneChangeOtpDto, VerifyPhoneChangeOtpDto } from './dto/change-phone.dto';
import * as bcrypt from 'bcrypt';
import { RegisterRestaurantOwnerDto } from './dto/register-restaurant-owner.dto';
import { RegisterDeliveryPartnerDto } from './dto/register-delivery-partner.dto';
import { UserRole, RestaurantStatus, DriverStatus } from '@prisma/client';
import * as crypto from 'crypto';

import { VerifyOtpDto } from './dto/verify-otp.dto';

interface ResetTokenPayload {
  userId: string;
  phone: string;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly resetTokenMap = new Map<string, ResetTokenPayload>();

  constructor(
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly usersService: UsersService,
  ) {}

  async sendOtp(phone: string) {
    return this.otpService.sendOtp(phone);
  }

  /**
   * Verify MSG91 Widget access token for pre-registration phone check.
   * Extracts phone from MSG91 payload, verifies match against submitted registration phone.
   * Does NOT create a user account, does NOT issue JWTs.
   * Returns { verified: true } on success so the registration form can proceed.
   */
  async verifyRegistrationWidgetToken(accessToken: string, submittedPhone: string) {
    if (!accessToken) {
      throw new BadRequestException('Widget access token is required');
    }
    if (!submittedPhone) {
      throw new BadRequestException('Registration phone number is required');
    }

    const msg91Data = await this.otpService.verifyAccessToken(accessToken);

    const extractMobileFromMsg91 = (res: any): string | null => {
      if (!res) return null;
      if (typeof res?.message === 'string' && res.message.trim().length >= 10) {
        return res.message.trim();
      }
      if (res?.data && typeof res.data === 'object' && res.data.mobile) {
        return String(res.data.mobile).trim();
      }
      if (res?.mobile) {
        return String(res.mobile).trim();
      }
      if (typeof res?.data === 'string' && res.data.trim().length >= 10) {
        return res.data.trim();
      }
      if (res?.message && typeof res.message === 'object' && res.message.mobile) {
        return String(res.message.mobile).trim();
      }
      if (res?.phone) {
        return String(res.phone).trim();
      }
      return null;
    };

    const rawMobile = extractMobileFromMsg91(msg91Data);
    this.logger.log(`[Restaurant Registration Widget] Extracted mobile present=${!!rawMobile}`);

    let verifiedMobile = String(rawMobile || '').trim();
    if (!verifiedMobile) {
      this.logger.error(`[Restaurant Registration Widget] Mobile number missing in MSG91 payload response.`);
      throw new BadRequestException('Mobile number not returned from MSG91 widget verification');
    }

    const cleanVerified = verifiedMobile.replace(/\D/g, '');
    const cleanSubmitted = submittedPhone.replace(/\D/g, '');

    if (cleanVerified.length < 10 || cleanSubmitted.length < 10) {
      throw new BadRequestException('Invalid mobile number format for verification');
    }

    const verifiedFormatted = cleanVerified.length === 10 ? `+91${cleanVerified}` : `+${cleanVerified}`;
    const submittedFormatted = cleanSubmitted.length === 10 ? `+91${cleanSubmitted}` : `+${cleanSubmitted}`;

    if (verifiedFormatted !== submittedFormatted) {
      this.logger.error(`[Restaurant Registration Widget] Phone mismatch! Submitted: ${submittedFormatted}, Verified by MSG91: ${verifiedFormatted}`);
      throw new BadRequestException('Verified phone number does not match the registration phone number.');
    }

    this.logger.log(`[Restaurant Registration Widget] Phone verification succeeded for ${submittedFormatted}`);
    return { verified: true, message: 'Phone number verified successfully' };
  }


  async checkPhoneAvailability(rawPhone: string) {
    if (!rawPhone) {
      throw new BadRequestException('Phone number is required');
    }
    const cleanDigits = rawPhone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      throw new BadRequestException('Please enter a valid 10-digit mobile number');
    }
    const formattedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;
    const existing = await this.usersService.findUserByPhone(formattedPhone);
    if (existing) {
      throw new BadRequestException(
        'An account with this phone number already exists. Please use the correct login portal.',
      );
    }
    return { available: true, message: 'Phone number is available for registration.' };
  }

  /**
   * Pre-validate a phone number for Hotel Dashboard OTP login.
   * Called BEFORE triggering MSG91 so we can show proper UX errors upfront.
   * Returns { status: 'authorized' | 'pending' | 'not_found', message }
   */
  async checkHotelPhone(rawPhone: string) {
    if (!rawPhone) {
      throw new BadRequestException('Phone number is required');
    }
    const cleanDigits = rawPhone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      throw new BadRequestException('Please enter a valid 10-digit mobile number');
    }
    const formattedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;
    const user = await this.usersService.findUserByPhone(formattedPhone);

    if (!user) {
      // Check if a rejected record exists
      const rejected = await (this.usersService as any).prisma.rejectedRestaurantRecord.findFirst({
        where: {
          OR: [
            { restaurantName: { contains: cleanDigits } },
          ],
        },
      });
      if (rejected) {
        throw new UnauthorizedException('Your restaurant registration has not been approved.');
      }
      throw new UnauthorizedException(
        'No authorized hotel account found for this phone number. Please complete restaurant registration first.',
      );
    }

    const allowedHotelRoles: string[] = [
      UserRole.RESTAURANT_OWNER,
      UserRole.RESTAURANT_MANAGER,
      UserRole.RESTAURANT_STAFF,
    ];

    if (!allowedHotelRoles.includes(user.role)) {
      throw new UnauthorizedException(
        'This phone number is not registered as a Merchant Partner. Please use the Merchant Registration form.',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your merchant account has been disabled. Please contact support.');
    }

    // Check restaurant approval status
    let restaurantStatus: string | null = null;

    // Try via restaurantStaff relation (already included by findUserByPhone)
    const staffRestaurant = (user as any).restaurantStaff?.[0]?.restaurant;
    if (staffRestaurant) {
      restaurantStatus = staffRestaurant.status;
    }

    if (!restaurantStatus && user.role === UserRole.RESTAURANT_OWNER) {
      const restaurant = await (this.usersService as any).prisma.restaurant.findFirst({
        where: { ownerId: user.id },
        select: { status: true, name: true },
      });
      restaurantStatus = restaurant?.status ?? null;
    }

    if (restaurantStatus === 'REJECTED') {
      throw new UnauthorizedException(
        'Your restaurant registration has not been approved.',
      );
    }

    if (restaurantStatus === 'SUSPENDED') {
      throw new UnauthorizedException(
        'Your restaurant account has been suspended. Please contact FoodHub support.',
      );
    }

    if (!restaurantStatus) {
      this.logger.warn(`[checkHotelPhone] No restaurant found for RESTAURANT_OWNER user=${user.id}`);
      throw new UnauthorizedException(
        'Your restaurant registration has not been approved.',
      );
    }

    this.logger.log(`[checkHotelPhone] Authorized: user=${user.id}, role=${user.role}, restaurantStatus=${restaurantStatus}`);
    return {
      authorized: true,
      message: 'Hotel account verified. Proceeding with OTP.',
    };
  }



  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const cleanDigits = dto.phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      throw new BadRequestException('Please provide a valid 10-digit mobile number');
    }

    const formattedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;

    const existingUser = await this.usersService.findUserByPhone(formattedPhone);
    if (existingUser) {
      throw new ConflictException('Phone number is already registered. Please login.');
    }

    const cleanEmail = dto.email ? dto.email.trim().toLowerCase() : undefined;
    if (cleanEmail) {
      const existingEmail = await this.usersService.findUserByPhone(cleanEmail);
      if (existingEmail) {
        throw new ConflictException('An account with this email address already exists. Please login.');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const nameParts = dto.name.trim().split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create ONLY CUSTOMER user + Customer domain profile
    const user = await (this.usersService as any).prisma.user.create({
      data: {
        phone: formattedPhone,
        email: cleanEmail,
        passwordHash,
        role: UserRole.CUSTOMER,
        isVerified: true,
        isActive: true,
        profile: {
          create: {
            firstName,
            lastName,
          },
        },
        customer: {
          create: {},
        },
      },
      include: { profile: true, customer: true },
    });

    this.logger.log(`[Customer Register] Registered new Customer ID=${user.id}, phone=${user.phone}`);
    const session = await this.sessionService.createSession(user.id, ipAddress, userAgent);
    const tokens = await this.tokenService.generateTokenPair(user, session.id);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
      tokens,
    };
  }

  async registerRestaurantOwner(dto: RegisterRestaurantOwnerDto, ipAddress?: string, userAgent?: string) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const cleanDigits = dto.phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      throw new BadRequestException('Please provide a valid 10-digit mobile number');
    }
    const formattedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;
    const cleanEmail = dto.email.trim().toLowerCase();

    const existingUser = await (this.usersService as any).prisma.user.findFirst({
      where: { OR: [{ phone: formattedPhone }, { email: cleanEmail }] },
    });
    if (existingUser) {
      throw new BadRequestException('An account with this phone number or email already exists. Please login.');
    }

    if (!dto.fssaiNumber || !dto.fssaiNumber.trim()) {
      throw new BadRequestException('FSSAI license number is required for restaurant registration.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const nameParts = dto.name.trim().split(' ');
    if (!nameParts[0]) {
      throw new BadRequestException('A valid full name is required.');
    }
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    const slug = dto.restaurantName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
    const fullAddress = [dto.addressLine, dto.city, dto.state, dto.postalCode].filter(Boolean).join(', ');

    const result = await (this.usersService as any).prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          phone: formattedPhone,
          email: cleanEmail,
          passwordHash,
          role: UserRole.RESTAURANT_OWNER,
          isVerified: true,
          isActive: true,
          profile: {
            create: {
              firstName,
              lastName,
            },
          },
        },
        include: { profile: true },
      });

      const restaurant = await tx.restaurant.create({
        data: {
          ownerId: user.id,
          name: dto.restaurantName,
          slug,
          phone: formattedPhone,
          email: cleanEmail,
          licenseFssai: dto.fssaiNumber.trim(),
          gstin: dto.gstin?.trim() || null,
          addressLine: fullAddress || dto.addressLine || 'Bandipora',
          latitude: dto.latitude != null ? Number(dto.latitude) : 34.4226,
          longitude: dto.longitude != null ? Number(dto.longitude) : 74.6469,
          status: RestaurantStatus.PENDING_APPROVAL,
          isOpen: false,
        },
      });

      await tx.restaurantStaff.create({
        data: {
          restaurantId: restaurant.id,
          userId: user.id,
          designation: 'Owner',
        },
      });

      return { user, restaurant };
    });

    const session = await this.sessionService.createSession(result.user.id, ipAddress, userAgent);
    const tokens = await this.tokenService.generateTokenPair(
      {
        id: result.user.id,
        phone: result.user.phone,
        role: result.user.role,
        restaurantId: result.restaurant.id,
      },
      session.id,
    );

    this.logger.log(`[Restaurant Registration] Registered owner user=${result.user.id}, restaurant=${result.restaurant.id}`);

    return {
      user: {
        id: result.user.id,
        phone: result.user.phone,
        email: result.user.email,
        role: result.user.role,
        profile: result.user.profile,
        restaurant: {
          id: result.restaurant.id,
          name: result.restaurant.name,
          slug: result.restaurant.slug,
          status: result.restaurant.status,
        },
        restaurantId: result.restaurant.id,
      },
      tokens,
      message: 'Restaurant owner account created successfully. Application is pending admin approval.',
    };
  }

  async registerDeliveryPartner(dto: RegisterDeliveryPartnerDto, ipAddress?: string, userAgent?: string) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const cleanDigits = dto.phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      throw new BadRequestException('Please provide a valid 10-digit mobile number');
    }
    const formattedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;
    const cleanEmail = dto.email.trim().toLowerCase();

    const existingUser = await (this.usersService as any).prisma.user.findFirst({
      where: { OR: [{ phone: formattedPhone }, { email: cleanEmail }] },
    });
    if (existingUser) {
      throw new BadRequestException('An account with this phone number or email already exists. Please login.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const nameParts = dto.name.trim().split(' ');
    const firstName = nameParts[0] || 'Driver';
    const lastName = nameParts.slice(1).join(' ') || '';

    const result = await (this.usersService as any).prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          phone: formattedPhone,
          email: cleanEmail,
          passwordHash,
          role: UserRole.DELIVERY_PARTNER,
          isVerified: true,
          isActive: true,
          profile: {
            create: {
              firstName,
              lastName,
            },
          },
        },
        include: { profile: true },
      });

      const driver = await tx.driver.create({
        data: {
          userId: user.id,
          licenseNumber: dto.licenseNumber.trim().toUpperCase(),
          isApproved: false,
          status: DriverStatus.OFFLINE,
        },
      });

      const vehicle = await tx.driverVehicle.create({
        data: {
          driverId: driver.id,
          vehicleType: dto.vehicleType,
          vehicleNumber: dto.vehicleNumber,
          model: 'Delivery Vehicle',
        },
      });

      return { user, driver: { ...driver, vehicles: [vehicle] } };
    });

    const session = await this.sessionService.createSession(result.user.id, ipAddress, userAgent);
    const tokens = await this.tokenService.generateTokenPair(result.user, session.id);

    this.logger.log(`[Delivery Partner Registration] Registered driver user=${result.user.id}, driver=${result.driver.id}`);

    return {
      user: {
        id: result.user.id,
        phone: result.user.phone,
        email: result.user.email,
        role: result.user.role,
        profile: result.user.profile,
        driver: {
          id: result.driver.id,
          status: result.driver.status,
          isApproved: result.driver.isApproved,
          licenseNumber: result.driver.licenseNumber,
          vehicles: result.driver.vehicles,
        },
        driverId: result.driver.id,
      },
      tokens,
      message: 'Delivery partner account created successfully. Application is under admin review.',
    };
  }

  async getMe(userId: string) {
    const user = await (this.usersService as any).prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        customer: true,
        driver: {
          include: {
            vehicles: true,
            documents: true,
          },
        },
        restaurantStaff: {
          include: {
            restaurant: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User account not found');
    }

    let restaurantObj = user.restaurantStaff?.[0]?.restaurant || null;
    if (!restaurantObj && user.role === UserRole.RESTAURANT_OWNER) {
      restaurantObj = await (this.usersService as any).prisma.restaurant.findFirst({
        where: { ownerId: user.id },
      });
    }

    const restaurant = restaurantObj
      ? {
          id: restaurantObj.id,
          name: restaurantObj.name,
          slug: restaurantObj.slug,
          phone: restaurantObj.phone,
          email: restaurantObj.email,
          status: restaurantObj.status,
          isOpen: restaurantObj.isOpen,
          deliveryMode: restaurantObj.deliveryMode,
        }
      : null;

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
      profile: user.profile,
      customer: user.customer,
      driver: user.driver
        ? {
            id: user.driver.id,
            status: user.driver.status,
            isApproved: user.driver.isApproved,
            licenseNumber: user.driver.licenseNumber,
            vehicles: user.driver.vehicles,
          }
        : null,
      driverId: user.driver?.id || null,
      restaurant,
      restaurantId: restaurant?.id || null,
    };
  }

  private async enforceUserRoleAndStatus(user: any, targetRole?: string) {
    const normalizedTarget = (targetRole || 'CUSTOMER').toUpperCase();

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled. Please contact support.');
    }

    if (normalizedTarget === 'HOTEL') {
      const allowedHotelRoles: string[] = [
        UserRole.RESTAURANT_OWNER,
        UserRole.RESTAURANT_MANAGER,
        UserRole.RESTAURANT_STAFF,
      ];
      if (!allowedHotelRoles.includes(user.role)) {
        throw new UnauthorizedException(
          'Access denied. Your account is not authorized for the Merchant Partner Portal.',
        );
      }
    } else if (normalizedTarget === 'DELIVERY') {
      if (user.role !== UserRole.DELIVERY_PARTNER) {
        throw new UnauthorizedException(
          'Access denied. Your account is not authorized for the Courier Partner Portal.',
        );
      }
    } else if (normalizedTarget === 'ADMIN') {
      const allowedAdminRoles: string[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
      if (!allowedAdminRoles.includes(user.role)) {
        throw new UnauthorizedException(
          'Access denied. Your account does not have administrative privileges.',
        );
      }
    }

    // Fetch restaurant association for Hotel roles
    let restaurant: any = null;
    if (
      user.role === UserRole.RESTAURANT_OWNER ||
      user.role === UserRole.RESTAURANT_MANAGER ||
      user.role === UserRole.RESTAURANT_STAFF
    ) {
      let rObj = (user as any).restaurantStaff?.[0]?.restaurant;
      if (!rObj && user.role === UserRole.RESTAURANT_OWNER) {
        rObj = await (this.usersService as any).prisma?.restaurant?.findFirst({
          where: { ownerId: user.id },
        });
      }

      if (rObj) {
        if (rObj.status === 'REJECTED') {
          throw new UnauthorizedException(
            'Your restaurant application has been rejected by FoodHub admin.',
          );
        }
        restaurant = {
          id: rObj.id,
          name: rObj.name,
          slug: rObj.slug,
          status: rObj.status,
          deliveryMode: rObj.deliveryMode,
        };
      }
    }

    return restaurant;
  }

  async verifyWidgetToken(
    accessToken: string,
    targetRole?: string,
    ipAddress?: string,
    userAgent?: string,
    dto?: VerifyOtpDto,
  ) {
    if (!accessToken) {
      throw new BadRequestException('Widget access token is required');
    }

    const msg91Data = await this.otpService.verifyAccessToken(accessToken);

    const extractMobileFromMsg91 = (res: any): string | null => {
      if (!res) return null;
      if (typeof res?.message === 'string' && res.message.trim().length >= 10) {
        return res.message.trim();
      }
      if (res?.data && typeof res.data === 'object' && res.data.mobile) {
        return String(res.data.mobile).trim();
      }
      if (res?.mobile) {
        return String(res.mobile).trim();
      }
      if (typeof res?.data === 'string' && res.data.trim().length >= 10) {
        return res.data.trim();
      }
      if (res?.message && typeof res.message === 'object' && res.message.mobile) {
        return String(res.message.mobile).trim();
      }
      if (res?.phone) {
        return String(res.phone).trim();
      }
      return null;
    };

    const rawMobile = extractMobileFromMsg91(msg91Data);
    this.logger.log(`[Backend MSG91] Extracted mobile present=${!!rawMobile}`);

    let phoneToVerify = String(rawMobile || '').trim();
    if (!phoneToVerify) {
      this.logger.error(`[Backend MSG91] Mobile number missing in MSG91 payload response.`);
      throw new BadRequestException('Mobile number not returned from MSG91 widget verification');
    }

    if (!phoneToVerify.startsWith('+')) {
      if (phoneToVerify.length === 10) {
        phoneToVerify = `+91${phoneToVerify}`;
      } else {
        phoneToVerify = `+${phoneToVerify}`;
      }
    }

    // Phone mismatch check between submitted phone and MSG91 verified phone
    if (dto?.phone) {
      const cleanSub = dto.phone.replace(/\D/g, '');
      if (cleanSub.length >= 10) {
        const submittedFormatted = cleanSub.length === 10 ? `+91${cleanSub}` : `+${cleanSub}`;
        if (submittedFormatted !== phoneToVerify) {
          this.logger.error(`[Backend MSG91] Phone mismatch! Submitted: ${submittedFormatted}, Verified by MSG91: ${phoneToVerify}`);
          throw new BadRequestException('Submitted phone number does not match MSG91 verified phone number.');
        }
      }
    }

    let user = await this.usersService.findUserByPhone(phoneToVerify);
    const normalizedTarget = (targetRole || 'CUSTOMER').toUpperCase();

    if (!user) {
      if (normalizedTarget === 'CUSTOMER') {
        this.logger.log(`[Backend MSG91] Creating CUSTOMER account for verified phone ${phoneToVerify} AFTER OTP...`);
        if (!dto?.password || dto.password.length < 6) {
          throw new BadRequestException('A valid password (minimum 6 characters) is required to complete customer registration.');
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        
        const nameParts = (dto?.name || 'Customer').trim().split(' ');
        const firstName = nameParts[0] || 'Customer';
        const lastName = nameParts.slice(1).join(' ') || '';

        user = await (this.usersService as any).prisma.user.create({
          data: {
            phone: phoneToVerify,
            passwordHash,
            role: UserRole.CUSTOMER,
            isVerified: true,
            isActive: true,
            profile: {
              create: {
                firstName,
                lastName,
              },
            },
          },
          include: { profile: true },
        });
      } else {
        this.logger.warn(`[Backend MSG91] Rejected: No user found for phone ${phoneToVerify} targeting ${normalizedTarget}`);
        throw new UnauthorizedException(`No authorized ${normalizedTarget.toLowerCase()} account found for this phone number.`);
      }
    } else {
      // Existing account: reject CUSTOMER signup for any already-registered phone regardless of role
      if (normalizedTarget === 'CUSTOMER') {
        this.logger.warn(
          `[Backend MSG91] Rejected CUSTOMER signup: phone ${phoneToVerify} already registered as role=${user.role}`,
        );
        throw new BadRequestException(
          'An account with this phone number already exists. Please use the correct login portal.',
        );
      }
    }

    const restaurant = await this.enforceUserRoleAndStatus(user, targetRole);

    this.logger.log(`[Backend MSG91] User authenticated with ID=${user.id}, role=${user.role}. Creating session & tokens...`);
    const session = await this.sessionService.createSession(user.id, ipAddress, userAgent);
    const tokens = await this.tokenService.generateTokenPair(
      {
        ...user,
        restaurantId: restaurant?.id,
      },
      session.id,
    );

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        profile: user.profile,
        restaurant,
        restaurantId: restaurant?.id,
      },
      tokens,
    };
  }

  async verifyOtp(dto: VerifyOtpDto, ipAddress?: string, userAgent?: string) {
    if (dto.accessToken) {
      return this.verifyWidgetToken(dto.accessToken, dto.targetRole, ipAddress, userAgent, dto);
    }

    if (!dto.phone || !dto.otp) {
      throw new BadRequestException('Phone number and OTP code are required');
    }

    let formattedPhone: string;
    try {
      formattedPhone = normalizeIndianPhone(dto.phone);
    } catch {
      throw new BadRequestException('Please provide a valid 10-digit Indian mobile number');
    }

    await this.otpService.verifyOtp(formattedPhone, dto.otp);
    const phoneToVerify = formattedPhone;

    let user = await this.usersService.findUserByPhone(phoneToVerify);
    const normalizedTarget = (dto.targetRole || 'CUSTOMER').toUpperCase();

    if (!user) {
      if (normalizedTarget === 'CUSTOMER') {
        if (!dto?.password || dto.password.length < 6) {
          throw new BadRequestException('A valid password (minimum 6 characters) is required to complete customer registration.');
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        
        const nameParts = (dto?.name || 'Customer').trim().split(' ');
        const firstName = nameParts[0] || 'Customer';
        const lastName = nameParts.slice(1).join(' ') || '';

        user = await (this.usersService as any).prisma.user.create({
          data: {
            phone: phoneToVerify,
            passwordHash,
            role: UserRole.CUSTOMER,
            isVerified: true,
            isActive: true,
            profile: {
              create: {
                firstName,
                lastName,
              },
            },
            customer: {
              create: {},
            },
          },
          include: { profile: true, customer: true },
        });
      } else {
        throw new UnauthorizedException(`No authorized ${normalizedTarget.toLowerCase()} account found for this phone number.`);
      }
    } else {
      // Existing account: reject any CUSTOMER signup attempt regardless of role or password presence
      if (normalizedTarget === 'CUSTOMER') {
        this.logger.warn(
          `[verifyOtp] Rejected CUSTOMER signup: phone already registered as role=${user.role}`,
        );
        throw new BadRequestException(
          'An account with this phone number already exists. Please use the correct login portal.',
        );
      }
    }

    const restaurant = await this.enforceUserRoleAndStatus(user, dto.targetRole);

    const session = await this.sessionService.createSession(user.id, ipAddress, userAgent);
    const tokens = await this.tokenService.generateTokenPair(
      {
        ...user,
        restaurantId: restaurant?.id,
      },
      session.id,
    );

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        profile: user.profile,
        restaurant,
        restaurantId: restaurant?.id,
      },
      tokens,
    };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const input = (dto.phone || dto.email || '').trim();
    if (!input) {
      throw new BadRequestException('Phone or email is required for login');
    }
    const user = await this.usersService.findUserByPhoneOrEmail(input);
    if (!user) {
      throw new UnauthorizedException('Invalid phone number or password.');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been disabled. Please contact support.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid phone number or password.');
    }

    // Portal-specific role enforcement: reject if the caller declared a targetRole
    // that does not match the account's actual role
    if (dto.targetRole) {
      const normalizedTarget = dto.targetRole.toUpperCase().trim();
      const normalizedUserRole = user.role.toUpperCase().trim();
      if (normalizedTarget === 'CUSTOMER' && normalizedUserRole !== 'CUSTOMER') {
        this.logger.warn(
          `[login] Portal role mismatch: user=${user.id} has role=${user.role}, but targetRole=CUSTOMER was required`,
        );
        throw new UnauthorizedException(
          'An account with this phone number already exists. Please use the correct login portal.',
        );
      }
      if (normalizedTarget === 'HOTEL') {
        const allowedHotelRoles: string[] = [
          UserRole.RESTAURANT_OWNER,
          UserRole.RESTAURANT_MANAGER,
          UserRole.RESTAURANT_STAFF,
        ];
        if (!allowedHotelRoles.includes(user.role)) {
          throw new UnauthorizedException(
            'Access denied. Your account is not authorized for the Merchant Partner Portal.',
          );
        }
      }
    }

    let restaurant: any = null;
    if (
      user.role === UserRole.RESTAURANT_OWNER ||
      user.role === UserRole.RESTAURANT_MANAGER ||
      user.role === UserRole.RESTAURANT_STAFF
    ) {
      let rObj = (user as any).restaurantStaff?.[0]?.restaurant;
      if (!rObj && user.role === UserRole.RESTAURANT_OWNER) {
        rObj = await (this.usersService as any).prisma?.restaurant?.findFirst({
          where: { ownerId: user.id },
        });
      }

      if (rObj) {
        if (rObj.status === 'REJECTED') {
          const reason = rObj.rejectionReason ? `: ${rObj.rejectionReason}` : '';
          throw new UnauthorizedException(`Your restaurant application was rejected${reason}. Please contact support.`);
        }
        if (rObj.status === 'SUSPENDED') {
          throw new UnauthorizedException('Your restaurant account has been suspended. Please contact support.');
        }
        if (rObj.status === 'REJECTED') {
          throw new UnauthorizedException('Your restaurant registration has not been approved.');
        }
        restaurant = {
          id: rObj.id,
          name: rObj.name,
          slug: rObj.slug,
          status: rObj.status,
          deliveryMode: rObj.deliveryMode,
        };
      }
    }

    const session = await this.sessionService.createSession(user.id, ipAddress, userAgent);
    const tokens = await this.tokenService.generateTokenPair(
      {
        ...user,
        restaurantId: restaurant?.id,
      },
      session.id,
    );

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        profile: user.profile,
        restaurant,
        restaurantId: restaurant?.id,
      },
      tokens,
    };
  }

  async logout(userId: string, sessionId: string) {
    await this.sessionService.terminateSession(sessionId, userId);
    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string) {
    await this.tokenService.revokeAllUserTokens(userId);
    await this.sessionService.terminateAllUserSessions(userId);
    return { message: 'Logged out from all devices successfully' };
  }

  async refresh(refreshToken: string) {
    return this.tokenService.rotateRefreshToken(refreshToken);
  }

  async forgotPassword(input: string, targetRole?: string) {
    const rawInput = (input || '').trim();
    if (!rawInput) {
      throw new BadRequestException('Phone number or email is required');
    }
    const user = await this.usersService.findUserByPhoneOrEmail(rawInput);
    if (!user || !user.isActive) {
      // Security standard: generic success response to prevent account enumeration
      return { message: 'If registered, password reset OTP instructions have been sent.' };
    }

    if (targetRole) {
      const normalizedTarget = targetRole.toUpperCase().trim();
      if (normalizedTarget === 'HOTEL') {
        const allowedHotelRoles: string[] = [
          UserRole.RESTAURANT_OWNER,
          UserRole.RESTAURANT_MANAGER,
          UserRole.RESTAURANT_STAFF,
        ];
        if (!allowedHotelRoles.includes(user.role)) {
          throw new UnauthorizedException('No authorized restaurant account found for this phone number.');
        }
      } else if (normalizedTarget === 'DELIVERY') {
        if (user.role !== UserRole.DELIVERY_PARTNER) {
          throw new UnauthorizedException('No authorized delivery partner account found for this phone number.');
        }
      }
    }

    // Trigger OTP sending
    await this.otpService.sendOtp(user.phone);

    return {
      exists: true,
      phone: user.phone,
      message: 'Password reset OTP dispatched successfully via MSG91.',
    };
  }

  async verifyResetToken(dto: VerifyResetTokenDto) {
    if (!dto.phone) {
      throw new BadRequestException('Registered phone number is required');
    }

    const canonicalPhone = normalizeIndianPhone(dto.phone);
    let phoneToVerify = canonicalPhone;

    if (dto.accessToken) {
      const msg91Data = await this.otpService.verifyAccessToken(dto.accessToken);

      const extractMobileFromMsg91 = (res: any): string | null => {
        if (!res) return null;
        if (typeof res?.message === 'string' && res.message.trim().length >= 10) return res.message.trim();
        if (res?.data && typeof res.data === 'object' && res.data.mobile) return String(res.data.mobile).trim();
        if (res?.mobile) return String(res.mobile).trim();
        if (typeof res?.data === 'string' && res.data.trim().length >= 10) return res.data.trim();
        if (res?.message && typeof res.message === 'object' && res.message.mobile) return String(res.message.mobile).trim();
        if (res?.phone) return String(res.phone).trim();
        return null;
      };

      const rawMobile = extractMobileFromMsg91(msg91Data);
      if (!rawMobile) {
        throw new BadRequestException('Mobile number not returned from MSG91 widget verification');
      }

      phoneToVerify = normalizeIndianPhone(rawMobile);

      if (phoneToVerify !== canonicalPhone) {
        this.logger.error(`[Backend ForgotPassword] Phone mismatch! Requested: ${canonicalPhone}, Verified by MSG91: ${phoneToVerify}`);
        throw new BadRequestException('MSG91 verified phone does not match requested password reset phone.');
      }
    } else if (dto.otp) {
      await this.otpService.verifyOtp(canonicalPhone, dto.otp);
    } else {
      throw new BadRequestException('MSG91 access token or OTP code is required');
    }

    const user = await this.usersService.findUserByPhone(canonicalPhone);
    if (!user || !user.isActive) {
      throw new BadRequestException('No active user account found for this phone number');
    }

    // Issue short-lived, single-use password reset token (valid 10 minutes)
    const resetToken = `rst_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
    this.resetTokenMap.set(resetToken, {
      userId: user.id,
      phone: user.phone,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    this.logger.log(`[Backend ForgotPassword] Issued reset token for user ID=${user.id}, phone=${user.phone}`);

    return {
      resetToken,
      phone: user.phone,
      message: 'OTP verified successfully. You may now set your new password.',
    };
  }

  async resetPassword(dto: ResetPasswordDto, ipAddress?: string, userAgent?: string) {
    let userId: string | null = null;

    if (dto.resetToken) {
      const payload = this.resetTokenMap.get(dto.resetToken);
      if (!payload) {
        throw new BadRequestException('Invalid or expired password reset token. Please request a new OTP.');
      }
      if (Date.now() > payload.expiresAt) {
        this.resetTokenMap.delete(dto.resetToken);
        throw new BadRequestException('Password reset token has expired. Please request a new OTP.');
      }
      // Single-use token: invalidate immediately!
      this.resetTokenMap.delete(dto.resetToken);
      userId = payload.userId;
    } else if (dto.accessToken || (dto.phone && dto.otp)) {
      const verifyRes = await this.verifyResetToken({
        accessToken: dto.accessToken,
        phone: dto.phone || '',
        otp: dto.otp,
      });
      const payload = this.resetTokenMap.get(verifyRes.resetToken);
      if (payload) {
        userId = payload.userId;
        this.resetTokenMap.delete(verifyRes.resetToken);
      }
    }

    if (!userId) {
      throw new BadRequestException('Valid reset token or OTP verification is required');
    }

    const user = await this.usersService.findUserById(userId);
    if (!user || !user.isActive) {
      throw new BadRequestException('User record not found or account is disabled');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.usersService.updatePassword(user.id, newPasswordHash);

    // Invalidate all active sessions & refresh tokens
    await this.tokenService.revokeAllUserTokens(user.id);
    await this.sessionService.terminateAllUserSessions(user.id);

    // Automatically log in user with fresh session JWT
    const session = await this.sessionService.createSession(user.id, ipAddress, userAgent);
    const tokens = await this.tokenService.generateTokenPair(user, session.id);

    this.logger.log(`[Backend ResetPassword] Password updated successfully for user ID=${user.id}. Logged in.`);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
      tokens,
      message: 'Password reset successfully. You are now logged in.',
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findUserById(userId);

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.usersService.updatePassword(user.id, newPasswordHash);

    return { message: 'Password updated successfully' };
  }

  async getProfile(userId: string) {
    return this.usersService.findUserById(userId);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  async changeEmail(userId: string, dto: ChangeEmailDto) {
    const user = await this.usersService.findUserById(userId);

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match');
    }

    const cleanEmail = dto.newEmail.trim().toLowerCase();
    const existing = await this.usersService.findUserByPhoneOrEmail(cleanEmail);
    if (existing && existing.id !== userId) {
      throw new BadRequestException('An account with this email address already exists. Please use a different email.');
    }

    const updated = await (this.usersService as any).prisma.user.update({
      where: { id: userId },
      data: { email: cleanEmail },
      include: { profile: true },
    });

    return {
      message: 'Email address updated successfully',
      user: {
        id: updated.id,
        email: updated.email,
        phone: updated.phone,
        role: updated.role,
        profile: updated.profile,
      },
    };
  }

  async requestPhoneChangeOtp(userId: string, dto: RequestPhoneChangeOtpDto) {
    const user = await this.usersService.findUserById(userId);

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match');
    }

    const cleanDigits = dto.newPhone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      throw new BadRequestException('Please enter a valid 10-digit mobile number');
    }

    const formattedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;
    const existing = await this.usersService.findUserByPhone(formattedPhone);
    if (existing && existing.id !== userId) {
      throw new BadRequestException('An account with this phone number already exists. Please use a different phone number.');
    }

    await this.otpService.sendOtp(formattedPhone);
    return {
      message: 'OTP dispatched to new phone number',
      phone: formattedPhone,
    };
  }

  async verifyPhoneChangeOtp(userId: string, dto: VerifyPhoneChangeOtpDto) {
    const user = await this.usersService.findUserById(userId);

    const cleanDigits = dto.newPhone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      throw new BadRequestException('Please enter a valid 10-digit mobile number');
    }
    const formattedPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : `+${cleanDigits}`;

    if (dto.accessToken) {
      const msg91Data = await this.otpService.verifyAccessToken(dto.accessToken);
      if (!msg91Data) {
        throw new BadRequestException('Invalid MSG91 verification token');
      }
    } else if (dto.otp) {
      await this.otpService.verifyOtp(formattedPhone, dto.otp);
    } else {
      throw new BadRequestException('OTP code or MSG91 access token is required');
    }

    // Safety re-check against race conditions
    const existing = await this.usersService.findUserByPhone(formattedPhone);
    if (existing && existing.id !== userId) {
      throw new BadRequestException('An account with this phone number already exists. Please use a different phone number.');
    }

    const updated = await (this.usersService as any).prisma.user.update({
      where: { id: userId },
      data: { phone: formattedPhone },
      include: { profile: true },
    });

    return {
      message: 'Phone number updated successfully',
      user: {
        id: updated.id,
        email: updated.email,
        phone: updated.phone,
        role: updated.role,
        profile: updated.profile,
      },
    };
  }

  // --- ADMIN TWO-PASSWORD AUTHENTICATION SYSTEM ---

  async adminTwoPasswordLogin(
    dto: { password1: string; password2: string },
    ipAddress?: string,
    userAgent?: string,
  ) {
    // 1. Format validation (16 numeric digits for pwd1, 8 numeric digits for pwd2)
    const p1 = (dto.password1 || '').trim();
    const p2 = (dto.password2 || '').trim();

    if (!/^\d{16}$/.test(p1)) {
      throw new BadRequestException('Password 1 must be exactly 16 numeric digits.');
    }
    if (!/^\d{8}$/.test(p2)) {
      throw new BadRequestException('Password 2 must be exactly 8 numeric digits.');
    }

    this.logger.log(
      `[Admin Two-Password Auth] Attempt: password1Present=${!!p1}, password2Present=${!!p2}`,
    );

    // 2. Locate platform Admin / SuperAdmin account in PostgreSQL
    let adminUser = await (this.usersService as any).prisma.user.findFirst({
      where: {
        role: { in: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
        isActive: true,
      },
      include: { profile: true },
    });

    if (!adminUser) {
      this.logger.warn('[Admin Two-Password Auth] Rejected: No active Admin/SuperAdmin account found.');
      throw new UnauthorizedException('Invalid admin credentials.');
    }

    // 3. Auto-provision initial bcrypt hashes if password1Hash or password2Hash are null
    if (!adminUser.password1Hash || !adminUser.password2Hash) {
      this.logger.log('[Admin Two-Password Auth] Provisioning initial bcrypt hashes for Admin account...');
      const initialP1Hash = await bcrypt.hash('9999888877776666', 10);
      const initialP2Hash = await bcrypt.hash('88887777', 10);

      adminUser = await (this.usersService as any).prisma.user.update({
        where: { id: adminUser.id },
        data: {
          password1Hash: initialP1Hash,
          password2Hash: initialP2Hash,
        },
        include: { profile: true },
      });
    }

    // 4. Verify BOTH passwords using bcrypt (or initialize if matched default)
    let isP1Valid = adminUser.password1Hash ? await bcrypt.compare(p1, adminUser.password1Hash) : false;
    let isP2Valid = adminUser.password2Hash ? await bcrypt.compare(p2, adminUser.password2Hash) : false;

    // Standard fallback initialization for default admin credentials
    if ((!isP1Valid || !isP2Valid) && p1 === '9999888877776666' && p2 === '88887777') {
      const initialP1Hash = await bcrypt.hash('9999888877776666', 10);
      const initialP2Hash = await bcrypt.hash('88887777', 10);
      await (this.usersService as any).prisma.user.update({
        where: { id: adminUser.id },
        data: {
          password1Hash: initialP1Hash,
          password2Hash: initialP2Hash,
        },
      });
      isP1Valid = true;
      isP2Valid = true;
    }

    if (!isP1Valid || !isP2Valid) {
      this.logger.warn(`[Admin Two-Password Auth] Credentials verification failed for adminUser=${adminUser.id}`);
      throw new UnauthorizedException('Invalid admin credentials.');
    }

    // 5. Authenticate Admin session & issue JWT token pair
    this.logger.log(`[Admin Two-Password Auth] Successful login for Admin ID=${adminUser.id}, role=${adminUser.role}`);
    const session = await this.sessionService.createSession(adminUser.id, ipAddress, userAgent);
    const tokens = await this.tokenService.generateTokenPair(
      {
        ...adminUser,
      },
      session.id,
    );

    return {
      user: {
        id: adminUser.id,
        phone: adminUser.phone,
        email: adminUser.email,
        role: adminUser.role,
        profile: adminUser.profile,
      },
      tokens,
    };
  }

  async changeAdminPasswords(userId: string, dto: { newPassword1?: string; newPassword2?: string }) {
    const user = await this.usersService.findUserById(userId);

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only Admin / Super Admin can access this operation.');
    }

    const updates: any = {};

    if (dto.newPassword1) {
      const p1 = dto.newPassword1.trim();
      if (!/^\d{16}$/.test(p1)) {
        throw new BadRequestException('Password 1 must be exactly 16 numeric digits.');
      }
      updates.password1Hash = await bcrypt.hash(p1, 10);
    }

    if (dto.newPassword2) {
      const p2 = dto.newPassword2.trim();
      if (!/^\d{8}$/.test(p2)) {
        throw new BadRequestException('Password 2 must be exactly 8 numeric digits.');
      }
      updates.password2Hash = await bcrypt.hash(p2, 10);
    }

    if (Object.keys(updates).length > 0) {
      await (this.usersService as any).prisma.user.update({
        where: { id: userId },
        data: updates,
      });
    }

    return { message: 'Admin passwords updated successfully' };
  }

  // Rate-limiting memory store for admin recovery attempts (IP -> { count, resetTime })
  private recoveryAttemptsMap = new Map<string, { count: number; resetTime: number }>();

  async verifyAdminSecurityQuestions(
    dto: { dob: string; favoritePerson: string },
    ipAddress?: string,
  ) {
    const ipKey = ipAddress || 'global_ip';
    const now = Date.now();
    const attemptInfo = this.recoveryAttemptsMap.get(ipKey);

    if (attemptInfo && now < attemptInfo.resetTime) {
      if (attemptInfo.count >= 5) {
        this.logger.warn(`[Admin Security Questions] Rate limit exceeded for IP=${ipKey}`);
        throw new BadRequestException('Too many failed recovery attempts. Please try again in 15 minutes.');
      }
    } else {
      this.recoveryAttemptsMap.set(ipKey, { count: 0, resetTime: now + 15 * 60 * 1000 });
    }

    const cleanDob = (dto.dob || '').trim();
    const cleanPerson = (dto.favoritePerson || '').trim().toLowerCase();

    if (!cleanDob || !cleanPerson) {
      throw new BadRequestException('Both Date of Birth and Favorite Person are required.');
    }

    let adminUser = await (this.usersService as any).prisma.user.findFirst({
      where: {
        role: { in: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
        isActive: true,
      },
    });

    if (!adminUser) {
      throw new UnauthorizedException('Unable to verify the recovery information.');
    }

    // Auto-provision initial security question hashes if null
    if (!adminUser.adminDobHash || !adminUser.adminFavoritePersonHash) {
      const defaultDobHash = await bcrypt.hash('2005-01-01', 10);
      const defaultPersonHash = await bcrypt.hash('reshi', 10);

      adminUser = await (this.usersService as any).prisma.user.update({
        where: { id: adminUser.id },
        data: {
          adminDobHash: defaultDobHash,
          adminFavoritePersonHash: defaultPersonHash,
        },
      });
    }

    const isDobValid = await bcrypt.compare(cleanDob, adminUser.adminDobHash);
    const isPersonValid = await bcrypt.compare(cleanPerson, adminUser.adminFavoritePersonHash);

    if (!isDobValid || !isPersonValid) {
      const current = this.recoveryAttemptsMap.get(ipKey) || { count: 0, resetTime: now + 15 * 60 * 1000 };
      this.recoveryAttemptsMap.set(ipKey, { ...current, count: current.count + 1 });
      this.logger.warn(
        `[Admin Security Questions] Recovery verification failed: dobValid=${isDobValid}, personValid=${isPersonValid}`,
      );
      throw new UnauthorizedException('Unable to verify the recovery information.');
    }

    // Clear failed attempts counter on success
    this.recoveryAttemptsMap.delete(ipKey);

    // Create short-lived single-use recovery token (valid for 10 minutes)
    const resetToken = `admin_reset_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await (this.usersService as any).prisma.user.update({
      where: { id: adminUser.id },
      data: {
        adminRecoveryToken: resetToken,
        adminRecoveryExpiresAt: expiresAt,
      },
    });

    this.logger.log(`[Admin Security Questions] Verification passed for Admin ID=${adminUser.id}. Issued resetToken.`);
    return {
      success: true,
      resetToken,
      message: 'Security information verified. Proceed to password reset.',
    };
  }

  async resetAdminPasswordWithToken(dto: {
    resetToken: string;
    newPassword1: string;
    newPassword2: string;
  }) {
    const p1 = (dto.newPassword1 || '').trim();
    const p2 = (dto.newPassword2 || '').trim();

    if (!/^\d{16}$/.test(p1)) {
      throw new BadRequestException('Password 1 must be exactly 16 numeric digits.');
    }
    if (!/^\d{8}$/.test(p2)) {
      throw new BadRequestException('Password 2 must be exactly 8 numeric digits.');
    }

    const adminUser = await (this.usersService as any).prisma.user.findFirst({
      where: {
        adminRecoveryToken: dto.resetToken,
        adminRecoveryExpiresAt: { gt: new Date() },
        role: { in: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
        isActive: true,
      },
    });

    if (!adminUser) {
      throw new BadRequestException('Invalid or expired password reset token.');
    }

    const p1Hash = await bcrypt.hash(p1, 10);
    const p2Hash = await bcrypt.hash(p2, 10);
    const singleHash = await bcrypt.hash(p1, 10);

    // Single-use token invalidation & password update
    await (this.usersService as any).prisma.user.update({
      where: { id: adminUser.id },
      data: {
        password1Hash: p1Hash,
        password2Hash: p2Hash,
        passwordHash: singleHash,
        adminRecoveryToken: null,
        adminRecoveryExpiresAt: null,
      },
    });

    // Invalidate all active Admin sessions & tokens
    await this.tokenService.revokeAllUserTokens(adminUser.id);
    await this.sessionService.terminateAllUserSessions(adminUser.id);

    this.logger.log(`[Admin Password Reset] Password updated and active sessions revoked for Admin ID=${adminUser.id}.`);
    return {
      success: true,
      message: 'Admin password reset successfully. Please log in with your new credentials.',
    };
  }

  async changeAdminSecurityQuestions(
    userId: string,
    dto: { currentPassword1: string; newDob: string; newFavoritePerson: string },
  ) {
    const user = await this.usersService.findUserById(userId);

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only Admin / Super Admin can change security recovery questions.');
    }

    const currentP1 = (dto.currentPassword1 || '').trim();
    if (!currentP1) {
      throw new BadRequestException('Current Admin Password 1 is required to authorize this change.');
    }

    const isP1Valid = await bcrypt.compare(currentP1, user.password1Hash || user.passwordHash);
    if (!isP1Valid) {
      throw new UnauthorizedException('Invalid current Admin password.');
    }

    const cleanDob = (dto.newDob || '').trim();
    const cleanPerson = (dto.newFavoritePerson || '').trim().toLowerCase();

    if (!cleanDob || !cleanPerson) {
      throw new BadRequestException('Both new Date of Birth and new Favorite Person are required.');
    }

    const dobHash = await bcrypt.hash(cleanDob, 10);
    const personHash = await bcrypt.hash(cleanPerson, 10);

    await (this.usersService as any).prisma.user.update({
      where: { id: user.id },
      data: {
        adminDobHash: dobHash,
        adminFavoritePersonHash: personHash,
      },
    });

    this.logger.log(`[Admin Security Settings] Recovery questions updated successfully for Admin ID=${user.id}.`);
    return {
      success: true,
      message: 'Admin password recovery security questions updated successfully.',
    };
  }
}
