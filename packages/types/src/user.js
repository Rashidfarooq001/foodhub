"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProfileSchema = exports.UserSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("./enums");
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    phone: zod_1.z.string().min(10).max(15),
    email: zod_1.z.string().email().optional(),
    role: zod_1.z.nativeEnum(enums_1.UserRole),
    isVerified: zod_1.z.boolean(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.UserProfileSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    fullName: zod_1.z.string().min(2),
    avatarUrl: zod_1.z.string().url().optional(),
    fcmToken: zod_1.z.string().optional(),
});
