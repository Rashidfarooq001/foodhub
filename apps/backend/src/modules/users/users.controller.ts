import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@ApiTags('Users & Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('addresses')
  @ApiOperation({ summary: 'List customer saved delivery addresses' })
  async getAddresses(@Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return this.usersService.getCustomerAddresses(userId);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Add a new saved delivery address' })
  async createAddress(@Request() req: any, @Body() dto: CreateAddressDto) {
    const userId = req.user?.id || req.user?.sub;
    return this.usersService.createCustomerAddress(userId, dto);
  }

  @Patch('addresses/:id')
  @ApiOperation({ summary: 'Update an existing saved delivery address' })
  async updateAddress(
    @Request() req: any,
    @Param('id') addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.usersService.updateCustomerAddress(userId, addressId, dto);
  }

  @Delete('addresses/:id')
  @ApiOperation({ summary: 'Delete a saved delivery address' })
  async deleteAddress(@Request() req: any, @Param('id') addressId: string) {
    const userId = req.user?.id || req.user?.sub;
    return this.usersService.deleteCustomerAddress(userId, addressId);
  }
}
