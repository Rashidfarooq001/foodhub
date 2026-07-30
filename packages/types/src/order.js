"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("./enums");
exports.OrderSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    orderNumber: zod_1.z.string(),
    customerId: zod_1.z.string().uuid(),
    restaurantId: zod_1.z.string().uuid(),
    status: zod_1.z.nativeEnum(enums_1.OrderStatus),
    subtotal: zod_1.z.number(),
    packagingFee: zod_1.z.number(),
    deliveryFee: zod_1.z.number(),
    taxAmount: zod_1.z.number(),
    discountAmount: zod_1.z.number(),
    totalAmount: zod_1.z.number(),
    paymentStatus: zod_1.z.nativeEnum(enums_1.PaymentStatus),
    paymentMethod: zod_1.z.nativeEnum(enums_1.PaymentMethod),
    deliveryOtp: zod_1.z.string().length(4),
    createdAt: zod_1.z.date(),
});
