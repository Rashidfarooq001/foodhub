import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface TaxComponentInput {
  componentCode: string; // RESTAURANT_FOOD_SERVICE, PLATFORM_FEE, SMALL_ORDER_FEE, DELIVERY_SERVICE, RESTAURANT_COMMISSION, PAYMENT_GATEWAY, RIDER_TIP
  taxableAmount: number;
  supplierState?: string;
  recipientState?: string;
  transactionDate?: Date;
}

export interface TaxComponentOutput {
  componentCode: string;
  taxableAmount: number;
  rate: number;
  cgst: number;
  sgst: number;
  utgst: number;
  igst: number;
  totalTax: number;
  taxRuleId?: string;
  taxCategory?: string;
  sacCode?: string;
  sectionReference?: string;
  legalReference?: string;
  isInterstate: boolean;
}

export const DEFAULT_STATUTORY_TAX_RULES = [
  {
    code: 'RESTAURANT_FOOD_SERVICE',
    name: 'Restaurant Food Service (Sec 9(5) ECO)',
    componentType: 'FOOD',
    taxCategory: 'ECO_SECTION_9_5',
    sacCode: '996331',
    rate: 5.0,
    cgstRate: 2.5,
    sgstRate: 2.5,
    utgstRate: 0.0,
    igstRate: 5.0,
    supplierType: 'RESTAURANT',
    recipientType: 'CUSTOMER',
    placeOfSupplyRule: 'LOCATION_OF_RESTAURANT',
    sectionReference: 'CGST Act Sec 9(5)',
    notificationReference: 'Notification No. 17/2021-Central Tax (Rate)',
    legalReference: 'Section 9(5) E-Commerce Operator Restaurant Service Levy',
    notes: 'FoodHub collects & remits 5% GST on behalf of restaurant',
  },
  {
    code: 'PLATFORM_FEE',
    name: 'FoodHub Platform Convenience Fee',
    componentType: 'PLATFORM_FEE',
    taxCategory: 'SERVICE_TAX',
    sacCode: '998314',
    rate: 18.0,
    cgstRate: 9.0,
    sgstRate: 9.0,
    utgstRate: 0.0,
    igstRate: 18.0,
    supplierType: 'ECO_FOODHUB',
    recipientType: 'CUSTOMER',
    placeOfSupplyRule: 'LOCATION_OF_RECIPIENT',
    sectionReference: 'CGST Act Sec 9(1)',
    notificationReference: 'Notification No. 11/2017-Central Tax (Rate)',
    legalReference: 'Information Technology & Platform Access Service',
    notes: 'FoodHub technology convenience charge',
  },
  {
    code: 'SMALL_ORDER_FEE',
    name: 'Small Order Convenience Fee',
    componentType: 'SMALL_ORDER_FEE',
    taxCategory: 'SERVICE_TAX',
    sacCode: '998314',
    rate: 18.0,
    cgstRate: 9.0,
    sgstRate: 9.0,
    utgstRate: 0.0,
    igstRate: 18.0,
    supplierType: 'ECO_FOODHUB',
    recipientType: 'CUSTOMER',
    placeOfSupplyRule: 'LOCATION_OF_RECIPIENT',
    sectionReference: 'CGST Act Sec 9(1)',
    notificationReference: 'Notification No. 11/2017-Central Tax (Rate)',
    legalReference: 'Small Order Logistics Surcharge Service',
    notes: 'Applied when order food subtotal is below minimum threshold',
  },
  {
    code: 'DELIVERY_SERVICE',
    name: 'Customer Delivery Logistics Charge',
    componentType: 'DELIVERY',
    taxCategory: 'CONFIGURABLE_TAX',
    sacCode: '996511',
    rate: 0.0,
    cgstRate: 0.0,
    sgstRate: 0.0,
    utgstRate: 0.0,
    igstRate: 0.0,
    supplierType: 'ECO_FOODHUB',
    recipientType: 'CUSTOMER',
    placeOfSupplyRule: 'SUPPLIER_LOCATION',
    sectionReference: 'CGST Act Sec 9(1)',
    notificationReference: 'Delivery Logistics Tax Treatment',
    legalReference: 'Configurable Logistics Tax Rule',
    notes: 'Configurable delivery tax rate (default 0%)',
  },
  {
    code: 'RESTAURANT_COMMISSION',
    name: 'FoodHub Merchant Commission',
    componentType: 'COMMISSION',
    taxCategory: 'MERCHANT_SERVICE',
    sacCode: '998314',
    rate: 18.0,
    cgstRate: 9.0,
    sgstRate: 9.0,
    utgstRate: 0.0,
    igstRate: 18.0,
    supplierType: 'ECO_FOODHUB',
    recipientType: 'RESTAURANT',
    placeOfSupplyRule: 'LOCATION_OF_RESTAURANT',
    sectionReference: 'CGST Act Sec 9(1)',
    notificationReference: 'Merchant Platform Commission GST',
    legalReference: 'B2B Merchant Marketplace Service',
    notes: 'GST charged by FoodHub on restaurant commission income',
  },
  {
    code: 'PAYMENT_GATEWAY',
    name: 'Payment Gateway Processing Expense',
    componentType: 'GATEWAY',
    taxCategory: 'FINANCIAL_COST',
    sacCode: '997159',
    rate: 18.0,
    cgstRate: 9.0,
    sgstRate: 9.0,
    utgstRate: 0.0,
    igstRate: 18.0,
    supplierType: 'GATEWAY_PROVIDER',
    recipientType: 'ECO_FOODHUB',
    placeOfSupplyRule: 'SUPPLIER_LOCATION',
    sectionReference: 'CGST Act Sec 9(1)',
    notificationReference: 'Financial Gateway Processing GST',
    legalReference: 'B2B Payment Processing Fee Expense',
    notes: 'Tracked as FoodHub financial operating cost (NOT customer tax)',
  },
  {
    code: 'RIDER_TIP',
    name: 'Rider Customer Gratuity Pass-Through',
    componentType: 'TIP',
    taxCategory: 'PASS_THROUGH',
    sacCode: 'N/A',
    rate: 0.0,
    cgstRate: 0.0,
    sgstRate: 0.0,
    utgstRate: 0.0,
    igstRate: 0.0,
    supplierType: 'CUSTOMER',
    recipientType: 'DELIVERY_PARTNER',
    placeOfSupplyRule: 'LOCATION_OF_RECIPIENT',
    sectionReference: 'Direct Gratuity Pass-Through',
    notificationReference: 'Non-taxable Direct Customer Tip',
    legalReference: '100% Pass-Through Customer Gratuity to Rider',
    notes: '100% passed directly to rider with zero platform deduction',
  },
];

@Injectable()
export class TaxEngineService implements OnModuleInit {
  private readonly logger = new Logger(TaxEngineService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultTaxRules();
  }

  async seedDefaultTaxRules() {
    try {
      for (const rule of DEFAULT_STATUTORY_TAX_RULES) {
        const existing = await this.prisma.taxRule.findUnique({
          where: { code: rule.code },
        });

        if (!existing) {
          await this.prisma.taxRule.create({
            data: {
              code: rule.code,
              name: rule.name,
              componentType: rule.componentType,
              taxCategory: rule.taxCategory,
              sacCode: rule.sacCode,
              rate: rule.rate,
              cgstRate: rule.cgstRate,
              sgstRate: rule.sgstRate,
              utgstRate: rule.utgstRate,
              igstRate: rule.igstRate,
              supplierType: rule.supplierType,
              recipientType: rule.recipientType,
              placeOfSupplyRule: rule.placeOfSupplyRule,
              sectionReference: rule.sectionReference,
              notificationReference: rule.notificationReference,
              legalReference: rule.legalReference,
              notes: rule.notes,
              isActive: true,
            },
          });
        }
      }
    } catch (err: any) {
      this.logger.error(`Error seeding default statutory tax rules: ${err.message}`);
    }
  }

  async getActiveTaxRule(code: string, transactionDate: Date = new Date()) {
    try {
      const rule = await this.prisma.taxRule.findFirst({
        where: {
          code,
          isActive: true,
          effectiveFrom: { lte: transactionDate },
          OR: [
            { effectiveTill: null },
            { effectiveTill: { gte: transactionDate } },
          ],
        },
        orderBy: { effectiveFrom: 'desc' },
      });

      if (rule) return rule;
    } catch {
      /* fallback */
    }

    // Fallback to default in-memory definition
    const def = DEFAULT_STATUTORY_TAX_RULES.find((r) => r.code === code);
    return def ? { ...def, id: `default-${code}` } : null;
  }

  async calculateTaxComponent(input: TaxComponentInput): Promise<TaxComponentOutput> {
    const amount = Math.max(0, input.taxableAmount || 0);
    const txDate = input.transactionDate || new Date();
    const rule = await this.getActiveTaxRule(input.componentCode, txDate);

    if (!rule || amount === 0) {
      return {
        componentCode: input.componentCode,
        taxableAmount: amount,
        rate: 0,
        cgst: 0,
        sgst: 0,
        utgst: 0,
        igst: 0,
        totalTax: 0,
        isInterstate: false,
      };
    }

    const supplierState = (input.supplierState || 'J&K').toUpperCase().trim();
    const recipientState = (input.recipientState || 'J&K').toUpperCase().trim();
    const isInterstate = supplierState !== recipientState && supplierState.length > 0 && recipientState.length > 0;

    const rate = Number(rule.rate);
    const cgstRate = Number(rule.cgstRate);
    const sgstRate = Number(rule.sgstRate);
    const utgstRate = Number(rule.utgstRate);
    const igstRate = Number(rule.igstRate);

    let cgst = 0;
    let sgst = 0;
    let utgst = 0;
    let igst = 0;
    let totalTax = 0;

    if (rate > 0) {
      if (isInterstate) {
        igst = Math.round(amount * (igstRate / 100) * 100) / 100;
        totalTax = igst;
      } else {
        cgst = Math.round(amount * (cgstRate / 100) * 100) / 100;
        sgst = Math.round(amount * (sgstRate / 100) * 100) / 100;
        utgst = Math.round(amount * (utgstRate / 100) * 100) / 100;
        totalTax = Math.round((cgst + sgst + utgst) * 100) / 100;
      }
    }

    return {
      componentCode: input.componentCode,
      taxableAmount: amount,
      rate,
      cgst,
      sgst,
      utgst,
      igst,
      totalTax,
      taxRuleId: (rule as any).id,
      taxCategory: rule.taxCategory,
      sacCode: rule.sacCode || undefined,
      sectionReference: rule.sectionReference || undefined,
      legalReference: rule.legalReference || undefined,
      isInterstate,
    };
  }
}
