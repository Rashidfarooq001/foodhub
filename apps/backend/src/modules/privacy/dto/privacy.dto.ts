import { IsString, IsBoolean, IsOptional, IsEnum, IsArray, IsObject, IsNumber, Min, Max } from 'class-validator';
import {
  PrivacyConsentType,
  PrivacyRequestType,
  PrivacyRequestStatus,
  ComplaintCategory,
  ComplaintStatus,
  IncidentSeverity,
  IncidentStatus,
  TicketPriority,
} from '@prisma/client';

export class RecordConsentDto {
  @IsEnum(PrivacyConsentType)
  consentType: PrivacyConsentType;

  @IsString()
  purpose: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsBoolean()
  granted: boolean;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class WithdrawConsentDto {
  @IsEnum(PrivacyConsentType)
  consentType: PrivacyConsentType;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreatePrivacyRequestDto {
  @IsEnum(PrivacyRequestType)
  type: PrivacyRequestType;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsObject()
  requestedData?: Record<string, any>;

  @IsOptional()
  @IsObject()
  correctionData?: Record<string, any>;
}

export class UpdatePrivacyRequestDto {
  @IsOptional()
  @IsEnum(PrivacyRequestStatus)
  status?: PrivacyRequestStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsObject()
  responsePayload?: Record<string, any>;

  @IsOptional()
  @IsString()
  assignedTo?: string;
}

export class CreatePrivacyComplaintDto {
  @IsString()
  name: string;

  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  orderNumber?: string;

  @IsEnum(ComplaintCategory)
  category: ComplaintCategory;

  @IsString()
  subject: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  evidenceUrls?: string[];
}

export class UpdatePrivacyComplaintDto {
  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsString()
  resolution?: string;
}

export class CreateBreachIncidentDto {
  @IsString()
  incidentTitle: string;

  @IsString()
  incidentType: string;

  @IsEnum(IncidentSeverity)
  severity: IncidentSeverity;

  @IsNumber()
  @Min(0)
  affectedRecordsCount: number;

  @IsArray()
  affectedSystems: string[];

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  mitigationSteps?: string;

  @IsOptional()
  @IsBoolean()
  notificationRequired?: boolean;
}

export class UpdateBreachIncidentDto {
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @IsOptional()
  @IsString()
  mitigationSteps?: string;

  @IsOptional()
  @IsBoolean()
  notificationRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  dpbiNotified?: boolean;

  @IsOptional()
  @IsString()
  assignedAdminId?: string;
}

export class TriggerRetentionCleanupDto {
  @IsOptional()
  @IsArray()
  categories?: string[];
}
