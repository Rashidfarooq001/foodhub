import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  PrivacyConsentType,
  PrivacyRequestType,
  PrivacyRequestStatus,
  ComplaintCategory,
  ComplaintStatus,
  IncidentSeverity,
  IncidentStatus,
  UserRole,
} from '@prisma/client';
import {
  RecordConsentDto,
  WithdrawConsentDto,
  CreatePrivacyRequestDto,
  UpdatePrivacyRequestDto,
  CreatePrivacyComplaintDto,
  UpdatePrivacyComplaintDto,
  CreateBreachIncidentDto,
  UpdateBreachIncidentDto,
} from './dto/privacy.dto';

export interface DataInventoryCategory {
  categoryName: string;
  userType: 'CUSTOMER' | 'RESTAURANT_OWNER' | 'DELIVERY_PARTNER' | 'ADMIN' | 'ALL';
  fields: string[];
  purpose: string;
  legalBasis: string;
  retentionPeriod: string;
  accessRoles: string[];
  sharingRecipients: string[];
  requiresExplicitConsent: boolean;
}

export interface VendorSubprocessorItem {
  name: string;
  serviceCategory: string;
  purpose: string;
  dataProcessed: string[];
  countryOfProcessing: string;
  contractStatus: 'ACTIVE' | 'STANDARD_CONTRACTUAL_CLAUSES';
  status: 'ACTIVE' | 'INACTIVE';
  lastAudited: string;
}

@Injectable()
export class PrivacyService {
  private readonly logger = new Logger(PrivacyService.name);

  constructor(private readonly prisma: PrismaService) {}

  // -----------------------------------------------------------------------
  // 1. DATA INVENTORY & VENDOR SUBPROCESSOR CATALOG
  // -----------------------------------------------------------------------
  getDataInventory(): DataInventoryCategory[] {
    return [
      {
        categoryName: 'Customer Account & Identity',
        userType: 'CUSTOMER',
        fields: ['Full Name', 'Phone Number', 'Email Address', 'Bcrypt Password Hash', 'Profile Avatar URL'],
        purpose: 'Authentication, session authorization, communication, customer identification',
        legalBasis: 'Performance of Contract / User Consent (DPDP Act 2023)',
        retentionPeriod: 'Duration of active account + 180 days post-deletion grace period',
        accessRoles: ['CUSTOMER (Self)', 'ADMIN', 'SUPER_ADMIN'],
        sharingRecipients: ['Assigned Delivery Rider (Name only)', 'Selected Restaurant (Name only)'],
        requiresExplicitConsent: true,
      },
      {
        categoryName: 'Saved Delivery Addresses & Locality Data',
        userType: 'CUSTOMER',
        fields: ['Address Line 1', 'Address Line 2', 'Landmark', 'City', 'State', 'Postal Code', 'Latitude', 'Longitude'],
        purpose: 'Hyper-local distance calculation, delivery fee quote, courier routing',
        legalBasis: 'Performance of Contract',
        retentionPeriod: 'Duration of active account or until deleted by user',
        accessRoles: ['CUSTOMER (Self)', 'ADMIN', 'COURIER (Active Order Delivery only)'],
        sharingRecipients: ['Assigned Courier Partner during active delivery'],
        requiresExplicitConsent: true,
      },
      {
        categoryName: 'Orders & Financial Transactions',
        userType: 'CUSTOMER',
        fields: ['Order Number', 'Ordered Items & Variants', 'Item Prices', 'Delivery Fee', 'Taxes (GST)', 'Total Amount', 'Payment Method', 'Payment Gateway ID', 'Status History'],
        purpose: 'Order fulfillment, statutory taxation (GST), accounting reconciliation, dispute management',
        legalBasis: 'Legal Obligation (Income Tax Act 1961, GST Act 2017) & Contract',
        retentionPeriod: '8 Years (Mandatory statutory financial retention)',
        accessRoles: ['CUSTOMER (Self)', 'RESTAURANT_OWNER (Own orders)', 'ADMIN', 'FINANCE'],
        sharingRecipients: ['Payment Gateway (Razorpay)', 'Selected Merchant', 'Tax Authorities on lawful demand'],
        requiresExplicitConsent: false,
      },
      {
        categoryName: 'Restaurant Merchant KYC & Commercial Data',
        userType: 'RESTAURANT_OWNER',
        fields: ['Owner Legal Name', 'Phone', 'Email', 'Restaurant Name', 'Address', 'GPS Coordinates', 'FSSAI License', 'GSTIN', 'PAN', 'Bank Account / IFSC / UPI'],
        purpose: 'FSSAI food safety compliance, merchant verification, settlement bank payouts',
        legalBasis: 'FSSAI Act 2006, GST Act 2017 & Commercial Contract',
        retentionPeriod: 'Duration of merchant agreement + 8 Years financial records',
        accessRoles: ['RESTAURANT_OWNER (Self)', 'ADMIN', 'FINANCE'],
        sharingRecipients: ['Bank / Settlement Payout Provider', 'Customers (Public Menu & FSSAI on listing)'],
        requiresExplicitConsent: true,
      },
      {
        categoryName: 'Delivery Courier Partner KYC & Realtime Telematics',
        userType: 'DELIVERY_PARTNER',
        fields: ['Driver Legal Name', 'Phone', 'Email', 'Driving License (DL)', 'Vehicle Registration (RC)', 'Vehicle Type', 'Bank Details / UPI', 'Realtime Duty GPS Coordinates'],
        purpose: 'Courier verification, motor vehicle compliance, live delivery dispatch, rider payouts',
        legalBasis: 'Motor Vehicles Act 1988 & Logistics Agreement',
        retentionPeriod: 'KYC: Contract duration + 3 Years; Live GPS tracks: Purged within 30 days of delivery completion',
        accessRoles: ['DELIVERY_PARTNER (Self)', 'ADMIN'],
        sharingRecipients: ['Customers (Live GPS while order is OUT_FOR_DELIVERY)'],
        requiresExplicitConsent: true,
      },
      {
        categoryName: 'Session Tokens & Security Audit Logs',
        userType: 'ALL',
        fields: ['IP Address', 'User Agent', 'Device Category', 'Login Timestamps', 'JWT Session Hashes', 'Audit Action Records'],
        purpose: 'Cybersecurity, rate-limiting, prevention of unauthorized account access, tamper-evident audit trails',
        legalBasis: 'Legitimate Use / Information Technology Act 2000',
        retentionPeriod: '1 Year active retention',
        accessRoles: ['ADMIN', 'SUPER_ADMIN'],
        sharingRecipients: ['CERT-In / Law Enforcement Authorities upon valid court order'],
        requiresExplicitConsent: false,
      },
    ];
  }

  getVendorInventory(): VendorSubprocessorItem[] {
    return [
      {
        name: 'Razorpay Software Private Limited',
        serviceCategory: 'Payment Gateway & Escrow Processing',
        purpose: 'Processing online card, UPI, net-banking transactions and issuing automated refunds',
        dataProcessed: ['Order ID', 'Billing Amount', 'Customer Contact Details', 'Payment Tokens'],
        countryOfProcessing: 'India (RBI Compliant)',
        contractStatus: 'ACTIVE',
        status: 'ACTIVE',
        lastAudited: '2026-01-15',
      },
      {
        name: 'Render Services Inc. / Cloud Hosting',
        serviceCategory: 'Application Infrastructure & Compute',
        purpose: 'Containerized execution of backend NestJS APIs, WebSocket gateways, and worker nodes',
        dataProcessed: ['Encrypted API Payloads', 'Server Telemetry', 'Request Logs'],
        countryOfProcessing: 'Global Cloud / India Region',
        contractStatus: 'ACTIVE',
        status: 'ACTIVE',
        lastAudited: '2026-02-01',
      },
      {
        name: 'PostgreSQL Database Provider (Supabase/Neon/Self-Hosted)',
        serviceCategory: 'Primary Relational Database',
        purpose: 'Encrypted relational database storage for platform users, orders, menus, and financial records',
        dataProcessed: ['All Application Relational Records (At-Rest Encrypted)'],
        countryOfProcessing: 'India / Regional Cloud Zone',
        contractStatus: 'ACTIVE',
        status: 'ACTIVE',
        lastAudited: '2026-02-01',
      },
      {
        name: 'Vercel Inc.',
        serviceCategory: 'Edge Delivery & Frontend Hosting',
        purpose: 'Hosting and serving Next.js customer web and admin portals with SSL/TLS encryption',
        dataProcessed: ['Static Assets', 'Edge Request Routing Data', 'CDN Caches'],
        countryOfProcessing: 'Global Edge Network / India Points of Presence',
        contractStatus: 'ACTIVE',
        status: 'ACTIVE',
        lastAudited: '2026-01-20',
      },
      {
        name: 'OpenStreetMap / Nominatim Community Service',
        serviceCategory: 'Reverse Geocoding & Place Validation',
        purpose: 'Resolving GPS coordinates to town/village names in Jammu & Kashmir without storing personal profiles',
        dataProcessed: ['Raw Latitude & Longitude Query Parameters'],
        countryOfProcessing: 'Open Geospatial Network',
        contractStatus: 'STANDARD_CONTRACTUAL_CLAUSES',
        status: 'ACTIVE',
        lastAudited: '2026-01-10',
      },
    ];
  }

  getRetentionPolicies() {
    return [
      {
        category: 'CUSTOMER_PROFILE',
        description: 'Customer account information, contact numbers, and preferences',
        retentionDays: 180,
        legalBasis: 'User Consent / DPDP Act 2023 (Purged 180 days after confirmed deletion request)',
      },
      {
        category: 'ORDER_FINANCIAL_RECORDS',
        description: 'Completed order invoices, GST tax breakdowns, and payment gateway references',
        retentionDays: 2920, // 8 Years
        legalBasis: 'Mandatory Indian Tax & GST Regulations (Section 36 GST Act)',
      },
      {
        category: 'REALTIME_COURIER_GPS',
        description: 'High-frequency GPS location pings from active delivery couriers',
        retentionDays: 30,
        legalBasis: 'Operational Delivery Quality & Route Dispute Resolution',
      },
      {
        category: 'SECURITY_AUDIT_LOGS',
        description: 'Privacy operations audit trails, login records, and administrative actions',
        retentionDays: 365,
        legalBasis: 'IT Act 2000 & CERT-In Cyber Security Directions',
      },
      {
        category: 'SUPPORT_AND_GRIEVANCES',
        description: 'Customer grievance redressal tickets, complaint evidence, and resolution notes',
        retentionDays: 1095, // 3 Years
        legalBasis: 'Consumer Protection (E-Commerce) Rules 2020 Statutory Redressal Records',
      },
    ];
  }

  // -----------------------------------------------------------------------
  // 2. PRIVACY AUDIT LOGGING
  // -----------------------------------------------------------------------
  async recordAuditLog(params: {
    actorId?: string;
    actorRole?: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      // Redact any potential passwords/tokens from metadata
      const cleanMeta = { ...(params.metadata || {}) };
      delete cleanMeta.password;
      delete cleanMeta.passwordHash;
      delete cleanMeta.token;
      delete cleanMeta.accessToken;
      delete cleanMeta.refreshToken;

      return await this.prisma.privacyAuditLog.create({
        data: {
          actorId: params.actorId,
          actorRole: params.actorRole,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          metadata: cleanMeta,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (err: any) {
      this.logger.error(`Failed to create privacy audit log: ${err.message}`);
      return null;
    }
  }

  // -----------------------------------------------------------------------
  // 3. CONSENT MANAGEMENT
  // -----------------------------------------------------------------------
  async recordConsent(userId: string, dto: RecordConsentDto, ip?: string, ua?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User account not found');

    const version = dto.version || '1.0';

    const consent = await this.prisma.privacyConsent.upsert({
      where: {
        userId_consentType_version: {
          userId,
          consentType: dto.consentType,
          version,
        },
      },
      create: {
        userId,
        consentType: dto.consentType,
        purpose: dto.purpose,
        version,
        granted: dto.granted,
        grantedAt: new Date(),
        acceptedAt: dto.granted ? new Date() : null,
        withdrawnAt: dto.granted ? null : new Date(),
        source: dto.source || 'WEB_APP',
        ipAddress: ip,
        userAgent: ua,
        metadata: dto.metadata || {},
      },
      update: {
        granted: dto.granted,
        purpose: dto.purpose,
        acceptedAt: dto.granted ? new Date() : undefined,
        withdrawnAt: dto.granted ? null : new Date(),
        ipAddress: ip,
        userAgent: ua,
        metadata: dto.metadata || {},
      },
    });

    await this.recordAuditLog({
      actorId: userId,
      actorRole: user.role,
      action: dto.granted ? 'CONSENT_GRANTED' : 'CONSENT_DENIED',
      entity: 'PrivacyConsent',
      entityId: consent.id,
      metadata: { consentType: dto.consentType, version: consent.version },
      ipAddress: ip,
      userAgent: ua,
    });

    return consent;
  }

  async withdrawConsent(userId: string, dto: WithdrawConsentDto, ip?: string, ua?: string) {
    const existing = await this.prisma.privacyConsent.findFirst({
      where: {
        userId,
        consentType: dto.consentType,
        granted: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!existing) {
      throw new NotFoundException('No active consent record found for this category');
    }

    // Essential service notices cannot be withdrawn without deleting the account
    if (
      dto.consentType === PrivacyConsentType.TERMS_AND_PRIVACY_NOTICE ||
      dto.consentType === PrivacyConsentType.TERMS_AND_CONDITIONS ||
      dto.consentType === PrivacyConsentType.PRIVACY_POLICY
    ) {
      throw new BadRequestException(
        'Essential legal terms and privacy acknowledgments cannot be withdrawn independently. To withdraw all legal consent, submit an Account Deletion (Erasure) request.',
      );
    }

    const updated = await this.prisma.privacyConsent.update({
      where: { id: existing.id },
      data: {
        granted: false,
        withdrawnAt: new Date(),
        metadata: {
          ...(typeof existing.metadata === 'object' && existing.metadata ? (existing.metadata as object) : {}),
          withdrawalReason: dto.reason || 'User opted out via Privacy Center',
        },
      },
    });

    await this.recordAuditLog({
      actorId: userId,
      action: 'CONSENT_WITHDRAWN',
      entity: 'PrivacyConsent',
      entityId: updated.id,
      metadata: { consentType: dto.consentType, reason: dto.reason },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  async getUserPrivacyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        privacyConsents: true,
        privacyRequests: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        privacyComplaints: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const addressCount = await this.prisma.customerAddress.count({ where: { customerId: userId } });
    const orderCount = await this.prisma.order.count({ where: { customerId: userId } });

    return {
      userId: user.id,
      role: user.role,
      phone: user.phone,
      email: user.email,
      fullName: user.profile ? `${user.profile.firstName} ${user.profile.lastName}`.trim() : '',
      createdAt: user.createdAt,
      isActive: user.isActive,
      metrics: {
        savedAddresses: addressCount,
        totalOrders: orderCount,
      },
      consents: user.privacyConsents,
      recentRequests: user.privacyRequests,
      recentComplaints: user.privacyComplaints,
    };
  }

  // -----------------------------------------------------------------------
  // 4. DATA ACCESS EXPORT (PORTABILITY UNDER DPDP ACT)
  // -----------------------------------------------------------------------
  async exportUserData(userId: string, ip?: string, ua?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        privacyConsents: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const addresses = await this.prisma.customerAddress.findMany({
      where: { customerId: userId },
      select: {
        id: true,
        addressLabel: true,
        addressLine1: true,
        addressLine2: true,
        landmark: true,
        city: true,
        state: true,
        postalCode: true,
        createdAt: true,
      },
    });

    const orders = await this.prisma.order.findMany({
      where: { customerId: userId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        paymentMethod: true,
        paymentStatus: true,
        createdAt: true,
        restaurant: {
          select: {
            name: true,
          },
        },
        orderItems: {
          select: {
            variantName: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            itemSnapshot: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    let reviews: any[] = [];
    try {
      reviews = await this.prisma.restaurantReview.findMany({
        where: { customerId: userId },
        select: {
          id: true,
          orderId: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
      });
    } catch {
      reviews = [];
    }

    await this.recordAuditLog({
      actorId: userId,
      actorRole: user.role,
      action: 'DATA_ACCESS_EXPORT',
      entity: 'User',
      entityId: userId,
      metadata: { orderCount: orders.length, addressCount: addresses.length },
      ipAddress: ip,
      userAgent: ua,
    });

    return {
      exportMetadata: {
        platform: 'Zayka Food',
        exportedAt: new Date().toISOString(),
        dataPrincipalId: user.id,
        governingLaw: 'Digital Personal Data Protection Act, 2023 (India)',
        exportFormat: 'JSON - Structured Machine-Readable',
      },
      personalProfile: {
        fullName: user.profile ? `${user.profile.firstName} ${user.profile.lastName}`.trim() : '',
        phone: user.phone,
        email: user.email,
        gender: user.profile?.gender || 'NOT_SPECIFIED',
        registeredAt: user.createdAt,
      },
      savedDeliveryAddresses: addresses,
      orderHistorySummary: orders,
      customerReviews: reviews,
      recordedConsents: user.privacyConsents.map((c) => ({
        consentType: c.consentType,
        purpose: c.purpose,
        version: c.version,
        granted: c.granted,
        grantedAt: c.grantedAt,
        withdrawnAt: c.withdrawnAt,
      })),
    };
  }

  // -----------------------------------------------------------------------
  // 5. PRIVACY REQUEST LIFECYCLE (ACCESS, CORRECTION, DELETION)
  // -----------------------------------------------------------------------
  async createPrivacyRequest(userId: string, dto: CreatePrivacyRequestDto, ip?: string, ua?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const request = await this.prisma.privacyRequest.create({
      data: {
        userId,
        type: dto.type,
        status: PrivacyRequestStatus.PENDING,
        reason: dto.reason,
        requestedData: dto.requestedData || {},
        correctionData: dto.correctionData || {},
      },
    });

    await this.recordAuditLog({
      actorId: userId,
      actorRole: user.role,
      action: `PRIVACY_REQUEST_CREATED_${dto.type}`,
      entity: 'PrivacyRequest',
      entityId: request.id,
      metadata: { type: dto.type, reason: dto.reason },
      ipAddress: ip,
      userAgent: ua,
    });

    return request;
  }

  async getUserPrivacyRequests(userId: string) {
    return this.prisma.privacyRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // -----------------------------------------------------------------------
  // 6. COMPLAINTS & GRIEVANCE REDRESSAL
  // -----------------------------------------------------------------------
  async createPrivacyComplaint(dto: CreatePrivacyComplaintDto, userId?: string, ip?: string, ua?: string) {
    const complaint = await this.prisma.privacyComplaint.create({
      data: {
        userId: userId || null,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        orderNumber: dto.orderNumber,
        category: dto.category,
        subject: dto.subject,
        description: dto.description,
        evidenceUrls: dto.evidenceUrls || [],
        status: ComplaintStatus.RECEIVED,
      },
    });

    await this.recordAuditLog({
      actorId: userId,
      action: 'PRIVACY_COMPLAINT_SUBMITTED',
      entity: 'PrivacyComplaint',
      entityId: complaint.id,
      metadata: { category: dto.category, subject: dto.subject },
      ipAddress: ip,
      userAgent: ua,
    });

    return complaint;
  }

  async getUserComplaints(userId: string) {
    return this.prisma.privacyComplaint.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // -----------------------------------------------------------------------
  // 7. ADMIN PRIVACY MANAGEMENT & WORKFLOWS
  // -----------------------------------------------------------------------
  async adminListRequests(query: { type?: PrivacyRequestType; status?: PrivacyRequestStatus }) {
    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;

    return this.prisma.privacyRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            role: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async adminUpdatePrivacyRequest(
    requestId: string,
    dto: UpdatePrivacyRequestDto,
    adminId: string,
    ip?: string,
    ua?: string,
  ) {
    const existing = await this.prisma.privacyRequest.findUnique({ where: { id: requestId } });
    if (!existing) throw new NotFoundException('Privacy request not found');

    const updateData: any = {};
    if (dto.status) updateData.status = dto.status;
    if (dto.rejectionReason) updateData.rejectionReason = dto.rejectionReason;
    if (dto.responsePayload) updateData.responsePayload = dto.responsePayload;
    if (dto.assignedTo) updateData.assignedTo = dto.assignedTo;

    if (dto.status === PrivacyRequestStatus.COMPLETED) {
      updateData.completedAt = new Date();
    } else if (dto.status === PrivacyRequestStatus.REJECTED) {
      updateData.rejectedAt = new Date();
    } else if (dto.status === PrivacyRequestStatus.VERIFIED) {
      updateData.verifiedAt = new Date();
    }

    const updated = await this.prisma.privacyRequest.update({
      where: { id: requestId },
      data: updateData,
    });

    await this.recordAuditLog({
      actorId: adminId,
      actorRole: 'ADMIN',
      action: 'ADMIN_UPDATE_PRIVACY_REQUEST',
      entity: 'PrivacyRequest',
      entityId: requestId,
      metadata: { newStatus: dto.status, assignedTo: dto.assignedTo },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  // Execute safe database transaction for customer account deletion & anonymization
  async executeSafeAccountDeletion(requestId: string, adminId: string, ip?: string, ua?: string) {
    const request = await this.prisma.privacyRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) throw new NotFoundException('Privacy request not found');
    if (request.type !== PrivacyRequestType.DATA_DELETION) {
      throw new BadRequestException('Can only execute deletion workflow on DATA_DELETION requests');
    }

    const targetUserId = request.userId;
    const targetUser = request.user;

    // Disallow deleting admin accounts via this flow
    if (targetUser.role === UserRole.ADMIN || targetUser.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Admin accounts cannot be deleted through customer privacy flow');
    }

    // Execute atomic deletion & ledger preservation transaction
    await this.prisma.$transaction(async (tx) => {
      // 1. Terminate all active sessions & refresh tokens
      await tx.refreshToken.deleteMany({ where: { userId: targetUserId } });
      await tx.session.deleteMany({ where: { userId: targetUserId } });
      await tx.otp.deleteMany({ where: { userId: targetUserId } });

      // 2. Delete saved delivery addresses (non-financial PII)
      await tx.customerAddress.deleteMany({ where: { customerId: targetUserId } });

      // 3. Clear profile avatar & PII
      if (await tx.profile.findUnique({ where: { userId: targetUserId } })) {
        await tx.profile.update({
          where: { userId: targetUserId },
          data: {
            firstName: 'Deleted',
            lastName: 'User',
            avatarUrl: null,
            fcmToken: null,
          },
        });
      }

      // 4. Anonymize user phone and email to release uniqueness constraint while preserving foreign key audit integrity
      const anonymizedPhone = `+9100000${Math.floor(10000 + Math.random() * 90000)}`;
      const anonymizedEmail = `deleted_${targetUserId.substring(0, 8)}@anonymized.zaykafood.local`;

      await tx.user.update({
        where: { id: targetUserId },
        data: {
          phone: anonymizedPhone,
          email: anonymizedEmail,
          passwordHash: 'DELETED_ACCOUNT_INACTIVE',
          isActive: false,
          deletedAt: new Date(),
        },
      });

      // 5. Mark PrivacyRequest as COMPLETED
      await tx.privacyRequest.update({
        where: { id: requestId },
        data: {
          status: PrivacyRequestStatus.COMPLETED,
          completedAt: new Date(),
          responsePayload: {
            message: 'User account and personal delivery addresses permanently purged and anonymized. Financial orders preserved in accordance with Section 36 of GST Act 2017.',
            anonymizedAt: new Date().toISOString(),
          },
        },
      });
    });

    await this.recordAuditLog({
      actorId: adminId,
      actorRole: 'ADMIN',
      action: 'ADMIN_EXECUTED_SAFE_ACCOUNT_DELETION',
      entity: 'User',
      entityId: targetUserId,
      metadata: { requestId },
      ipAddress: ip,
      userAgent: ua,
    });

    return {
      success: true,
      message: 'Account safely deleted and anonymized. Financial audit integrity preserved.',
    };
  }

  // -----------------------------------------------------------------------
  // 8. ADMIN GRIEVANCE MANAGEMENT
  // -----------------------------------------------------------------------
  async adminListComplaints(status?: ComplaintStatus) {
    const where: any = {};
    if (status) where.status = status;

    return this.prisma.privacyComplaint.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async adminUpdateComplaint(
    complaintId: string,
    dto: UpdatePrivacyComplaintDto,
    adminId: string,
    ip?: string,
    ua?: string,
  ) {
    const existing = await this.prisma.privacyComplaint.findUnique({ where: { id: complaintId } });
    if (!existing) throw new NotFoundException('Complaint ticket not found');

    const updateData: any = {};
    if (dto.status) updateData.status = dto.status;
    if (dto.priority) updateData.priority = dto.priority;
    if (dto.assignedTo) updateData.assignedTo = dto.assignedTo;
    if (dto.resolution) {
      updateData.resolution = dto.resolution;
      updateData.resolvedAt = new Date();
    }

    const updated = await this.prisma.privacyComplaint.update({
      where: { id: complaintId },
      data: updateData,
    });

    await this.recordAuditLog({
      actorId: adminId,
      actorRole: 'ADMIN',
      action: 'ADMIN_UPDATE_COMPLAINT',
      entity: 'PrivacyComplaint',
      entityId: complaintId,
      metadata: { newStatus: dto.status, resolution: dto.resolution },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  // -----------------------------------------------------------------------
  // 9. DATA BREACH & SECURITY INCIDENT MANAGEMENT
  // -----------------------------------------------------------------------
  async adminCreateBreachIncident(dto: CreateBreachIncidentDto, adminId: string, ip?: string, ua?: string) {
    const incident = await this.prisma.dataBreachIncident.create({
      data: {
        incidentTitle: dto.incidentTitle,
        incidentType: dto.incidentType,
        severity: dto.severity,
        status: IncidentStatus.DETECTED,
        affectedRecordsCount: dto.affectedRecordsCount,
        affectedSystems: dto.affectedSystems,
        description: dto.description,
        mitigationSteps: dto.mitigationSteps,
        notificationRequired: dto.notificationRequired || false,
        assignedAdminId: adminId,
      },
    });

    await this.recordAuditLog({
      actorId: adminId,
      actorRole: 'ADMIN',
      action: 'ADMIN_RECORD_BREACH_INCIDENT',
      entity: 'DataBreachIncident',
      entityId: incident.id,
      metadata: { severity: dto.severity, type: dto.incidentType },
      ipAddress: ip,
      userAgent: ua,
    });

    return incident;
  }

  async adminListBreachIncidents() {
    return this.prisma.dataBreachIncident.findMany({
      orderBy: { detectedAt: 'desc' },
    });
  }

  async adminUpdateBreachIncident(
    incidentId: string,
    dto: UpdateBreachIncidentDto,
    adminId: string,
    ip?: string,
    ua?: string,
  ) {
    const existing = await this.prisma.dataBreachIncident.findUnique({ where: { id: incidentId } });
    if (!existing) throw new NotFoundException('Breach incident record not found');

    const updateData: any = {};
    if (dto.status) updateData.status = dto.status;
    if (dto.mitigationSteps) updateData.mitigationSteps = dto.mitigationSteps;
    if (dto.notificationRequired !== undefined) updateData.notificationRequired = dto.notificationRequired;
    if (dto.dpbiNotified !== undefined) {
      updateData.dpbiNotified = dto.dpbiNotified;
      updateData.notifiedAt = new Date();
    }
    if (dto.status === IncidentStatus.CONTAINED) {
      updateData.containedAt = new Date();
    } else if (dto.status === IncidentStatus.RESOLVED || dto.status === IncidentStatus.CLOSED) {
      updateData.resolvedAt = new Date();
    }

    const updated = await this.prisma.dataBreachIncident.update({
      where: { id: incidentId },
      data: updateData,
    });

    await this.recordAuditLog({
      actorId: adminId,
      actorRole: 'ADMIN',
      action: 'ADMIN_UPDATE_BREACH_INCIDENT',
      entity: 'DataBreachIncident',
      entityId: incidentId,
      metadata: { newStatus: dto.status, mitigation: dto.mitigationSteps },
      ipAddress: ip,
      userAgent: ua,
    });

    return updated;
  }

  // -----------------------------------------------------------------------
  // 10. PRIVACY AUDIT LOGS QUERY & RETENTION CLEANUP
  // -----------------------------------------------------------------------
  async adminListAuditLogs(limit = 100) {
    return this.prisma.privacyAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async adminListAuditLogsPaginated(params: {
    page?: number;
    limit?: number;
    search?: string;
    action?: string;
    actorId?: string;
    entity?: string;
    from?: string;
    to?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    const andClauses: any[] = [];

    if (params.action) {
      andClauses.push({ action: params.action });
    }
    if (params.actorId) {
      andClauses.push({ actorId: params.actorId });
    }
    if (params.entity) {
      andClauses.push({ entity: params.entity });
    }
    if (params.from || params.to) {
      const dateFilter: any = {};
      if (params.from) dateFilter.gte = new Date(params.from);
      if (params.to) dateFilter.lte = new Date(params.to);
      andClauses.push({ createdAt: dateFilter });
    }
    if (params.search) {
      const term = params.search.trim();
      andClauses.push({
        OR: [
          { action: { contains: term, mode: 'insensitive' } },
          { entity: { contains: term, mode: 'insensitive' } },
          { entityId: { contains: term } },
          { actorId: { contains: term } },
          { requestId: { contains: term } },
          { ipAddress: { contains: term } },
        ],
      });
    }

    if (andClauses.length > 0) {
      where.AND = andClauses;
    }

    const [items, total] = await Promise.all([
      this.prisma.privacyAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.privacyAuditLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async adminGetAuditLogDetails(id: string) {
    const log = await this.prisma.privacyAuditLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException('Audit log event not found');
    return log;
  }

  // -----------------------------------------------------------------------
  // 11. LEGAL CONSENT RECORDS & AUDITING (ADMIN)
  // -----------------------------------------------------------------------
  async adminListConsents(params: {
    page?: number;
    limit?: number;
    search?: string;
    consentType?: string;
    policyVersion?: string;
    status?: string;
    source?: string;
    from?: string;
    to?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    const andClauses: any[] = [];

    if (params.consentType) {
      andClauses.push({ consentType: params.consentType as PrivacyConsentType });
    }
    if (params.policyVersion) {
      andClauses.push({ version: params.policyVersion });
    }
    if (params.status === 'ACCEPTED') {
      andClauses.push({ granted: true });
    } else if (params.status === 'WITHDRAWN') {
      andClauses.push({ granted: false });
    }
    if (params.source) {
      andClauses.push({ source: params.source });
    }
    if (params.from || params.to) {
      const dateFilter: any = {};
      if (params.from) dateFilter.gte = new Date(params.from);
      if (params.to) dateFilter.lte = new Date(params.to);
      andClauses.push({ acceptedAt: dateFilter });
    }
    if (params.search) {
      const term = params.search.trim();
      andClauses.push({
        OR: [
          { id: { contains: term } },
          { userId: { contains: term } },
          { requestId: { contains: term } },
          { policyName: { contains: term, mode: 'insensitive' } },
          { user: { phone: { contains: term } } },
          { user: { email: { contains: term, mode: 'insensitive' } } },
          {
            user: {
              profile: {
                OR: [
                  { firstName: { contains: term, mode: 'insensitive' } },
                  { lastName: { contains: term, mode: 'insensitive' } },
                ],
              },
            },
          },
        ],
      });
    }

    if (andClauses.length > 0) {
      where.AND = andClauses;
    }

    const [items, total] = await Promise.all([
      this.prisma.privacyConsent.findMany({
        where,
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.privacyConsent.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async adminGetConsentDetails(id: string) {
    const consent = await this.prisma.privacyConsent.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!consent) {
      throw new NotFoundException('Legal consent record not found');
    }

    return consent;
  }

  // -----------------------------------------------------------------------
  // 12. CENTRAL POLICY VERSION REGISTRY
  // -----------------------------------------------------------------------
  async adminListPolicies() {
    const dbPolicies = await this.prisma.legalPolicyVersion.findMany({
      orderBy: { publishedAt: 'desc' },
    });

    const defaultPolicies = [
      {
        id: 'policy-terms-v1',
        policyType: PrivacyConsentType.TERMS_AND_CONDITIONS,
        policyName: 'Zayka Food Terms & Conditions',
        version: '1.0',
        status: 'ACTIVE',
        summary: 'General terms of service, customer ordering rules, restaurant delivery conditions, and liability policies for Zayka Food.',
        publishedAt: new Date('2026-08-21T00:00:00.000Z'),
      },
      {
        id: 'policy-privacy-v1',
        policyType: PrivacyConsentType.PRIVACY_POLICY,
        policyName: 'Zayka Food Privacy Policy',
        version: '1.0',
        status: 'ACTIVE',
        summary: 'Digital Personal Data Protection Act (DPDP Act 2023) compliant notice on personal data processing, purpose limitation, data retention, and user privacy rights.',
        publishedAt: new Date('2026-08-21T00:00:00.000Z'),
      },
    ];

    if (dbPolicies.length === 0) {
      return defaultPolicies;
    }

    return dbPolicies;
  }

  async adminGetPolicy(id: string) {
    const policy = await this.prisma.legalPolicyVersion.findUnique({ where: { id } });
    if (policy) return policy;

    const defaults = await this.adminListPolicies();
    const found = defaults.find((p) => p.id === id);
    if (!found) throw new NotFoundException('Policy version not found');
    return found;
  }

  async getUserConsents(userId: string) {
    return this.prisma.privacyConsent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async triggerRetentionCleanup(adminId: string, categories?: string[]) {
    this.logger.log(`Running automated privacy data retention cleanup triggered by admin: ${adminId}`);

    // Clean expired unverified OTPs (> 24 hours old)
    const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const deletedOtps = await this.prisma.otp.deleteMany({
      where: {
        createdAt: { lt: cutoff24h },
        isUsed: true,
      },
    });

    // Clean revoked/expired refresh tokens (> 30 days old)
    const cutoff30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const deletedTokens = await this.prisma.refreshToken.deleteMany({
      where: {
        isRevoked: true,
        createdAt: { lt: cutoff30d },
      },
    });

    await this.recordAuditLog({
      actorId: adminId,
      actorRole: 'ADMIN',
      action: 'ADMIN_TRIGGER_DATA_RETENTION_CLEANUP',
      entity: 'DataRetention',
      metadata: { deletedOtps: deletedOtps.count, deletedTokens: deletedTokens.count },
    });

    return {
      success: true,
      cleanedAt: new Date().toISOString(),
      summary: {
        expiredOtpsPurged: deletedOtps.count,
        revokedTokensPurged: deletedTokens.count,
        financialRecordsPreserved: 'All financial ledgers preserved for statutory 8-year tax compliance.',
      },
    };
  }
}
