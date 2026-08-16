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

  async createTicket(userId: string, data: { subject: string; message: string; priority?: TicketPriority }) {
    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNo: generateTicketNumber(),
        userId,
        subject: data.subject,
        priority: data.priority || TicketPriority.MEDIUM,
        messages: {
          create: {
            senderId: userId,
            message: data.message,
          },
        },
      },
      include: {
        messages: true,
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
