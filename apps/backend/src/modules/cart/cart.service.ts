import { Injectable } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';

export interface CartItem {
  foodItemId:  string;
  name:        string;
  price:       number;
  quantity:    number;
  addonsJson?: unknown[];
}

export interface Cart {
  restaurantId: string;
  items:        CartItem[];
  updatedAt:    string;
}

const CART_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

@Injectable()
export class CartService {
  constructor(private readonly cache: CacheService) {}

  private cartKey(userId: string) {
    return `cart:${userId}`;
  }

  async getCart(userId: string): Promise<Cart | null> {
    const raw = await this.cache.get<Cart>(this.cartKey(userId));
    return raw ?? null;
  }

  async addItem(
    userId:       string,
    restaurantId: string,
    item:         CartItem,
  ): Promise<Cart> {
    const existing = await this.getCart(userId);

    // If cart belongs to a different restaurant, clear it first
    if (existing && existing.restaurantId !== restaurantId) {
      await this.clearCart(userId);
    }

    const cart: Cart = existing ?? {
      restaurantId,
      items:     [],
      updatedAt: new Date().toISOString(),
    };

    const idx = cart.items.findIndex((i) => i.foodItemId === item.foodItemId);
    if (idx >= 0) {
      cart.items[idx].quantity += item.quantity;
    } else {
      cart.items.push(item);
    }
    cart.updatedAt = new Date().toISOString();

    await this.cache.set(this.cartKey(userId), cart, CART_TTL_SECONDS);
    return cart;
  }

  async updateQuantity(
    userId:     string,
    foodItemId: string,
    quantity:   number,
  ): Promise<Cart> {
    const cart = await this.getCart(userId);
    if (!cart) return { restaurantId: '', items: [], updatedAt: new Date().toISOString() };

    const idx = cart.items.findIndex((i) => i.foodItemId === foodItemId);
    if (idx >= 0) {
      if (quantity <= 0) {
        cart.items.splice(idx, 1);
      } else {
        cart.items[idx].quantity = quantity;
      }
    }
    cart.updatedAt = new Date().toISOString();
    await this.cache.set(this.cartKey(userId), cart, CART_TTL_SECONDS);
    return cart;
  }

  async removeItem(userId: string, foodItemId: string): Promise<Cart> {
    return this.updateQuantity(userId, foodItemId, 0);
  }

  async clearCart(userId: string): Promise<void> {
    await this.cache.del(this.cartKey(userId));
  }

  async mergeGuestCart(userId: string, guestCart: Cart): Promise<Cart> {
    for (const item of guestCart.items) {
      await this.addItem(userId, guestCart.restaurantId, item);
    }
    return (await this.getCart(userId))!;
  }
}
