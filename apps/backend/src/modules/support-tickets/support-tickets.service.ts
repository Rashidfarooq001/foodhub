import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TicketStatus, TicketPriority } from '@prisma/client';

function generateTicketNumber(): string {
  return `TCK-${Math.floor(1000 + Math.random() * 9000)}`;
}

@Injectable()
export class SupportTicketsService {
  private readonly logger = new Logger(SupportTicketsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listTickets(actor: { userId?: string; role?: string }, status?: string, priority?: string) {
    const isAdmin = actor.role === 'SUPER_ADMIN' || actor.role === 'ADMIN' || actor.role === 'SUPPORT';
    const where: any = {};

    if (!isAdmin) {
      if (!actor.userId) throw new ForbiddenException('User authentication required');
      where.userId = actor.userId;
    }

    if (status && status !== 'ALL') {
      where.status = status as TicketStatus;
    }
    if (priority && priority !== 'ALL') {
      where.priority = priority as TicketPriority;
    }

    const tickets = await this.prisma.supportTicket.findMany({
      where,
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { attachments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return tickets.map((t) => ({
      id: t.id,
      ticketNo: t.ticketNo,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      user: {
        id: t.user.id,
        phone: t.user.phone,
        email: t.user.email,
        role: t.user.role,
        name: t.user.profile
          ? `${t.user.profile.firstName} ${t.user.profile.lastName || ''}`.trim()
          : 'User',
      },
      messagesCount: t.messages.length,
      lastMessage: t.messages[t.messages.length - 1]?.message || null,
    }));
  }

  async getTicketDetails(id: string, actor?: { userId?: string; role?: string }) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            profile: true,
            customer: true,
            driver: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { attachments: true },
        },
      },
    });

    if (!ticket) throw new NotFoundException('Support ticket not found');

    if (actor) {
      const isAdmin = actor.role === 'SUPER_ADMIN' || actor.role === 'ADMIN' || actor.role === 'SUPPORT';
      if (!isAdmin && ticket.userId !== actor.userId) {
        throw new ForbiddenException('You do not have permission to view this support ticket');
      }
    }

    return ticket;
  }

  async createTicket(
    userId?: string | null,
    data?: {
      subject: string;
      message: string;
      priority?: TicketPriority;
      name?: string;
      phone?: string;
      email?: string;
      orderNumber?: string;
    },
  ) {
    if (!data || !data.subject || !data.message) {
      throw new Error('Subject and message are required.');
    }

    let resolvedUserId: string | null = userId || null;

    if (!resolvedUserId && data.phone) {
      const user = await this.prisma.user.findUnique({
        where: { phone: data.phone },
      });
      if (user) {
        resolvedUserId = user.id;
      }
    }

    if (!resolvedUserId) {
      const guest = await this.prisma.user.findFirst({
        where: { role: 'CUSTOMER' },
      });
      resolvedUserId = guest?.id || null;
    }

    if (!resolvedUserId) {
      throw new Error('Unable to associate ticket with a user profile.');
    }

    const ticketNo = generateTicketNumber();

    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId: resolvedUserId,
        ticketNo,
        subject: data.subject,
        status: TicketStatus.OPEN,
        priority: data.priority || TicketPriority.MEDIUM,
        messages: {
          create: {
            senderId: resolvedUserId,
            message: data.message,
          },
        },
      },
      include: {
        messages: true,
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    return ticket;
  }

  async updateTicketStatus(id: string, status: TicketStatus, priority?: TicketPriority) {
    const data: any = { status };
    if (priority) data.priority = priority;

    const ticket = await this.prisma.supportTicket.update({
      where: { id },
      data,
    });

    return ticket;
  }

  async replyToTicket(
    ticketId: string,
    senderId: string,
    message: string,
    attachmentUrls: string[] = [],
    role?: string,
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Support ticket not found');

    const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'SUPPORT';
    if (!isAdmin && ticket.userId !== senderId) {
      throw new ForbiddenException('You do not have permission to reply to this support ticket');
    }

    const supportMessage = await this.prisma.supportMessage.create({
      data: {
        ticketId,
        senderId,
        message,
        attachments: {
          create: attachmentUrls.map((url) => ({ fileUrl: url })),
        },
      },
      include: {
        attachments: true,
      },
    });

    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });

    return supportMessage;
  }
}
