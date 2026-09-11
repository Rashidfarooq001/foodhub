import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import {
  CreateRestaurantReviewDto,
  CreateFoodReviewDto,
  CreateDriverReviewDto,
} from './dto/reviews.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Reviews (Phase 16)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user submitted reviews' })
  async getMyReviews(@Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return this.reviewsService.getMyReviews(userId);
  }

  @Post('restaurant')
  @ApiOperation({ summary: 'Submit a restaurant review (delivered orders only)' })
  async reviewRestaurant(@Request() req: any, @Body() dto: CreateRestaurantReviewDto) {
    const userId = req.user?.id || req.user?.sub;
    return this.reviewsService.createRestaurantReview(userId, dto);
  }

  @Post('food')
  @ApiOperation({ summary: 'Submit a food item review (delivered orders only)' })
  async reviewFood(@Request() req: any, @Body() dto: CreateFoodReviewDto) {
    const userId = req.user?.id || req.user?.sub;
    return this.reviewsService.createFoodReview(userId, dto);
  }

  @Post('driver')
  @ApiOperation({ summary: 'Submit a driver review (delivered orders only)' })
  async reviewDriver(@Request() req: any, @Body() dto: CreateDriverReviewDto) {
    const userId = req.user?.id || req.user?.sub;
    return this.reviewsService.createDriverReview(userId, dto);
  }

  @Public()
  @Get('restaurant/:restaurantId')
  @ApiOperation({ summary: 'Get paginated restaurant reviews' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getRestaurantReviews(
    @Param('restaurantId') restaurantId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.reviewsService.getRestaurantReviews(restaurantId, +page, +limit);
  }
}
