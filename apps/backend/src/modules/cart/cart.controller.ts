import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CartService, CartItem } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Cart (Phase 10)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current cart' })
  async getCart(@Request() req: { user: { sub: string } }) {
    return this.cartService.getCart(req.user.sub);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  async addItem(
    @Request() req: { user: { sub: string } },
    @Body() body: { restaurantId: string; item: CartItem },
  ) {
    return this.cartService.addItem(req.user.sub, body.restaurantId, body.item);
  }

  @Patch('items/:foodItemId')
  @ApiOperation({ summary: 'Update item quantity' })
  async updateQuantity(
    @Request() req: { user: { sub: string } },
    @Param('foodItemId') foodItemId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.cartService.updateQuantity(req.user.sub, foodItemId, quantity);
  }

  @Delete('items/:foodItemId')
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeItem(
    @Request() req: { user: { sub: string } },
    @Param('foodItemId') foodItemId: string,
  ) {
    return this.cartService.removeItem(req.user.sub, foodItemId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear entire cart' })
  async clearCart(@Request() req: { user: { sub: string } }) {
    await this.cartService.clearCart(req.user.sub);
    return { message: 'Cart cleared' };
  }
}
