import {
  Controller, Get, Post, Patch, Param, Body,
  UseGuards, Request, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import {
  CreateRestaurantReviewDto,
  CreateFoodReviewDto,
  CreateDriverReviewDto,
  ReportReviewDto,
  ReplyReviewDto,
  ModerateReviewDto,
} from './dto/reviews.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Reviews (Phase 16)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('restaurant')
  @ApiOperation({ summary: 'Submit a restaurant review (delivered orders only)' })
  async reviewRestaurant(
    @Request() req: any,
    @Body() dto: CreateRestaurantReviewDto,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.reviewsService.createRestaurantReview(userId, dto);
  }

  @Post('food')
  @ApiOperation({ summary: 'Submit a food item review (delivered orders only)' })
  async reviewFood(
    @Request() req: any,
    @Body() dto: CreateFoodReviewDto,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.reviewsService.createFoodReview(userId, dto);
  }

  @Post('driver')
  @ApiOperation({ summary: 'Submit a driver review (delivered orders only)' })
  async reviewDriver(
    @Request() req: any,
    @Body() dto: CreateDriverReviewDto,
  ) {
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
    @Query('page')  page  = 1,
    @Query('limit') limit = 10,
  ) {
    return this.reviewsService.getRestaurantReviews(restaurantId, +page, +limit);
  }

  @Post(':id/vote')
  @ApiOperation({ summary: 'Vote a review as helpful or not helpful' })
  async vote(
    @Param('id') id: string,
    @Request()  req: { user: { sub: string } },
    @Body('isHelpful') isHelpful: boolean,
  ) {
    return this.reviewsService.voteReview(id, req.user.sub, isHelpful);
  }

  @Post(':id/report')
  @ApiOperation({ summary: 'Report a review for moderation' })
  async report(
    @Param('id') id: string,
    @Request()  req: { user: { sub: string } },
    @Body() dto: ReportReviewDto,
  ) {
    return this.reviewsService.reportReview(id, req.user.sub, dto);
  }

  @Post(':id/reply')
  @ApiOperation({ summary: 'Reply to a review (restaurant owner or admin)' })
  async reply(
    @Param('id') id: string,
    @Request()  req: { user: { sub: string } },
    @Body() dto: ReplyReviewDto,
  ) {
    return this.reviewsService.replyToReview(id, req.user.sub, dto);
  }

  @Patch(':id/moderate')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Admin: hide or delete a review' })
  async moderate(
    @Param('id') id: string,
    @Body() dto: ModerateReviewDto,
  ) {
    return this.reviewsService.moderateReview(id, dto);
  }
}
