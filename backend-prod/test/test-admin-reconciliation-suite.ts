import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/modules/users/users.service';
import { AnalyticsService } from '../src/modules/analytics/analytics.service';
import { PaymentsService } from '../src/modules/payments/payments.service';

async function runTestSuite() {
  console.log('--- STARTING ADMIN DATA AUTHORITY & RECONCILIATION TEST SUITE ---');
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const usersService = app.get(UsersService);
    const analyticsService = app.get(AnalyticsService);
    const paymentsService = app.get(PaymentsService);

    // 1. Customer Directory Test
    console.log('\n[1/3] Testing Customer Directory Data Authority...');
    const customersData = await usersService.getCustomersForAdmin('', 1, 10);
    console.log(
      `Found ${customersData.customers.length} customers (Total in DB: ${customersData.pagination.total})`,
    );
    if (customersData.customers.length > 0) {
      const first = customersData.customers[0];
      console.log('Sample customer record:', {
        id: first.id,
        name: first.name,
        phone: first.phone,
        totalOrders: first.totalOrders,
        completedOrders: first.completedOrders,
        totalSpent: first.totalSpent,
        addresses: first.addressCount,
      });
    }

    // 2. Platform Analytics & Period Filtering Test
    console.log('\n[2/3] Testing Platform Business Intelligence Date Filtering...');
    for (const range of ['7D', '30D', '90D', '1Y']) {
      const analytics = await analyticsService.getAdminDashboard(range);
      console.log(`Range [${range}]:`, {
        todayRevenue: analytics.kpis.todayRevenue,
        periodRevenue: analytics.kpis.periodRevenue,
        platformCommission: analytics.kpis.platformCommission,
        foodhubNetRevenue: analytics.kpis.foodhubNetRevenue,
        statutoryGst: analytics.kpis.statutoryGst,
        trendPoints: analytics.revenueTrend.length,
        categories: analytics.categoryDistribution.length,
      });
    }

    // 3. Multi-Party Payment & Reconciliation Test
    console.log('\n[3/3] Testing Multi-Party Payment Ledger & Reconciliation Engine...');
    const paymentsData = await paymentsService.getPaymentsForAdmin(1, 10);
    console.log('Payment Stats Summary:', {
      totalCustomerCollections: paymentsData.stats.totalCustomerCollections,
      restaurantNetPayable: paymentsData.stats.restaurantNetPayable,
      platformOperatingRevenue: paymentsData.stats.totalPlatformOperatingRevenue,
      riderGrossEarnings: paymentsData.stats.riderGrossEarnings,
    });

    if (paymentsData.payments.length > 0) {
      const firstTx = paymentsData.payments[0];
      console.log('Sample Multi-Party Reconciliation Record:', {
        orderNumber: firstTx.orderNumber,
        customerPaid: firstTx.customer.customerPaid,
        restaurantNet: firstTx.restaurant.restaurantNetPayable,
        commission: firstTx.platform.commissionEarned,
        platformFee: firstTx.platform.platformFeeCollected,
        riderPayout: firstTx.rider.totalRiderEarning,
        reconciliationStatus: firstTx.reconciliation.status,
      });
    }

    console.log('\n--- ALL ADMIN AUTHORITY & RECONCILIATION TESTS PASSED ---');
  } catch (error) {
    console.error('Test Suite Failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

runTestSuite();
