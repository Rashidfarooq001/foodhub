export declare enum UserRole {
    CUSTOMER = "CUSTOMER",
    HOTEL_STAFF = "HOTEL_STAFF",
    HOTEL_OWNER = "HOTEL_OWNER",
    DELIVERY_PARTNER = "DELIVERY_PARTNER",
    ADMIN = "ADMIN",
    SUPER_ADMIN = "SUPER_ADMIN"
}
export declare enum OrderStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    PREPARING = "PREPARING",
    READY_FOR_PICKUP = "READY_FOR_PICKUP",
    DRIVER_ASSIGNED = "DRIVER_ASSIGNED",
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED",
    REFUNDED = "REFUNDED"
}
export declare enum PaymentStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED"
}
export declare enum PaymentMethod {
    UPI = "UPI",
    CARD = "CARD",
    NET_BANKING = "NET_BANKING",
    WALLET = "WALLET",
    COD = "COD"
}
export declare enum VehicleType {
    BICYCLE = "BICYCLE",
    SCOOTER = "SCOOTER",
    MOTORCYCLE = "MOTORCYCLE",
    EV_SCOOTER = "EV_SCOOTER"
}
