"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryProfileSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("./enums");
exports.DeliveryProfileSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    vehicleType: zod_1.z.nativeEnum(enums_1.VehicleType),
    vehicleNumber: zod_1.z.string(),
    licenseNumber: zod_1.z.string(),
    isOnline: zod_1.z.boolean(),
    currentLat: zod_1.z.number().optional(),
    currentLng: zod_1.z.number().optional(),
    walletBalance: zod_1.z.number(),
});
