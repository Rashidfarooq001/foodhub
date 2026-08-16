import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@ApiTags('Users & Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('users/customers')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'List and filter all registered customers with metrics (Admin Only)' })
  async findCustomers(
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.usersService.getCustomersForAdmin(search, +page, +limit);
  }

  @Get('users')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'List and filter all registered users in system (Admin Only)' })
  async findAllUsers(
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.usersService.findAllUsersForAdmin(role, search, +page, +limit);
  }

  @Patch('users/:id/status')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Activate or deactivate a user account (Admin Only)' })
  async updateUserStatus(
    @Param('id') userId: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.usersService.updateUserStatusByAdmin(userId, isActive);
  }

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
