"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuItemSchema = exports.RestaurantSchema = void 0;
const zod_1 = require("zod");
exports.RestaurantSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    ownerId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(2),
    slug: zod_1.z.string(),
    phone: zod_1.z.string(),
    licenseFssai: zod_1.z.string(),
    addressLine: zod_1.z.string(),
    latitude: zod_1.z.number(),
    longitude: zod_1.z.number(),
    isActive: zod_1.z.boolean(),
    isOpen: zod_1.z.boolean(),
    avgRating: zod_1.z.number(),
    commissionRate: zod_1.z.number(),
});
exports.MenuItemSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    restaurantId: zod_1.z.string().uuid(),
    categoryId: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    price: zod_1.z.number().positive(),
    imageUrl: zod_1.z.string().url().optional(),
    isVeg: zod_1.z.boolean(),
    isAvailable: zod_1.z.boolean(),
});
