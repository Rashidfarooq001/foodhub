import { z } from 'zod';
import { OrderStatus, PaymentStatus, PaymentMethod } from './enums';

export const OrderSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),
  customerId: z.string().uuid(),
  restaurantId: z.string().uuid(),
  status: z.nativeEnum(OrderStatus),
  subtotal: z.number(),
  packagingFee: z.number(),
  deliveryFee: z.number(),
  taxAmount: z.number(),
  discountAmount: z.number(),
  totalAmount: z.number(),
  paymentStatus: z.nativeEnum(PaymentStatus),
  paymentMethod: z.nativeEnum(PaymentMethod),
  deliveryOtp: z.string().length(4),
  createdAt: z.date(),
});

export type IOrder = z.infer<typeof OrderSchema>;
