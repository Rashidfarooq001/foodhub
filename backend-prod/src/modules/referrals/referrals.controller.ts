import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReferralsService } from './referrals.service';
import { ApplyReferralDto } from './dto/apply-referral.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Referrals (Phase 15)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('my-code')
  @ApiOperation({ summary: 'Get (or generate) my referral code' })
  async getMyCode(@Request() req: { user: { sub: string } }) {
    const code = await this.referralsService.getMyReferralCode(req.user.sub);
    return { referralCode: code };
  }

  @Post('apply')
  @ApiOperation({ summary: 'Apply a referral code (new user only, one-time)' })
  async apply(@Request() req: { user: { sub: string } }, @Body() dto: ApplyReferralDto) {
    return this.referralsService.applyReferralCode(req.user.sub, dto.code);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get referral statistics and total earnings' })
  async stats(@Request() req: { user: { sub: string } }) {
    return this.referralsService.getReferralStats(req.user.sub);
  }
}
