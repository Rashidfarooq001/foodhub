import { z } from 'zod';
import { VehicleType } from './enums';

export const DeliveryProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  vehicleType: z.nativeEnum(VehicleType),
  vehicleNumber: z.string(),
  licenseNumber: z.string(),
  isOnline: z.boolean(),
  currentLat: z.number().optional(),
  currentLng: z.number().optional(),
  walletBalance: z.number(),
});

export type IDeliveryProfile = z.infer<typeof DeliveryProfileSchema>;
