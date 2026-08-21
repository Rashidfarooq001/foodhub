import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupportTicketsService } from './support-tickets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { TicketStatus, TicketPriority } from '@prisma/client';

@ApiTags('Support Tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('support-tickets')
export class SupportTicketsController {
  constructor(private readonly supportService: SupportTicketsService) {}

  @Get()
  @ApiOperation({ summary: 'List support tickets (Admin or User)' })
  async listTickets(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    const actor = {
      userId: req.user?.id,
      role: req.user?.role,
    };
    return this.supportService.listTickets(actor, status, priority);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket details and conversation thread' })
  async getTicketDetails(@Param('id') id: string, @Request() req: any) {
    const actor = {
      userId: req.user?.id,
      role: req.user?.role,
    };
    return this.supportService.getTicketDetails(id, actor);
  }

  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a new support ticket' })
  async createTicket(
    @Request() req: any,
    @Body() body: {
      subject: string;
      message: string;
      priority?: TicketPriority;
      name?: string;
      phone?: string;
      email?: string;
      orderNumber?: string;
    },
  ) {
    const userId = req.user?.id || null;
    return this.supportService.createTicket(userId, body);
  }

  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update ticket status and/or priority (Admin)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: TicketStatus; priority?: TicketPriority },
  ) {
    return this.supportService.updateTicketStatus(id, body.status, body.priority);
  }

  @Post(':id/reply')
  @ApiOperation({ summary: 'Add a reply to a support ticket' })
  async reply(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { message: string; attachments?: string[] },
  ) {
    const senderId = req.user?.id;
    const role = req.user?.role;
    return this.supportService.replyToTicket(id, senderId, body.message, body.attachments, role);
  }
}
