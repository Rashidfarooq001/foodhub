# FoodHub — Order & Payment Engineering Guide

**Phases:** 10 (Order Management) & 11 (Payments & Settlements)

---

## 1. ORDER LIFECYCLE STATE MACHINE

```
PENDING
  ├─ ACCEPTED    (Restaurant accepts the order)
  │    ├─ PREPARING          (Kitchen starts cooking)
  │    │    └─ READY_FOR_PICKUP
  │    │             └─ DRIVER_ASSIGNED
  │    │                      └─ OUT_FOR_DELIVERY
  │    │                               ├─ DELIVERED ──► REFUNDED
  │    │                               └─ CANCELLED
  │    └─ CANCELLED
  └─ CANCELLED
```

Invalid transitions are rejected with `400 Bad Request` by `OrdersValidationService.validateStatusTransition()`.

---

## 2. ORDER MODULE — API ENDPOINTS

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/orders` | Place a new order | JWT |
| `GET` | `/api/v1/orders/:id` | Get order detail + full timeline | JWT |
| `GET` | `/api/v1/orders/:id/invoice` | Generate invoice JSON (GST, fees, total) | JWT |
| `POST` | `/api/v1/orders/:id/repeat` | Repeat a past order (returns cart payload) | JWT |
| `PATCH` | `/api/v1/orders/:id/status` | Update order status | JWT |
| `POST` | `/api/v1/orders/:id/cancel` | Cancel order (PENDING/ACCEPTED only) | JWT |
| `GET` | `/api/v1/orders/customer/:id` | Customer order history | JWT |
| `GET` | `/api/v1/orders/restaurant/:id` | Restaurant orders (filterable by status) | JWT |
| `GET` | `/api/v1/orders/driver/:id` | Driver delivery history | JWT |

---

## 3. CART MODULE — API ENDPOINTS

Redis-backed cart. Key: `cart:{userId}`, TTL: 7 days.

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/v1/cart` | Get cart | JWT |
| `POST` | `/api/v1/cart/items` | Add item | JWT |
| `PATCH` | `/api/v1/cart/items/:foodItemId` | Update item quantity | JWT |
| `DELETE` | `/api/v1/cart/items/:foodItemId` | Remove item | JWT |
| `DELETE` | `/api/v1/cart` | Clear cart | JWT |

**Cross-restaurant guard:** Adding an item from a different restaurant automatically clears the existing cart.

---

## 4. PAYMENT FLOW (Razorpay)

```
1. Customer clicks "Pay Now"
2. POST /api/v1/payments/create  →  { razorpayOrderId }
3. Frontend opens Razorpay checkout modal
4. Customer completes UPI / Card / COD
5. POST /api/v1/payments/verify  →  HMAC-SHA256 sig check
6. Payment.status = COMPLETED
7. Order.paymentStatus = COMPLETED
8. Socket.IO: order.accepted emitted
```

**Security:** All Razorpay webhooks verified via `x-razorpay-signature` HMAC-SHA256.  
**Idempotency:** `createPaymentOrder` returns existing `PENDING` payment if order already initiated.  
**Duplicate refund guard:** `initiateRefund` checks `PaymentRefund` table before calling Razorpay.

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/payments/create` | Create Razorpay order | JWT |
| `POST` | `/api/v1/payments/verify` | Verify payment signature | JWT |
| `POST` | `/api/v1/payments/webhook` | Razorpay webhook receiver | None (sig-verified) |
| `POST` | `/api/v1/payments/refund/:orderId` | Initiate refund | JWT |

---

## 5. SETTLEMENT ENGINE

```
Order DELIVERED
  → CommissionService.calculateForOrder()
      → platformFee = totalAmount × commissionRate%
      → restaurantNet = totalAmount − platformFee − ₹50 (driver flat)
      → driverEarning = ₹50 flat per delivery

Settlement Batch (weekly / manual)
  → SettlementsService.processRestaurantSettlement(restaurantId)
      → Aggregates all DELIVERED orders
      → Creates Settlement record with unique UTR number
      → restaurantNet credited

Driver Wallet Credit
  → SettlementsService.processDriverSettlement(driverId)
      → Reads all DELIVERED DeliveryAssignment.payoutAmount
      → Credits DriverWallet.balance atomically
```

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/api/v1/settlements/pending` | All pending payouts | Admin / Finance |
| `POST` | `/api/v1/settlements/restaurant/:id` | Process restaurant payout | Admin / Finance |
| `GET` | `/api/v1/settlements/restaurant/:id/history` | Settlement history | Admin / Finance / Owner |
| `POST` | `/api/v1/settlements/driver/:id` | Credit driver wallet | Admin / Finance |

---

## 6. WALLET MODULE

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/v1/wallet` | Get balance | JWT |
| `GET` | `/api/v1/wallet/transactions` | Paginated transaction history | JWT |

`WalletService.debit()` validates balance atomically before decrementing — prevents negative balance.

---

## 7. SOCKET.IO EVENTS REFERENCE

Gateway namespace: `/orders`

| Event | Direction | Payload | Room |
|---|---|---|---|
| `order.created` | Server → Restaurant | `{ orderId, orderNumber, totalAmount }` | `restaurant:{id}` |
| `order.accepted` | Server → Customer | `{ orderId, status, message }` | `order:{id}` |
| `order.preparing` | Server → Customer | `{ orderId, status }` | `order:{id}` |
| `order.ready` | Server → Customer | `{ orderId, status }` | `order:{id}` |
| `driver.assigned` | Server → Customer | `{ orderId, status }` | `order:{id}` |
| `order.picked_up` | Server → Customer | `{ orderId, status }` | `order:{id}` |
| `order.delivered` | Server → Customer | `{ orderId, status }` | `order:{id}` |
| `order.cancelled` | Server → Customer | `{ orderId, reason }` | `order:{id}` |
| `refund.initiated` | Server → Customer | `{ orderId, amount }` | `order:{id}` |

---

## 8. NEW DEPENDENCIES

| Package | Purpose |
|---|---|
| `razorpay` | Razorpay Node.js SDK for order creation & refunds |
| `@nestjs/websockets` | NestJS WebSocket decorators |
| `@nestjs/platform-socket.io` | Socket.IO adapter for NestJS |
| `socket.io` | WebSocket server library |
