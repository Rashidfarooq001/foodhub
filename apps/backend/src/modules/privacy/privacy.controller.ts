import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Ip,
  Headers,
} from '@nestjs/common';
import { PrivacyService } from './privacy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  RecordConsentDto,
  WithdrawConsentDto,
  CreatePrivacyRequestDto,
  CreatePrivacyComplaintDto,
} from './dto/privacy.dto';

@Controller('privacy')
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  // 1. Transparency endpoints (Public or Authenticated)
  @Get('inventory')
  getDataInventory() {
    return {
      success: true,
      dataInventory: this.privacyService.getDataInventory(),
    };
  }

  @Get('vendor-inventory')
  getVendorInventory() {
    return {
      success: true,
      subprocessors: this.privacyService.getVendorInventory(),
    };
  }

  @Get('retention-policies')
  getRetentionPolicies() {
    return {
      success: true,
      retentionPolicies: this.privacyService.getRetentionPolicies(),
    };
  }

  // 2. Customer Privacy Center endpoints (Authenticated)
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyPrivacyProfile(@Req() req: any) {
    const data = await this.privacyService.getUserPrivacyProfile(req.user.id);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Post('consent')
  async recordConsent(
    @Req() req: any,
    @Body() dto: RecordConsentDto,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    const consent = await this.privacyService.recordConsent(req.user.id, dto, ip, ua);
    return { success: true, consent };
  }

  @UseGuards(JwtAuthGuard)
  @Post('consent/withdraw')
  async withdrawConsent(
    @Req() req: any,
    @Body() dto: WithdrawConsentDto,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    const updated = await this.privacyService.withdrawConsent(req.user.id, dto, ip, ua);
    return { success: true, updated };
  }

  @UseGuards(JwtAuthGuard)
  @Get('export')
  async exportMyData(
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    const exportPayload = await this.privacyService.exportUserData(req.user.id, ip, ua);
    return { success: true, ...exportPayload };
  }

  @UseGuards(JwtAuthGuard)
  @Post('requests')
  async createPrivacyRequest(
    @Req() req: any,
    @Body() dto: CreatePrivacyRequestDto,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    const request = await this.privacyService.createPrivacyRequest(req.user.id, dto, ip, ua);
    return { success: true, request };
  }

  @UseGuards(JwtAuthGuard)
  @Get('requests')
  async getMyPrivacyRequests(@Req() req: any) {
    const requests = await this.privacyService.getUserPrivacyRequests(req.user.id);
    return { success: true, requests };
  }

  // 3. Grievance & Complaints (Authenticated or Guest with contact info)
  @Post('complaints')
  async createComplaint(
    @Req() req: any,
    @Body() dto: CreatePrivacyComplaintDto,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    const userId = req.user?.id || null;
    const complaint = await this.privacyService.createPrivacyComplaint(dto, userId, ip, ua);
    return { success: true, complaint };
  }

  @UseGuards(JwtAuthGuard)
  @Get('complaints')
  async getMyComplaints(@Req() req: any) {
    const complaints = await this.privacyService.getUserComplaints(req.user.id);
    return { success: true, complaints };
  }
}
