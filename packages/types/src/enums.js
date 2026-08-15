"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestaurantDriverStatus = exports.DeliveryMode = exports.VehicleType = exports.PaymentMethod = exports.PaymentStatus = exports.DeliveryJobStatus = exports.OrderStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["CUSTOMER"] = "CUSTOMER";
    UserRole["HOTEL_STAFF"] = "HOTEL_STAFF";
    UserRole["HOTEL_OWNER"] = "HOTEL_OWNER";
    UserRole["DELIVERY_PARTNER"] = "DELIVERY_PARTNER";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "PENDING";
    OrderStatus["ACCEPTED"] = "ACCEPTED";
    OrderStatus["PREPARING"] = "PREPARING";
    OrderStatus["READY_FOR_PICKUP"] = "READY_FOR_PICKUP";
    OrderStatus["DRIVER_ASSIGNED"] = "DRIVER_ASSIGNED";
    OrderStatus["ARRIVED_AT_RESTAURANT"] = "ARRIVED_AT_RESTAURANT";
    OrderStatus["PICKED_UP"] = "PICKED_UP";
    OrderStatus["OUT_FOR_DELIVERY"] = "OUT_FOR_DELIVERY";
    OrderStatus["DELIVERED"] = "DELIVERED";
    OrderStatus["REJECTED"] = "REJECTED";
    OrderStatus["CANCELLED"] = "CANCELLED";
    OrderStatus["FAILED"] = "FAILED";
    OrderStatus["REFUNDED"] = "REFUNDED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var DeliveryJobStatus;
(function (DeliveryJobStatus) {
    DeliveryJobStatus["AVAILABLE"] = "AVAILABLE";
    DeliveryJobStatus["ASSIGNED"] = "ASSIGNED";
    DeliveryJobStatus["ARRIVED"] = "ARRIVED";
    DeliveryJobStatus["PICKED_UP"] = "PICKED_UP";
    DeliveryJobStatus["DELIVERED"] = "DELIVERED";
    DeliveryJobStatus["CANCELLED"] = "CANCELLED";
})(DeliveryJobStatus || (exports.DeliveryJobStatus = DeliveryJobStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["COMPLETED"] = "COMPLETED";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["UPI"] = "UPI";
    PaymentMethod["CARD"] = "CARD";
    PaymentMethod["NET_BANKING"] = "NET_BANKING";
    PaymentMethod["WALLET"] = "WALLET";
    PaymentMethod["COD"] = "COD";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var VehicleType;
(function (VehicleType) {
    VehicleType["BICYCLE"] = "BICYCLE";
    VehicleType["SCOOTER"] = "SCOOTER";
    VehicleType["MOTORCYCLE"] = "MOTORCYCLE";
    VehicleType["EV_SCOOTER"] = "EV_SCOOTER";
})(VehicleType || (exports.VehicleType = VehicleType = {}));
var DeliveryMode;
(function (DeliveryMode) {
    DeliveryMode["FOODHUB_DELIVERY"] = "FOODHUB_DELIVERY";
    DeliveryMode["RESTAURANT_SELF_DELIVERY"] = "RESTAURANT_SELF_DELIVERY";
})(DeliveryMode || (exports.DeliveryMode = DeliveryMode = {}));
var RestaurantDriverStatus;
(function (RestaurantDriverStatus) {
    RestaurantDriverStatus["AVAILABLE"] = "AVAILABLE";
    RestaurantDriverStatus["BUSY"] = "BUSY";
    RestaurantDriverStatus["OFFLINE"] = "OFFLINE";
})(RestaurantDriverStatus || (exports.RestaurantDriverStatus = RestaurantDriverStatus = {}));
