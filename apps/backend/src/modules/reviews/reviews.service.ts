import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateRestaurantReviewDto,
  CreateFoodReviewDto,
  CreateDriverReviewDto,
} from './dto/reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  private async assertOrderDelivered(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: { select: { userId: true, id: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'DELIVERED') {
      throw new ForbiddenException('You can only review delivered orders');
    }
    if (order.customer?.userId !== userId && order.customer?.id !== userId) {
      throw new ForbiddenException('You can only review your own orders');
    }
    return order;
  }

  async createRestaurantReview(userId: string, dto: CreateRestaurantReviewDto) {
    const order = await this.assertOrderDelivered(dto.orderId, userId);

    const customer = await this.prisma.customer.findFirst({
      where: { OR: [{ userId }, { id: userId }] },
    });
    if (!customer) throw new NotFoundException('Customer profile not found');

    const existing = await this.prisma.restaurantReview.findFirst({
      where: { orderId: dto.orderId },
    });
    if (existing) {
      throw new ConflictException('You have already reviewed the restaurant for this order');
    }

    const review = await this.prisma.restaurantReview.create({
      data: {
        restaurantId: order.restaurantId,
        customerId: customer.id,
        orderId: dto.orderId,
        rating: dto.rating,
      },
    });

    await this.updateRestaurantRating(order.restaurantId);
    return review;
  }

  async updateRestaurantRating(restaurantId: string) {
    const reviews = await this.prisma.restaurantReview.findMany({
      where: { restaurantId },
      select: { rating: true },
    });
    if (reviews.length === 0) return;
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { avgRating: Number(avg.toFixed(1)) },
    });
  }

  async createFoodReview(userId: string, dto: CreateFoodReviewDto) {
    const order = await this.assertOrderDelivered(dto.orderId, userId);

    const customer = await this.prisma.customer.findFirst({
      where: { OR: [{ userId }, { id: userId }] },
    });
    if (!customer) throw new NotFoundException('Customer profile not found');

    const orderItem = await this.prisma.orderItem.findFirst({
      where: { orderId: dto.orderId, foodItemId: dto.foodItemId },
    });
    if (!orderItem) {
      throw new NotFoundException('Food item not found in this order');
    }

    const review = await this.prisma.foodReview.create({
      data: {
        foodItemId: dto.foodItemId,
        orderId: dto.orderId,
        customerId: customer.id,
        rating: dto.rating,
      },
    });

    return review;
  }

  async createDriverReview(userId: string, dto: CreateDriverReviewDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { 
        customer: { select: { userId: true, id: true } },
        deliveryJob: true 
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'DELIVERED') throw new ForbiddenException('Order not delivered yet'); if (order.customer?.userId !== userId && order.customer?.id !== userId) throw new ForbiddenException('You can only review your own orders');
    
    // Auto-resolve the driver from the order. Do NOT trust the frontend.
    const driverId = order.deliveryJob?.driverId || order.assignedRestaurantDriverId;
    if (!driverId) throw new NotFoundException('No driver associated with this order');

    const customer = await this.prisma.customer.findFirst({
      where: { OR: [{ userId }, { id: userId }] },
    });
    if (!customer) throw new NotFoundException('Customer profile not found');

    const existing = await this.prisma.driverReview.findFirst({
      where: { orderId: dto.orderId },
    });
    if (existing)
      throw new ConflictException('You have already reviewed the driver for this order');

    const review = await this.prisma.driverReview.create({
      data: {
        driverId: driverId,
        customerId: customer.id,
        orderId: dto.orderId,
        rating: dto.rating,
      },
    });

    // Update driver avgRating
    const driverReviews = await this.prisma.driverReview.findMany({
      where: { driverId: driverId },
      select: { rating: true },
    });
    const avg = driverReviews.reduce((s, r) => s + r.rating, 0) / driverReviews.length;
    await this.prisma.driver.update({
      where: { id: driverId },
      data: { avgRating: Math.min(avg, 5.0) },
    });

    return review;
  }

  async getRestaurantReviews(restaurantId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await this.prisma.$transaction([
      this.prisma.restaurantReview.findMany({
        where: { restaurantId },
        include: {
          customer: {
            include: {
              user: {
                include: { profile: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.restaurantReview.count({ where: { restaurantId } }),
    ]);
    return { reviews, total, page, limit };
  }

  async getMyReviews(userIdOrCustomerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        OR: [{ userId: userIdOrCustomerId }, { id: userIdOrCustomerId }],
      },
    });
    if (!customer) return [];

    const reviews = await this.prisma.restaurantReview.findMany({
      where: { customerId: customer.id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            bannerUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews.map((r) => ({
      id: r.id,
      restaurantName: r.restaurant?.name || 'Restaurant',
      rating: r.rating,
      date: new Date(r.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    }));
  }
}
