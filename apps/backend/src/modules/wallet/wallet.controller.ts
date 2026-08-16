import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Wallet (Phase 11)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get wallet balance' })
  async getBalance(@Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return this.walletService.getBalance(userId);
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get platform customer and driver wallets overview (Admin)' })
  async getOverview(@Request() req: any) {
    return this.walletService.getPlatformWalletsOverview();
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get paginated wallet transaction history' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getHistory(
    @Request() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.walletService.getTransactionHistory(userId, +page, +limit);
  }
}
