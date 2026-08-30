import { z } from 'zod';
import { VehicleType } from './enums.js';
export declare const DeliveryProfileSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    vehicleType: z.ZodNativeEnum<typeof VehicleType>;
    vehicleNumber: z.ZodString;
    licenseNumber: z.ZodString;
    isOnline: z.ZodBoolean;
    currentLat: z.ZodOptional<z.ZodNumber>;
    currentLng: z.ZodOptional<z.ZodNumber>;
    walletBalance: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    userId: string;
    vehicleType: VehicleType;
    vehicleNumber: string;
    licenseNumber: string;
    isOnline: boolean;
    walletBalance: number;
    currentLat?: number | undefined;
    currentLng?: number | undefined;
}, {
    id: string;
    userId: string;
    vehicleType: VehicleType;
    vehicleNumber: string;
    licenseNumber: string;
    isOnline: boolean;
    walletBalance: number;
    currentLat?: number | undefined;
    currentLng?: number | undefined;
}>;
export type IDeliveryProfile = z.infer<typeof DeliveryProfileSchema>;
