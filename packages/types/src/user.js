import { z } from 'zod';
import { UserRole } from './enums.js';
export const UserSchema = z.object({
    id: z.string().uuid(),
    phone: z.string().min(10).max(15),
    email: z.string().email().optional(),
    role: z.nativeEnum(UserRole),
    isVerified: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const UserProfileSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    fullName: z.string().min(2),
    avatarUrl: z.string().url().optional(),
    fcmToken: z.string().optional(),
});
