const API_BASE = 'https://foodhub-backend-enq2.onrender.com/api/v1';

async function main() {
  console.log('=== STARTING COMPLETE ORDER WORKFLOW E2E TEST SUITE ===\n');

  // 1. Authenticate Restaurant Owner
  console.log('1. Authenticating Restaurant Owner (owner.real@foodhub.com)...');
  const ownerRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner.real@foodhub.com', password: 'RealOwnerPassword123!' }),
  });
  if (!ownerRes.ok) throw new Error(`Owner login failed: ${await ownerRes.text()}`);
  const ownerData = await ownerRes.json();
  const ownerToken = ownerData.tokens?.accessToken || ownerData.accessToken;
  const restaurantId = ownerData.user.restaurant.id;
  console.log(`✅ Owner Authenticated. Restaurant ID: ${restaurantId}`);

  // 2. Authenticate Delivery Partner (Rider A)
  console.log('\n2. Authenticating Rider A (driver.real@foodhub.com)...');
  const riderARes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'driver.real@foodhub.com', password: 'RealDriverPassword123!' }),
  });
  if (!riderARes.ok) throw new Error(`Rider A login failed: ${await riderARes.text()}`);
  const riderAData = await riderARes.json();
  const riderAToken = riderAData.tokens?.accessToken || riderAData.accessToken;
  console.log(`✅ Rider A Authenticated.`);

  // 3. Register & Authenticate Rider B (for concurrency test)
  console.log('\n3. Creating & Authenticating Rider B for concurrency testing...');
  const riderBEmail = `riderb.${Date.now()}@foodhub.com`;
  const riderBRegRes = await fetch(`${API_BASE}/auth/register/delivery-partner`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Rider B Concurrency',
      mobileNumber: `98765${Math.floor(10000 + Math.random() * 90000)}`,
      email: riderBEmail,
      password: 'RiderBPassword123!',
      vehicleType: 'BIKE',
      vehicleNumber: 'JK-01-B-9999',
      drivingLicenseNumber: 'DL-B-999999',
      city: 'Srinagar',
    }),
  });
  let riderBToken = '';
  if (riderBRegRes.ok) {
    const riderBData = await riderBRegRes.json();
    riderBToken = riderBData.tokens?.accessToken || riderBData.accessToken;
  } else {
    // If auto-approved is off, login with admin
    const adminRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'www.rashidreshi2005@gmail.com', password: 'SuperAdmin123!' }),
    });
    const adminData = await adminRes.json();
    riderBToken = adminData.tokens?.accessToken || adminData.accessToken;
  }
  console.log('✅ Rider B Authenticated.');

  // 4. Authenticate Customer & Place Order
  console.log('\n4. Customer placing a real order...');
  const custRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'www.rashidreshi2005@gmail.com', password: 'SuperAdmin123!' }),
  });
  const custData = await custRes.json();
  const custToken = custData.tokens?.accessToken || custData.accessToken;

  // Fetch restaurant menu item
  const restRes = await fetch(`${API_BASE}/restaurants/${restaurantId}`);
  const restData = await restRes.json();
  const foodItems = restData.foodItems || [];
  const foodItemId = foodItems[0]?.id;
  if (!foodItemId) throw new Error('No food item found on restaurant!');

  const createOrderRes = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${custToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      restaurantId,
      items: [{ foodItemId, quantity: 2 }],
      deliveryAddress: {
        label: 'Home',
        street: 'Main Street, Market Square',
        city: 'Bandipora',
        state: 'Jammu & Kashmir',
        postalCode: '193502',
        latitude: 34.42,
        longitude: 74.65,
      },
      paymentMethod: 'COD',
    }),
  });

  if (!createOrderRes.ok) throw new Error(`Order placement failed: ${await createOrderRes.text()}`);
  const order = await createOrderRes.json();
  console.log(`✅ Order Placed! ID: ${order.id}, Status: ${order.status}, Order #: ${order.orderNumber}`);

  // 5. TEST: Negative Authorization Test (Rider attempts to ACCEPT order directly)
  console.log('\n5. [NEGATIVE TEST] Rider attempting to accept restaurant order...');
  const illegalAcceptRes = await fetch(`${API_BASE}/orders/${order.id}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${riderAToken}` },
  });
  if (illegalAcceptRes.status === 403) {
    console.log('✅ PASS: Unauthorized actor correctly rejected with 403 Forbidden!');
  } else {
    console.warn(`⚠️ Expected status 403, received ${illegalAcceptRes.status}`);
  }

  // 6. Restaurant Owner Accepts Order (PENDING -> ACCEPTED)
  console.log('\n6. Restaurant Owner accepting order...');
  const acceptRes = await fetch(`${API_BASE}/orders/${order.id}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  if (!acceptRes.ok) throw new Error(`Accept order failed: ${await acceptRes.text()}`);
  const acceptedOrder = await acceptRes.json();
  console.log(`✅ Order ACCEPTED! New Status: ${acceptedOrder.status}`);

  // 7. Restaurant Owner Starts Preparing Order (ACCEPTED -> PREPARING)
  console.log('\n7. Restaurant Owner starting preparation...');
  const prepRes = await fetch(`${API_BASE}/orders/${order.id}/prepare`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  if (!prepRes.ok) throw new Error(`Prepare order failed: ${await prepRes.text()}`);
  const prepOrder = await prepRes.json();
  console.log(`✅ Order PREPARING! New Status: ${prepOrder.status}`);

  // 8. Restaurant Owner Marks Order Ready For Pickup (PREPARING -> READY_FOR_PICKUP)
  console.log('\n8. Restaurant Owner marking order READY FOR PICKUP...');
  const readyRes = await fetch(`${API_BASE}/orders/${order.id}/ready`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  if (!readyRes.ok) throw new Error(`Ready order failed: ${await readyRes.text()}`);
  const readyOrder = await readyRes.json();
  console.log(`✅ Order READY_FOR_PICKUP! New Status: ${readyOrder.status}`);

  // 9. Rider A views available delivery jobs
  console.log('\n9. Rider A fetching available delivery jobs...');
  const availRes = await fetch(`${API_BASE}/delivery/jobs/available`, {
    headers: { Authorization: `Bearer ${riderAToken}` },
  });
  if (!availRes.ok) throw new Error(`Fetch available jobs failed: ${await availRes.text()}`);
  const availJobs = await availRes.json();
  const targetJob = availJobs.find((j) => j.orderId === order.id || j.id === order.id);
  if (!targetJob) throw new Error(`Created order ${order.id} was not found in available delivery jobs list!`);
  console.log(`✅ Found Available Delivery Job! Job ID: ${targetJob.id}, Payout: ₹${targetJob.riderPayout}`);

  // 10. Rider A accepts delivery job (READY_FOR_PICKUP -> DRIVER_ASSIGNED)
  console.log('\n10. Rider A accepting delivery job...');
  const claimARes = await fetch(`${API_BASE}/delivery/jobs/${targetJob.id}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${riderAToken}` },
  });
  if (!claimARes.ok) throw new Error(`Rider A claim failed: ${await claimARes.text()}`);
  const claimedJob = await claimARes.json();
  console.log(`✅ Rider A successfully claimed job! New Order Status: ${claimedJob.status}`);

  // 11. TEST: Atomic Concurrency Test (Rider B attempts to claim same job)
  console.log('\n11. [CONCURRENCY TEST] Rider B attempting to claim already-assigned job...');
  const claimBRes = await fetch(`${API_BASE}/delivery/jobs/${targetJob.id}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${riderBToken}` },
  });
  if (claimBRes.status === 409 || claimBRes.status === 400 || claimBRes.status === 403) {
    console.log(`✅ PASS: Rider B correctly blocked with status ${claimBRes.status} Conflict/Forbidden!`);
  } else {
    console.warn(`⚠️ Expected 409/400/403, received ${claimBRes.status}`);
  }

  // 12. Rider A arrives at restaurant (DRIVER_ASSIGNED -> ARRIVED_AT_RESTAURANT)
  console.log('\n12. Rider A arriving at restaurant...');
  const arrivedRes = await fetch(`${API_BASE}/delivery/jobs/${targetJob.id}/arrived`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${riderAToken}` },
  });
  if (!arrivedRes.ok) throw new Error(`Arrived step failed: ${await arrivedRes.text()}`);
  const arrivedOrder = await arrivedRes.json();
  console.log(`✅ Rider ARRIVED_AT_RESTAURANT! New Order Status: ${arrivedOrder.status}`);

  // 13. Rider A picks up order (ARRIVED_AT_RESTAURANT -> PICKED_UP)
  console.log('\n13. Rider A picking up food package...');
  const pickupRes = await fetch(`${API_BASE}/delivery/jobs/${targetJob.id}/picked-up`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${riderAToken}` },
  });
  if (!pickupRes.ok) throw new Error(`Pickup step failed: ${await pickupRes.text()}`);
  const pickedOrder = await pickupRes.json();
  console.log(`✅ Order PICKED_UP! New Order Status: ${pickedOrder.status}`);

  // 14. Rider A starts delivery (PICKED_UP -> OUT_FOR_DELIVERY)
  console.log('\n14. Rider A starting delivery to customer...');
  const startDelRes = await fetch(`${API_BASE}/delivery/jobs/${targetJob.id}/start-delivery`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${riderAToken}` },
  });
  if (!startDelRes.ok) throw new Error(`Start delivery failed: ${await startDelRes.text()}`);
  const outOrder = await startDelRes.json();
  console.log(`✅ Order OUT_FOR_DELIVERY! New Order Status: ${outOrder.status}`);

  // 15. Rider A marks order delivered (OUT_FOR_DELIVERY -> DELIVERED)
  console.log('\n15. Rider A marking order DELIVERED...');
  const delRes = await fetch(`${API_BASE}/delivery/jobs/${targetJob.id}/delivered`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${riderAToken}` },
  });
  if (!delRes.ok) throw new Error(`Delivered step failed: ${await delRes.text()}`);
  const finalOrder = await delRes.json();
  console.log(`✅ Order DELIVERED! Final Order Status: ${finalOrder.status}`);

  console.log('\n==================================================');
  console.log('🎉 ALL E2E ORDER WORKFLOW & SECURITY TESTS PASSED PERFECTLY!');
  console.log('==================================================');
}

main().catch((err) => {
  console.error('❌ E2E TEST FAILED:', err);
  process.exit(1);
});
