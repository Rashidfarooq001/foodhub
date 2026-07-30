import { z } from 'zod';
import { UserRole } from './enums';
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    phone: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    role: z.ZodNativeEnum<typeof UserRole>;
    isVerified: z.ZodBoolean;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    phone: string;
    role: UserRole;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    email?: string | undefined;
}, {
    id: string;
    phone: string;
    role: UserRole;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    email?: string | undefined;
}>;
export type IUser = z.infer<typeof UserSchema>;
export declare const UserProfileSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    fullName: z.ZodString;
    avatarUrl: z.ZodOptional<z.ZodString>;
    fcmToken: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    userId: string;
    fullName: string;
    avatarUrl?: string | undefined;
    fcmToken?: string | undefined;
}, {
    id: string;
    userId: string;
    fullName: string;
    avatarUrl?: string | undefined;
    fcmToken?: string | undefined;
}>;
export type IUserProfile = z.infer<typeof UserProfileSchema>;
