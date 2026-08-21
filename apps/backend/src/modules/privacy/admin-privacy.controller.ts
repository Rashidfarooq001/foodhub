import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  Ip,
  Headers,
} from '@nestjs/common';
import { PrivacyService } from './privacy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, PrivacyRequestType, PrivacyRequestStatus, ComplaintStatus } from '@prisma/client';
import {
  UpdatePrivacyRequestDto,
  UpdatePrivacyComplaintDto,
  CreateBreachIncidentDto,
  UpdateBreachIncidentDto,
  TriggerRetentionCleanupDto,
} from './dto/privacy.dto';

@Controller('admin/privacy')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminPrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  // 1. Manage Data Subject Requests
  @Get('requests')
  async listRequests(
    @Query('type') type?: PrivacyRequestType,
    @Query('status') status?: PrivacyRequestStatus,
  ) {
    const requests = await this.privacyService.adminListRequests({ type, status });
    return { success: true, requests };
  }

  @Patch('requests/:id')
  async updateRequest(
    @Param('id') id: string,
    @Body() dto: UpdatePrivacyRequestDto,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    const updated = await this.privacyService.adminUpdatePrivacyRequest(id, dto, req.user.id, ip, ua);
    return { success: true, updated };
  }

  @Post('requests/:id/execute-deletion')
  async executeDeletion(
    @Param('id') id: string,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    const result = await this.privacyService.executeSafeAccountDeletion(id, req.user.id, ip, ua);
    return { success: true, ...result };
  }

  // 2. Manage Grievances & Complaints
  @Get('complaints')
  async listComplaints(@Query('status') status?: ComplaintStatus) {
    const complaints = await this.privacyService.adminListComplaints(status);
    return { success: true, complaints };
  }

  @Patch('complaints/:id')
  async updateComplaint(
    @Param('id') id: string,
    @Body() dto: UpdatePrivacyComplaintDto,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    const updated = await this.privacyService.adminUpdateComplaint(id, dto, req.user.id, ip, ua);
    return { success: true, updated };
  }

  // 3. Security Breach & Incident Management
  @Post('incidents')
  async createIncident(
    @Body() dto: CreateBreachIncidentDto,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    const incident = await this.privacyService.adminCreateBreachIncident(dto, req.user.id, ip, ua);
    return { success: true, incident };
  }

  @Get('incidents')
  async listIncidents() {
    const incidents = await this.privacyService.adminListBreachIncidents();
    return { success: true, incidents };
  }

  @Patch('incidents/:id')
  async updateIncident(
    @Param('id') id: string,
    @Body() dto: UpdateBreachIncidentDto,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    const updated = await this.privacyService.adminUpdateBreachIncident(id, dto, req.user.id, ip, ua);
    return { success: true, updated };
  }

  // 4. Audit Logs & Retention
  @Get('audit-logs')
  async listAuditLogs(@Query('limit') limit?: string) {
    const logs = await this.privacyService.adminListAuditLogs(limit ? parseInt(limit, 10) : 100);
    return { success: true, auditLogs: logs };
  }

  @Post('retention/cleanup')
  async triggerRetention(
    @Body() dto: TriggerRetentionCleanupDto,
    @Req() req: any,
  ) {
    const result = await this.privacyService.triggerRetentionCleanup(req.user.id, dto.categories);
    return { success: true, ...result };
  }
}
