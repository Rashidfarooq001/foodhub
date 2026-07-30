import { z } from 'zod';

export const RestaurantSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  name: z.string().min(2),
  slug: z.string(),
  phone: z.string(),
  licenseFssai: z.string(),
  addressLine: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  isActive: z.boolean(),
  isOpen: z.boolean(),
  avgRating: z.number(),
  commissionRate: z.number(),
});

export type IRestaurant = z.infer<typeof RestaurantSchema>;

export const MenuItemSchema = z.object({
  id: z.string().uuid(),
  restaurantId: z.string().uuid(),
  categoryId: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number().positive(),
  imageUrl: z.string().url().optional(),
  isVeg: z.boolean(),
  isAvailable: z.boolean(),
});

export type IMenuItem = z.infer<typeof MenuItemSchema>;
