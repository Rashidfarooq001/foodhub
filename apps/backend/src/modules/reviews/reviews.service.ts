import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateRestaurantReviewDto,
  CreateFoodReviewDto,
  CreateDriverReviewDto,
  ReportReviewDto,
  ReplyReviewDto,
  ModerateReviewDto,
} from './dto/reviews.dto';
import { OrderStatus } from '@prisma/client';

/**
 * Wilson score lower bound for rating confidence.
 * Returns a value in [0, 5] for display.
 */
function wilsonScore(rating: number, count: number): number {
  if (count === 0) return 0;
  const z     = 1.96; // 95% confidence
  const phat  = rating / 5;
  const lower =
    (phat + (z * z) / (2 * count) -
      z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * count)) / count)) /
    (1 + (z * z) / count);
  return Math.round(lower * 5 * 100) / 100;
}

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  // ────────────────────────────────────────────────────────────────────────────
  // ELIGIBILITY GUARD
  // ────────────────────────────────────────────────────────────────────────────

  private async assertOrderDelivered(orderId: string, customerId: string): Promise<void> {
    const customer = await this.prisma.customer.findFirst({ where: { userId: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.customerId !== customer.id) throw new ForbiddenException('This order does not belong to you');
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('You can only review delivered orders');
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RESTAURANT REVIEW
  // ────────────────────────────────────────────────────────────────────────────

  async createRestaurantReview(userId: string, dto: CreateRestaurantReviewDto) {
    await this.assertOrderDelivered(dto.orderId, userId);

    const customer = await this.prisma.customer.findFirstOrThrow({ where: { userId } });

    // One review per order guard
    const existing = await this.prisma.restaurantReview.findFirst({
      where: { orderId: dto.orderId, customerId: customer.id },
    });
    if (existing) throw new ConflictException('You have already reviewed this order');

    const review = await this.prisma.restaurantReview.create({
      data: {
        restaurantId: dto.restaurantId,
        customerId:   customer.id,
        orderId:      dto.orderId,
        rating:       dto.rating,
        comment:      dto.comment,
        isAnonymous:  dto.isAnonymous ?? false,
      },
    });

    // Update restaurant avgRating
    await this.updateRestaurantRating(dto.restaurantId);

    return review;
  }

  private async updateRestaurantRating(restaurantId: string): Promise<void> {
    const reviews = await this.prisma.restaurantReview.findMany({
      where:  { restaurantId, isHidden: false },
      select: { rating: true },
    });
    if (reviews.length === 0) return;

    const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    const weighted  = wilsonScore(avgRating, reviews.length);

    await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data:  { avgRating: Math.min(weighted, 5.0) },
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // FOOD REVIEW
  // ────────────────────────────────────────────────────────────────────────────

  async createFoodReview(userId: string, dto: CreateFoodReviewDto) {
    await this.assertOrderDelivered(dto.orderId, userId);

    const customer = await this.prisma.customer.findFirstOrThrow({ where: { userId } });

    const existing = await this.prisma.foodReview.findFirst({
      where: { orderId: dto.orderId, foodItemId: dto.foodItemId, customerId: customer.id },
    });
    if (existing) throw new ConflictException('You have already reviewed this item for this order');

    return this.prisma.foodReview.create({
      data: {
        foodItemId: dto.foodItemId,
        customerId: customer.id,
        orderId:    dto.orderId,
        rating:     dto.rating,
        comment:    dto.comment,
      },
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // DRIVER REVIEW
  // ────────────────────────────────────────────────────────────────────────────

  async createDriverReview(userId: string, dto: CreateDriverReviewDto) {
    await this.assertOrderDelivered(dto.orderId, userId);

    const customer = await this.prisma.customer.findFirstOrThrow({ where: { userId } });

    const existing = await this.prisma.driverReview.findFirst({
      where: { orderId: dto.orderId, driverId: dto.driverId },
    });
    if (existing) throw new ConflictException('You have already reviewed this driver for this order');

    const review = await this.prisma.driverReview.create({
      data: {
        driverId:   dto.driverId,
        customerId: customer.id,
        orderId:    dto.orderId,
        rating:     dto.rating,
        comment:    dto.comment,
      },
    });

    // Update driver avgRating
    const driverReviews = await this.prisma.driverReview.findMany({
      where:  { driverId: dto.driverId },
      select: { rating: true },
    });
    const avg = driverReviews.reduce((s, r) => s + r.rating, 0) / driverReviews.length;
    await this.prisma.driver.update({
      where: { id: dto.driverId },
      data:  { avgRating: Math.min(avg, 5.0) },
    });

    return review;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // READ
  // ────────────────────────────────────────────────────────────────────────────

  async getRestaurantReviews(restaurantId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await this.prisma.$transaction([
      this.prisma.restaurantReview.findMany({
        where:   { restaurantId, isHidden: false },
        include: { images: true, votes: true, replies: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take:    limit,
      }),
      this.prisma.restaurantReview.count({ where: { restaurantId, isHidden: false } }),
    ]);
    return { reviews, total, page, limit };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // SOCIAL (VOTE / REPORT / REPLY)
  // ────────────────────────────────────────────────────────────────────────────

  async voteReview(reviewId: string, userId: string, isHelpful: boolean) {
    return this.prisma.reviewVote.upsert({
      where:  { reviewId_userId: { reviewId, userId } },
      create: { reviewId, userId, isHelpful },
      update: { isHelpful },
    });
  }

  async reportReview(reviewId: string, userId: string, dto: ReportReviewDto) {
    const review = await this.prisma.restaurantReview.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    return this.prisma.reviewReport.create({
      data: { reviewId, reporterId: userId, reason: dto.reason },
    });
  }

  async replyToReview(reviewId: string, replierId: string, dto: ReplyReviewDto) {
    const review = await this.prisma.restaurantReview.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    return this.prisma.reviewReply.create({
      data: {
        reviewId,
        replierId,
        role:      dto.role,
        replyText: dto.replyText,
      },
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // MODERATION (ADMIN)
  // ────────────────────────────────────────────────────────────────────────────

  async moderateReview(reviewId: string, dto: ModerateReviewDto) {
    const review = await this.prisma.restaurantReview.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    if (dto.action === 'DELETE') {
      await this.prisma.restaurantReview.delete({ where: { id: reviewId } });
      await this.updateRestaurantRating(review.restaurantId);
      return { message: 'Review deleted' };
    }

    const updated = await this.prisma.restaurantReview.update({
      where: { id: reviewId },
      data:  { isHidden: true },
    });
    await this.updateRestaurantRating(review.restaurantId);
    return updated;
  }
}
