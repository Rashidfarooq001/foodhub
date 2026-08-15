import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export interface TaxComponentDetail {
  componentCode: string;
  taxableAmount: number;
  rate: number;
  cgst: number;
  sgst: number;
  utgst: number;
  igst: number;
  totalTax: number;
  taxCategory?: string;
  sacCode?: string;
  sectionReference?: string;
  legalReference?: string;
  isInterstate: boolean;
}

export interface OrderQuoteData {
  foodSubtotal: number;
  customerDeliveryFee: number;
  platformFee: number;
  smallOrderFee: number;
  packagingFee: number;
  discountAmount: number;
  tipAmount: number;

  taxItems: TaxComponentDetail[];
  restaurantFoodGst: number;
  platformFeeGst: number;
  smallOrderFeeGst: number;
  deliveryFeeGst: number;
  totalCustomerTaxes: number;
  customerTotal: number;

  restaurantCommissionPercent: number;
  restaurantCommission: number;
  restaurantCommissionGst: number;
  restaurantSettlement: number;

  riderBasePay: number;
  riderDistancePay: number;
  riderTip: number;
  totalRiderPayout: number;

  statutoryGstLiability: number;
  platformOperatingRevenue: number;
  platformContributionMargin: number;

  taxEngineVersion: string;
  quoteTimestamp: string;
}

export async function fetchOrderQuote(req: {
  foodSubtotal: number;
  distanceKm: number;
  tipAmount?: number;
  discountAmount?: number;
  packagingFee?: number;
  customerState?: string;
  restaurantState?: string;
}): Promise<OrderQuoteData | null> {
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
