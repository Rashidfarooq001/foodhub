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
  commissionRate: z.number().nullable().optional(),
  deliveryMode: z.enum(['FOODHUB_DELIVERY', 'RESTAURANT_SELF_DELIVERY']).optional(),
});

export type IRestaurant = z.infer<typeof RestaurantSchema>;

export const RestaurantDeliveryStaffSchema = z.object({
  id: z.string().uuid(),
  restaurantId: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string().optional(),
  phone: z.string(),
  email: z.string().optional(),
  avatar: z.string().optional(),
  vehicleType: z.string().optional(),
  vehicleNumber: z.string().optional(),
  status: z.enum(['AVAILABLE', 'BUSY', 'OFFLINE']),
  isActive: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type IRestaurantDeliveryStaff = z.infer<typeof RestaurantDeliveryStaffSchema>;

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
