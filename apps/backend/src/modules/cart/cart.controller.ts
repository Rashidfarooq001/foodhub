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
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CartService, CartItem } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Cart (Phase 10)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  private getUserId(req: any): string {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Authentication required');
    return userId;
  }

  @Get()
  @ApiOperation({ summary: 'Get current cart' })
  async getCart(@Request() req: any) {
    return this.cartService.getCart(this.getUserId(req));
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  async addItem(@Request() req: any, @Body() body: { restaurantId: string; item: CartItem }) {
    return this.cartService.addItem(this.getUserId(req), body.restaurantId, body.item);
  }

  @Patch('items/:foodItemId')
  @ApiOperation({ summary: 'Update item quantity' })
  async updateQuantity(
    @Request() req: any,
    @Param('foodItemId') foodItemId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.cartService.updateQuantity(this.getUserId(req), foodItemId, quantity);
  }

  @Delete('items/:foodItemId')
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeItem(@Request() req: any, @Param('foodItemId') foodItemId: string) {
    return this.cartService.removeItem(this.getUserId(req), foodItemId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear entire cart' })
  async clearCart(@Request() req: any) {
    await this.cartService.clearCart(this.getUserId(req));
    return { message: 'Cart cleared' };
  }
}
