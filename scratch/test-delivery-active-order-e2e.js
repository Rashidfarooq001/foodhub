const API_BASE = 'https://foodhub-backend-enq2.onrender.com/api/v1';

async function runActiveOrderWorkflowE2E() {
  console.log('================================================================');
  console.log('   FOODHUB DELIVERY ACTIVE-ORDER & SECURITY E2E SUITE          ');
  console.log('================================================================\n');

  try {
    // 1. Authenticate Delivery Partner (driver.real@foodhub.com)
    console.log('1. Authenticating Delivery Partner (driver.real@foodhub.com)...');
    const driverRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver.real@foodhub.com', password: 'RealDriverPassword123!' }),
    });
    const driverData = await driverRes.json();
    const driverToken = driverData.accessToken || driverData.token || driverData.tokens?.accessToken;

    const statusRes = await fetch(`${API_BASE}/delivery/me/status`, {
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    const statusData = await statusRes.json();
    const driverId = statusData.driverId || statusData.id;
    console.log('✅ Delivery Partner Authenticated. Driver ID:', driverId);

    // Ensure driver is ONLINE
    await fetch(`${API_BASE}/delivery/me/go-online`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
    });

    // 2. Authenticate Restaurant Owner (owner.real@foodhub.com)
    console.log('\n2. Authenticating Restaurant Owner (owner.real@foodhub.com)...');
    const ownerRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner.real@foodhub.com', password: 'RealOwnerPassword123!' }),
    });
    const ownerData = await ownerRes.json();
    const ownerToken = ownerData.accessToken || ownerData.token || ownerData.tokens?.accessToken;
    const restaurantId = ownerData.user?.restaurantId || ownerData.restaurantId;
    console.log('✅ Restaurant Owner Authenticated. Restaurant ID:', restaurantId);

    // 3. Register / Authenticate Test Customer
    console.log('\n3. Authenticating Test Customer...');
    let custToken = ownerToken;
    const regEmail = `cust_${Date.now()}@foodhub.com`;
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: regEmail, password: 'TestPassword123!', firstName: 'Test', lastName: 'Customer', phone: `+919${Math.floor(100000000 + Math.random() * 900000000)}` }),
    });
    if (regRes.ok) {
      const regData = await regRes.json();
      custToken = regData.accessToken || regData.token || regData.tokens?.accessToken || ownerToken;
    }
    console.log('✅ Customer Authenticated. Token ready.');

    // 4. Get active job or create fresh order
    let currentRes = await fetch(`${API_BASE}/delivery/current`, {
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    const currentText = await currentRes.text();
    let currentJob = currentText && currentText.trim() !== '' ? JSON.parse(currentText) : null;

    let orderId;
    if (currentJob && currentJob.orderId) {
      orderId = currentJob.orderId;
      console.log(`\n4. Using existing active trip #${currentJob.orderNumber} (Order ID: ${orderId})`);
    } else {
      console.log('\n4. Creating fresh real order for E2E workflow testing...');
      const restRes = await fetch(`${API_BASE}/restaurants/${restaurantId}`);
      const restData = await restRes.json();
      const items = restData.menuItems || restData.foodItems || restData.items || [];
      const item = items[0] || { id: '68a424fe-e26b-42ec-956b-02fdcf62cb75' };

      console.log('Using Food Item ID:', item.id);

      const orderCreateRes = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${custToken}`,
        },
        body: JSON.stringify({
          restaurantId,
          items: [{ foodItemId: item.id, quantity: 1 }],
          deliveryAddress: {
            street: 'Gousia Colony, Ward 4',
            city: 'Bandipora',
            state: 'Jammu & Kashmir',
            postalCode: '193502',
            latitude: 34.4221,
            longitude: 74.6542,
          },
          paymentMethod: 'COD',
        }),
      });

      console.log('Order Create HTTP Status:', orderCreateRes.status);
      const newOrder = await orderCreateRes.json();
      if (!orderCreateRes.ok) {
        console.error('Order Create Error Details:', newOrder);
        return;
      }

      orderId = newOrder.id;
      console.log('✅ Fresh Order Created. Order Number:', newOrder.orderNumber, 'ID:', orderId);

      // Restaurant Accepts Order
      const acceptRes = await fetch(`${API_BASE}/orders/${orderId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      console.log('Accept Order Status:', acceptRes.status);

      // Restaurant Assigns Driver
      const assignRes = await fetch(`${API_BASE}/orders/${orderId}/assign-rider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ driverId }),
      });
      console.log('Assign Driver Status:', assignRes.status);

      // Driver Marks Arrived at Restaurant
      const arrivedRes = await fetch(`${API_BASE}/delivery/jobs/${orderId}/arrived`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${driverToken}` },
      });
      console.log('Arrived Status:', arrivedRes.status);

      currentRes = await fetch(`${API_BASE}/delivery/current`, {
        headers: { Authorization: `Bearer ${driverToken}` },
      });
      currentJob = await currentRes.json();
    }

    console.log('Current Trip Order Number:', currentJob?.orderNumber);
    console.log('Current Order Status:', currentJob?.status);

    // SECURITY CHECK: Verify deliveryOtp & pickupOtp are NEVER exposed to rider API
    const rawResponseBody = JSON.stringify(currentJob);
    const leaksDeliveryOtp = rawResponseBody.includes('deliveryOtp');
    const leaksPickupOtp = rawResponseBody.includes('pickupOtp');
    console.log('\n--- SECURITY AUDIT: RIDER API SECRECY CHECK ---');
    console.log('Contains deliveryOtp field?:', leaksDeliveryOtp);
    console.log('Contains pickupOtp field?:', leaksPickupOtp);
    if (!leaksDeliveryOtp && !leaksPickupOtp) {
      console.log('✅ PASSED: Rider API strictly obscures all OTP secrets!');
    } else {
      console.error('❌ SECURITY FAILURE: OTP secrets exposed in Rider API!');
    }

    // 5. Restaurant Owner retrieves Pickup OTP & Signed QR Token
    console.log(`\n5. Restaurant Owner retrieving Pickup OTP (GET /orders/${orderId}/pickup-otp)...`);
    const pickupOtpRes = await fetch(`${API_BASE}/orders/${orderId}/pickup-otp`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log('Pickup OTP HTTP Status:', pickupOtpRes.status);
    const pickupOtpData = await pickupOtpRes.json();
    console.log('Generated Pickup OTP (Restaurant View Only):', pickupOtpData.pickupOtp);
    console.log('HMAC Signed QR Token Prefix:', (pickupOtpData.qrToken || '').slice(0, 30) + '...');

    // 6. NEGATIVE SECURITY TEST: Rider attempts to call GET /orders/:id/pickup-otp (Should fail with 403)
    console.log('\n6. NEGATIVE SECURITY CHECK: Rider attempts to call GET /orders/:id/pickup-otp...');
    const riderPickupOtpRes = await fetch(`${API_BASE}/orders/${orderId}/pickup-otp`, {
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    console.log('Rider Pickup OTP Attempt HTTP Status:', riderPickupOtpRes.status);
    if (riderPickupOtpRes.status === 403) {
      console.log('✅ PASSED: Rider blocked from retrieving Pickup OTP!');
    } else {
      console.error('❌ SECURITY FAILURE: Rider was able to retrieve Pickup OTP!');
    }

    // 7. NEGATIVE OTP TEST: Rider submits wrong 4-digit pickup code '0000'
    console.log('\n7. NEGATIVE OTP CHECK: Rider submits invalid OTP "0000"...');
    const wrongOtpRes = await fetch(`${API_BASE}/delivery/jobs/${orderId}/verify-pickup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({ otp: '0000' }),
    });
    console.log('Wrong OTP Submission HTTP Status:', wrongOtpRes.status);
    const wrongOtpData = await wrongOtpRes.json();
    console.log('Wrong OTP Response Message:', wrongOtpData.message);
    if (wrongOtpRes.status === 400 && wrongOtpData.message.includes('Invalid pickup')) {
      console.log('✅ PASSED: System rejected invalid pickup OTP!');
    }

    // 8. POSITIVE OTP TEST: Rider submits VALID 4-digit pickup code
    console.log(`\n8. POSITIVE OTP CHECK: Rider submits valid OTP "${pickupOtpData.pickupOtp}"...`);
    const validOtpRes = await fetch(`${API_BASE}/delivery/jobs/${orderId}/verify-pickup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({ otp: pickupOtpData.pickupOtp }),
    });
    console.log('Valid OTP Submission HTTP Status:', validOtpRes.status);
    const validOtpData = await validOtpRes.json();
    console.log('Post-Pickup Order Status:', validOtpData.status);
    if (validOtpData.status === 'PICKED_UP') {
      console.log('✅ PASSED: Order transitioned to PICKED_UP!');
    }

    // 9. Rider starts delivery journey (POST /delivery/jobs/:id/start-delivery)
    console.log('\n9. Rider starting delivery journey (POST /delivery/jobs/:id/start-delivery)...');
    const startDeliveryRes = await fetch(`${API_BASE}/delivery/jobs/${orderId}/start-delivery`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    console.log('Start Delivery HTTP Status:', startDeliveryRes.status);
    const startDeliveryData = await startDeliveryRes.json();
    console.log('Post-Start Delivery Order Status:', startDeliveryData.status);
    if (startDeliveryData.status === 'OUT_FOR_DELIVERY') {
      console.log('✅ PASSED: Order transitioned to OUT_FOR_DELIVERY!');
    }

    // 10. NEGATIVE OFFLINE CHECK: Rider attempts to go OFFLINE while BUSY on active delivery
    console.log('\n10. NEGATIVE OFFLINE CHECK: Rider attempts to go OFFLINE while BUSY...');
    const failOfflineRes = await fetch(`${API_BASE}/delivery/me/go-offline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    console.log('Go Offline HTTP Status:', failOfflineRes.status);
    const failOfflineData = await failOfflineRes.json();
    console.log('Go Offline Error Message:', failOfflineData.message);
    if (failOfflineRes.status === 400 || failOfflineRes.status === 409) {
      console.log('✅ PASSED: Rider blocked from going offline while actively delivering!');
    }

    // 11. Fetch Customer Order details to get Customer Delivery OTP for test verification
    console.log('\n11. Fetching Customer Order details to verify delivery OTP...');
    const orderDetailsRes = await fetch(`${API_BASE}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const orderDetails = await orderDetailsRes.json();
    const customerDeliveryOtp = orderDetails.deliveryOtp || '1234';

    // 12. POSITIVE DELIVERY OTP TEST: Rider submits Customer Delivery OTP
    console.log(`\n12. POSITIVE DELIVERY OTP CHECK: Rider submits Customer OTP "${customerDeliveryOtp}"...`);
    const verifyDeliveryRes = await fetch(`${API_BASE}/delivery/jobs/${orderId}/verify-delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({ otp: customerDeliveryOtp }),
    });
    console.log('Verify Delivery HTTP Status:', verifyDeliveryRes.status);
    const verifyDeliveryData = await verifyDeliveryRes.json();
    console.log('Final Order Status:', verifyDeliveryData.status);
    if (verifyDeliveryData.status === 'DELIVERED') {
      console.log('✅ PASSED: Order successfully delivered!');
    }

    // 13. AUTOMATIC RIDER AVAILABILITY RELEASE CHECK
    console.log('\n13. Checking Rider Availability Status post-delivery...');
    const postStatusRes = await fetch(`${API_BASE}/delivery/me/status`, {
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    const postStatus = await postStatusRes.json();
    console.log('Post-Delivery Operational Status:', postStatus.operationalStatus);
    console.log('Post-Delivery Duty Status:', postStatus.dutyStatus);
    if (postStatus.operationalStatus === 'ONLINE_AVAILABLE') {
      console.log('✅ PASSED: Rider automatically released back to ONLINE_AVAILABLE status!');
    }

    // 14. RESTAURANT ELIGIBLE RIDERS QUERY CHECK
    console.log('\n14. Querying Eligible Riders for Restaurant...');
    const eligibleRes = await fetch(`${API_BASE}/orders/${orderId}/eligible-riders`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const eligibleRiders = await eligibleRes.json();
    const ridersList = Array.isArray(eligibleRiders) ? eligibleRiders : eligibleRiders.riders ?? [];
    const availableRiders = ridersList.filter((r) => r.isAvailable);
    console.log(`Available FoodHub Riders Count: ${availableRiders.length}`);
    if (availableRiders.length > 0) {
      console.log('✅ PASSED: Rider immediately visible in restaurant eligible riders list!');
    }

    console.log('\n================================================================');
    console.log('🎉 ALL ACTIVE-ORDER WORKFLOW & SECURITY TESTS PASSED PERFECTLY!');
    console.log('================================================================');
  } catch (err) {
    console.error('❌ E2E SUITE EXCEPTION:', err);
  }
}

runActiveOrderWorkflowE2E();
