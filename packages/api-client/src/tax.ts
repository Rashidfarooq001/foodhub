import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export interface TaxComponentDetail {
  componentCode: string;
  taxableAmount: number;
  rate?: number;
  cgst?: number;
  sgst?: number;
  utgst?: number;
  igst?: number;
  totalTax: number;
  taxCategory?: string;
  sacCode?: string;
  sectionReference?: string;
  legalReference?: string;
  isInterstate?: boolean;
}

export interface CustomerOrderQuoteData {
  foodSubtotal: number;
  customerDeliveryFee: number;
  platformFee: number;
  smallOrderFee: number;
  discountAmount: number;
  tipAmount: number;

  distanceKm: number | null;
  etaMinutes: number | null;
  routeAvailable: boolean;
  serviceable: boolean;
  distanceType: 'MAPPLS_ROAD_ROUTING';
  deliveryEligible: boolean;
  deliveryRadiusKm: number;
  locationSource: string;

  totalCustomerTaxes: number;
  customerTotal: number;
  taxItems: TaxComponentDetail[];
  quoteTimestamp: string;

  deliveryDistanceKm?: number;
  deliveryFeeBaseKm?: number;
  deliveryFeeBaseAmount?: number;
  deliveryFeePerExtraKm?: number;
}

export interface AdminOrderQuoteData extends CustomerOrderQuoteData {
  packagingFee: number;
  restaurantCommissionPercent: number;
  restaurantCommission: number;
  restaurantCommissionGst: number;
  restaurantSettlement: number;

  riderBasePay: number;
  riderDistancePay: number;
  riderTip: number;
  totalRiderPayout: number;

  paymentGatewayCost: number;
  statutoryGstLiability: number;
  platformOperatingRevenue: number;
  platformContributionMargin: number;
  taxEngineVersion: string;
}

export type OrderQuoteData = CustomerOrderQuoteData;

export async function fetchOrderQuote(req: {
  foodSubtotal: number;
  distanceKm?: number;
  restaurantId?: string;
  latitude?: number;
  longitude?: number;
  locationSource?: 'CURRENT_GPS' | 'MANUAL_GEOCODED' | 'SAVED_ADDRESS';
  tipAmount?: number;
  discountAmount?: number;
  customerState?: string;
  restaurantState?: string;
}): Promise<CustomerOrderQuoteData | null> {
  try {
    const res = await fetch(`${API_BASE}/orders/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    /* fallback */
  }
  return null;
}

export async function fetchActiveTaxRules(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/tax/rules`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    /* fallback */
  }
  return [];
}


