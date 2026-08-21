import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TicketStatus, TicketPriority } from '@prisma/client';

function generateTicketNumber(): string {
  return `TCK-${Math.floor(1000 + Math.random() * 9000)}`;
}

@Injectable()
export class SupportTicketsService {
  private readonly logger = new Logger(SupportTicketsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listTickets(status?: string, priority?: string) {
    const where: any = {};
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

  async getTicketDetails(id: string) {
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

    let resolvedUserId = userId;

    if (!resolvedUserId) {
      // 1. Try finding user by phone if provided
      if (data.phone) {
        const existing = await this.prisma.user.findFirst({
          where: { phone: data.phone },
        });
        if (existing) resolvedUserId = existing.id;
      }
      // 2. Try finding user by email if provided
      if (!resolvedUserId && data.email) {
        const existing = await this.prisma.user.findFirst({
          where: { email: data.email },
        });
        if (existing) resolvedUserId = existing.id;
      }
      // 3. If still no user, find or create dedicated system guest support user
      if (!resolvedUserId) {
        let guestUser = await this.prisma.user.findFirst({
          where: { email: 'support-guest@zaykafood.online' },
        });
        if (!guestUser) {
          guestUser = await this.prisma.user.create({
            data: {
              phone: `+919000000000`,
              email: 'support-guest@zaykafood.online',
              passwordHash: 'GUEST_SUPPORT_UNAUTHENTICATED',
              role: 'CUSTOMER',
              isActive: true,
              profile: {
                create: {
                  firstName: data.name ? data.name.split(' ')[0] : 'Guest',
                  lastName: data.name ? data.name.split(' ').slice(1).join(' ') || 'Customer' : 'Customer',
                },
              },
            },
          });
        }
        resolvedUserId = guestUser.id;
      }
    }

    const metaPrefix = [
      data.name ? `Name: ${data.name}` : null,
      data.phone ? `Phone: ${data.phone}` : null,
      data.email ? `Email: ${data.email}` : null,
      data.orderNumber ? `Order #: ${data.orderNumber}` : null,
    ].filter(Boolean).join(' | ');

    const fullMessage = metaPrefix ? `[Contact Details: ${metaPrefix}]\n\n${data.message}` : data.message;

    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNo: generateTicketNumber(),
        userId: resolvedUserId,
        subject: data.orderNumber ? `[${data.orderNumber}] ${data.subject}` : data.subject,
        priority: data.priority || TicketPriority.MEDIUM,
        messages: {
          create: {
            senderId: resolvedUserId,
            message: fullMessage,
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

    this.logger.log(`Created support ticket ${ticket.ticketNo} for user ${resolvedUserId}`);
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

  async replyToTicket(ticketId: string, senderId: string, message: string, attachmentUrls: string[] = []) {
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
