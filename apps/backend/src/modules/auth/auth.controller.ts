import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SessionService } from '../sessions/session.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetTokenDto } from './dto/verify-reset-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { RequestPhoneChangeOtpDto, VerifyPhoneChangeOtpDto } from './dto/change-phone.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AdminTwoPasswordLoginDto } from './dto/admin-login.dto';
import { AdminChangePasswordsDto } from './dto/admin-change-passwords.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('Authentication & Authorization')
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  @Public()
  @Post('check-phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if phone number is available for registration' })
  @ApiResponse({ status: 200, description: 'Phone is available' })
  @ApiResponse({ status: 400, description: 'Phone is already registered' })
  async checkPhone(@Body('phone') phone: string) {
    return this.authService.checkPhoneAvailability(phone);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Public Customer Registration (name, address, phone, password)' })
  @ApiResponse({ status: 201, description: 'Customer registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate phone' })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const ua = req.headers['user-agent'];
    return this.authService.register(dto, ip, ua);
  }

  @Public()
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dispatch SMS OTP (Customer & Admin 2FA)' })
  @ApiResponse({ status: 200, description: 'OTP dispatched successfully' })
  @ApiResponse({ status: 400, description: 'Invalid phone or active cooldown period' })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phone);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify SMS OTP & authenticate customer session' })
  @ApiResponse({ status: 200, description: 'OTP verified, returns JWT tokens' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const ua = req.headers['user-agent'];
    return this.authService.verifyOtp(dto, ip, ua);
  }

  @Public()
  @Post('verify-widget')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify MSG91 Widget access token & authenticate customer session' })
  @ApiResponse({ status: 200, description: 'Widget token verified, returns JWT tokens' })
  async verifyWidget(@Body('accessToken') accessToken: string, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const ua = req.headers['user-agent'];
    return this.authService.verifyWidgetToken(accessToken, 'CUSTOMER', ip, ua);
  }

  @Public()
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin Dashboard Two-Password Authentication (16-digit P1 + 8-digit P2)' })
  @ApiResponse({ status: 200, description: 'Admin authenticated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid admin credentials' })
  async adminLogin(@Body() dto: AdminTwoPasswordLoginDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const ua = req.headers['user-agent'];
    return this.authService.adminTwoPasswordLogin(dto, ip, ua);
  }

  @Patch('admin/change-passwords')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update Admin Password 1 (16 digits) or Password 2 (8 digits)' })
  async changeAdminPasswords(
    @CurrentUser('id') userId: string,
    @Body() dto: AdminChangePasswordsDto,
  ) {
    return this.authService.changeAdminPasswords(userId, dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Password login for Merchant, Courier & Finance' })
  @ApiResponse({ status: 200, description: 'Authenticated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const ua = req.headers['user-agent'];
    return this.authService.login(dto, ip, ua);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current device session' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@CurrentUser() user: any) {
    return this.authService.logout(user.id, user.sessionId);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout all active device sessions' })
  @ApiResponse({ status: 200, description: 'All sessions terminated' })
  async logoutAll(@CurrentUser('id') userId: string) {
    return this.authService.logoutAll(userId);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate Refresh Token and issue new Access Token' })
  @ApiResponse({ status: 200, description: 'Token pair rotated successfully' })
  @ApiResponse({ status: 401, description: 'Revoked or expired refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset OTP' })
  @ApiResponse({ status: 200, description: 'Reset OTP dispatched' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const input = (dto.phone || dto.email || '').trim();
    return this.authService.forgotPassword(input);
  }

  @Public()
  @Post('verify-reset-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify MSG91 access token for password reset and issue short-lived resetToken' })
  @ApiResponse({ status: 200, description: 'Reset token issued successfully' })
  async verifyResetToken(@Body() dto: VerifyResetTokenDto) {
    return this.authService.verifyResetToken(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify reset token & set new password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Password policy violation or invalid token' })
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const ua = req.headers['user-agent'];
    return this.authService.resetPassword(dto, ip, ua);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password for authenticated user' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  async changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(userId, dto);
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch profile of authenticated user' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profile of authenticated user' })
  @ApiResponse({ status: 200, description: 'User profile updated' })
  async updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(userId, dto);
  }

  @Post('change-email')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Securely update registered email address after password verification' })
  @ApiResponse({ status: 200, description: 'Email address updated successfully' })
  async changeEmail(@CurrentUser('id') userId: string, @Body() dto: ChangeEmailDto) {
    return this.authService.changeEmail(userId, dto);
  }

  @Post('change-phone/request-otp')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request OTP for updating registered phone number' })
  @ApiResponse({ status: 200, description: 'OTP sent to new phone number' })
  async requestPhoneChangeOtp(
    @CurrentUser('id') userId: string,
    @Body() dto: RequestPhoneChangeOtpDto,
  ) {
    return this.authService.requestPhoneChangeOtp(userId, dto);
  }

  @Post('change-phone/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify OTP and update registered phone number' })
  @ApiResponse({ status: 200, description: 'Phone number updated successfully' })
  async verifyPhoneChangeOtp(
    @CurrentUser('id') userId: string,
    @Body() dto: VerifyPhoneChangeOtpDto,
  ) {
    return this.authService.verifyPhoneChangeOtp(userId, dto);
  }

  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all active login sessions for user' })
  @ApiResponse({ status: 200, description: 'Active session list retrieved' })
  async getSessions(@CurrentUser('id') userId: string) {
    return this.sessionService.getUserSessions(userId);
  }

  @Delete('session/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific active session by ID' })
  @ApiParam({ name: 'id', description: 'Session UUID' })
  @ApiResponse({ status: 200, description: 'Session revoked' })
  async terminateSession(@Param('id') sessionId: string, @CurrentUser('id') userId: string) {
    return this.sessionService.terminateSession(sessionId, userId);
  }
}
