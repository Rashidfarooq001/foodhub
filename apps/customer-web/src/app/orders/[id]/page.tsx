'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Store,
  Clock,
  MapPin,
  Phone,
  User,
  CreditCard,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Star,
  HelpCircle,
  Download,
  FileText,
  ShieldCheck,
  Bike,
  AlertCircle,
  X,
} from 'lucide-react';
import { CustomerAuthGuard } from '../../../components/common/CustomerAuthGuard';
import { useAuthStore } from '../../../stores/use-auth-store';
import { useCartStore } from '../../../stores/use-cart-store';
import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { accessToken } = useAuthStore();
  const { addItem, clearCart } = useCartStore();

  const [order, setOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals
  const [showReceipt, setShowReceipt] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportIssue, setSupportIssue] = useState('Missing item');
  const [supportDescription, setSupportDescription] = useState('');
  const [supportSuccessMsg, setSupportSuccessMsg] = useState<string | null>(null);
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  const fetchOrderDetail = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.message || 'Order could not be loaded.');
      }
    } catch {
      setErrorMsg('Network error while loading order details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId, accessToken]);

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) return;
    setIsSubmittingCancel(true);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });
      if (res.ok) {
        setShowCancelModal(false);
        fetchOrderDetail();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to cancel order');
      }
    } catch {
      alert('Network error');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const handleSubmitReview = async () => {
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
      });
      if (res.ok) {
        setShowReviewModal(false);
        fetchOrderDetail();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to submit review');
      }
    } catch {
      alert('Network error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSubmitSupport = async () => {
    setIsSubmittingSupport(true);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ issueType: supportIssue, description: supportDescription }),
      });
      if (res.ok) {
        const data = await res.json();
        setSupportSuccessMsg(data.message || 'Support ticket created!');
        setTimeout(() => {
          setShowSupportModal(false);
          setSupportSuccessMsg(null);
        }, 2000);
      }
    } catch {
      alert('Network error');
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  const handleReorder = async () => {
    if (!order) return;
    try {
      const res = await fetch(`${API_BASE}/orders/${order.id}/repeat`, {
        method: 'POST',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.items && Array.isArray(data.items)) {
          clearCart();
          data.items.forEach((item: any) => {
            addItem({
              id: item.foodItemId,
              name: item.name || 'Food Item',
              price: item.price || 199,
              quantity: item.quantity || 1,
              restaurantId: order.restaurantId,
              restaurantName: order.restaurant?.name || 'Restaurant',
            } as any);
          });
          router.push('/checkout');
        }
      }
    } catch {
      /* fallback */
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="h-24 animate-pulse rounded-3xl bg-gray-100" />
        <div className="h-96 animate-pulse rounded-3xl bg-gray-100" />
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">Order Unavailable</h2>
        <p className="text-xs text-gray-500">{errorMsg || 'Order could not be loaded.'}</p>
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 rounded-2xl bg-orange-600 px-6 py-3 text-xs font-bold text-white shadow"
        >
          <ArrowLeft className="h-4 w-4" /> Back to My Orders
        </Link>
      </div>
    );
  }

  const deliveryAddress = order.deliveryAddress || {};
  const timelines = order.orderTimelines || [];
  const statusSteps = [
    { key: 'PENDING', label: 'Order Placed' },
    { key: 'ACCEPTED', label: 'Restaurant Confirmed' },
    { key: 'PREPARING', label: 'Preparing' },
    { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
    { key: 'DRIVER_ASSIGNED', label: 'Delivery Assigned' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { key: 'DELIVERED', label: 'Delivered' },
  ];

  const currentStepIndex = statusSteps.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <CustomerAuthGuard>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Top Back Link & Actions */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <Link
            href="/orders"
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to My Orders
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReceipt(true)}
              className="flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              <FileText className="h-4 w-4 text-orange-600" /> View Receipt
            </button>
            <button
              onClick={() => setShowSupportModal(true)}
              className="flex items-center gap-1.5 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-600 hover:bg-orange-100 shadow-sm"
            >
              <HelpCircle className="h-4 w-4" /> Need Help?
            </button>
          </div>
        </div>

        {/* ORDER HEADER CARD */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-black text-gray-900">Order #{order.orderNumber}</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                    order.status === 'DELIVERED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : isCancelled
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {!isCancelled && order.status !== 'DELIVERED' && (
              <Link
                href={`/orders/${order.id}/track`}
                className="flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-3 text-xs font-black text-white shadow-lg shadow-orange-500/25 hover:bg-orange-700 transition"
              >
                <Clock className="h-4 w-4 animate-spin" />
                <span>Track Live Delivery Map</span>
              </Link>
            )}
          </div>

          {/* STATUS TIMELINE */}
          {!isCancelled ? (
            <div className="py-4">
              <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-4">Order Progress</h4>
              <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 text-center">
                {statusSteps.map((step, idx) => {
                  const isDone = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;
                  const timelineEntry = timelines.find((t: any) => t.status === step.key);
                  return (
                    <div key={step.key} className="space-y-1">
                      <div
                        className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                          isDone
                            ? 'bg-emerald-600 text-white shadow'
                            : 'bg-gray-100 text-gray-400 border border-gray-200'
                        }`}
                      >
                        {isDone ? '✓' : idx + 1}
                      </div>
                      <p className={`text-[10px] font-bold ${isCurrent ? 'text-orange-600' : isDone ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                      {timelineEntry && (
                        <p className="text-[9px] text-gray-400">
                          {new Date(timelineEntry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-rose-50 p-4 border border-rose-200 text-xs font-bold text-rose-800 space-y-1">
              <span className="uppercase text-[10px] text-rose-600 font-black">Order Cancelled</span>
              <p>{order.cancellation?.reason || 'Order was cancelled by customer / store.'}</p>
              {order.refund && (
                <p className="text-[11px] font-semibold text-rose-700 pt-1">
                  Refund Status: <span className="uppercase font-black text-emerald-700">{order.refund.isProcessed ? 'REFUNDED' : 'PROCESSING'}</span> (₹{Number(order.refund.amount)})
                </p>
              )}
            </div>
          )}
        </div>

        {/* RESTAURANT & ITEMS BREAKDOWN */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Restaurant Info Card */}
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <Store className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">{order.restaurant?.name}</h3>
                  <p className="text-xs text-gray-500">{order.restaurant?.addressLine}</p>
                </div>
              </div>

              {order.restaurant?.phone && (
                <a
                  href={`tel:${order.restaurant.phone}`}
                  className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 flex items-center gap-1.5"
                >
                  <Phone className="h-3.5 w-3.5" /> Call Store
                </a>
              )}
            </div>

            {/* Itemization Table */}
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-base font-black text-gray-900 border-b border-gray-100 pb-3">Items Ordered</h3>
              <div className="divide-y divide-gray-100">
                {(order.orderItems || []).map((item: any) => (
                  <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-gray-900">{item.foodItem?.name || item.name || 'Food Item'}</p>
                      <p className="text-[10px] text-gray-500">Qty: {item.quantity} × ₹{Number(item.unitPrice)}</p>
                    </div>
                    <span className="font-black text-gray-900">₹{Number(item.totalPrice).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address & Courier Card */}
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-base font-black text-gray-900 border-b border-gray-100 pb-3">Delivery Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="block font-semibold text-gray-400 mb-1">Delivery Address</span>
                  <p className="font-bold text-gray-900">{deliveryAddress.addressLine1 || deliveryAddress.street}</p>
                  <p className="text-gray-500">{deliveryAddress.city}, {deliveryAddress.state} - {deliveryAddress.postalCode}</p>
                </div>

                <div>
                  <span className="block font-semibold text-gray-400 mb-1">Assigned Delivery Partner</span>
                  {order.assignedRestaurantDriver ? (
                    <div>
                      <p className="font-bold text-gray-900">
                        {order.assignedRestaurantDriver.firstName} {order.assignedRestaurantDriver.lastName || ''}
                      </p>
                      <p className="text-gray-500">{order.assignedRestaurantDriver.phone} ({order.assignedRestaurantDriver.vehicleNumber})</p>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Delivery partner assigned upon dispatch</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Price Summary & Actions */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-base font-black text-gray-900 border-b border-gray-100 pb-3">Bill Summary</h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Item Subtotal</span>
                  <span className="font-bold text-gray-900">₹{Number(order.subtotal).toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Packaging Fee</span>
                  <span className="font-bold text-gray-900">₹{Number(order.packagingFee || 0).toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-gray-900">₹{Number(order.deliveryFee || 0).toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Taxes (GST 5%)</span>
                  <span className="font-bold text-gray-900">₹{Number(order.taxAmount || 0).toFixed(2)}</span>
                </div>

                {Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount</span>
                    <span>-₹{Number(order.discountAmount).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-black text-gray-900 border-t border-gray-100 pt-3">
                  <span>Grand Total</span>
                  <span className="text-orange-600">₹{Number(order.totalAmount).toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-400">Payment Method</span>
                  <span className="font-bold text-gray-900 uppercase">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-400">Payment Status</span>
                  <span className="font-bold text-emerald-700 uppercase">{order.paymentStatus}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                {order.status === 'DELIVERED' && (
                  <>
                    <button
                      onClick={handleReorder}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-xs font-black text-white shadow-lg hover:bg-orange-700 transition"
                    >
                      <RotateCcw className="h-4 w-4" /> Reorder Meal
                    </button>

                    {order.restaurantReviews && order.restaurantReviews.length > 0 ? (
                      <div className="rounded-2xl bg-amber-50/80 p-4 border border-amber-200 text-xs space-y-1.5 text-left">
                        <div className="flex items-center justify-between font-bold text-amber-950">
                          <span>Your Review</span>
                          <span className="flex items-center gap-1 text-amber-600 font-black">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {order.restaurantReviews[0].rating} / 5
                          </span>
                        </div>
                        <p className="text-gray-700 italic font-medium">
                          "{order.restaurantReviews[0].comment}"
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowReviewModal(true)}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 py-3 text-xs font-bold text-amber-900 hover:bg-amber-100 transition"
                      >
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> Rate &amp; Review Store
                      </button>
                    )}
                  </>
                )}

                {(order.status === 'PENDING' || order.status === 'ACCEPTED') && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 py-3 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
                  >
                    <XCircle className="h-4 w-4" /> Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RECEIPT MODAL */}
        {showReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-lg font-black text-gray-900">FoodHub Tax Invoice</h3>
                <button onClick={() => setShowReceipt(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="text-xs space-y-3 font-mono bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <p className="font-bold text-center text-sm">FOODHUB OFFICIAL RECEIPT</p>
                <p>Invoice #: INV-{order.orderNumber}</p>
                <p>Date: {new Date(order.createdAt).toLocaleString()}</p>
                <p>Store: {order.restaurant?.name}</p>
                <hr />
                {(order.orderItems || []).map((i: any) => (
                  <div key={i.id} className="flex justify-between">
                    <span>{i.quantity}x {i.foodItem?.name || i.name}</span>
                    <span>₹{Number(i.totalPrice).toFixed(2)}</span>
                  </div>
                ))}
                <hr />
                <div className="flex justify-between font-bold">
                  <span>Grand Total</span>
                  <span>₹{Number(order.totalAmount).toFixed(2)}</span>
                </div>
                <p>Payment: {order.paymentMethod} ({order.paymentStatus})</p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-2xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-orange-700"
                >
                  <Download className="h-4 w-4" /> Print / Save Receipt
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CANCEL MODAL */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
              <h3 className="text-lg font-black text-rose-600">Cancel Order</h3>
              <p className="text-xs text-gray-500">Please provide a reason for cancelling this order.</p>

              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation..."
                className="w-full rounded-2xl border border-gray-200 p-3 text-xs font-bold text-gray-900 focus:outline-none"
              />

              <div className="flex justify-end gap-2">
                <button onClick={() => setShowCancelModal(false)} className="px-4 py-2 text-xs font-bold text-gray-600">
                  Close
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={isSubmittingCancel}
                  className="rounded-2xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-rose-700 disabled:opacity-50"
                >
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REVIEW MODAL */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
              <h3 className="text-lg font-black text-gray-900">Rate &amp; Review Order</h3>

              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 text-amber-400"
                  >
                    <Star className={`h-8 w-8 ${star <= reviewRating ? 'fill-amber-400' : 'text-gray-200'}`} />
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="How was the food quality &amp; delivery experience?"
                className="w-full rounded-2xl border border-gray-200 p-3 text-xs font-bold text-gray-900 focus:outline-none"
              />

              <div className="flex justify-end gap-2">
                <button onClick={() => setShowReviewModal(false)} className="px-4 py-2 text-xs font-bold text-gray-600">
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={isSubmittingReview}
                  className="rounded-2xl bg-orange-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-orange-700 disabled:opacity-50"
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUPPORT MODAL */}
        {showSupportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
              <h3 className="text-lg font-black text-gray-900">Need Help with Order #{order.orderNumber}?</h3>

              {supportSuccessMsg ? (
                <div className="rounded-2xl bg-emerald-50 p-4 text-xs font-bold text-emerald-800 border border-emerald-200">
                  ✓ {supportSuccessMsg}
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Issue Type</label>
                    <select
                      value={supportIssue}
                      onChange={(e) => setSupportIssue(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 p-3 text-xs font-bold text-gray-900 focus:outline-none"
                    >
                      <option value="Missing item">Missing item from order</option>
                      <option value="Wrong item">Wrong item delivered</option>
                      <option value="Food quality issue">Food quality / taste issue</option>
                      <option value="Delivery delay">Delivery delay</option>
                      <option value="Payment problem">Payment or refund inquiry</option>
                      <option value="Other">Other issue</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={supportDescription}
                      onChange={(e) => setSupportDescription(e.target.value)}
                      placeholder="Explain what went wrong..."
                      className="w-full rounded-2xl border border-gray-200 p-3 text-xs font-bold text-gray-900 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setShowSupportModal(false)} className="px-4 py-2 text-xs font-bold text-gray-600">
                      Close
                    </button>
                    <button
                      onClick={handleSubmitSupport}
                      disabled={isSubmittingSupport}
                      className="rounded-2xl bg-orange-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-orange-700 disabled:opacity-50"
                    >
                      Submit Ticket
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </CustomerAuthGuard>
  );
}
