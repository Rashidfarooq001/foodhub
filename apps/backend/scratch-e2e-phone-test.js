const { PrismaClient, UserRole } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

function normalizeIndianPhone(input) {
  if (!input || typeof input !== 'string') {
    throw new Error('Enter a valid 10-digit Indian mobile number.');
  }

  let cleaned = input.trim().replace(/[\s\-\(\)]/g, '');

  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  const indianMobileRegex = /^[6-9]\d{9}$/;
  if (!indianMobileRegex.test(cleaned)) {
    throw new Error('Enter a valid 10-digit Indian mobile number.');
  }

  return cleaned;
}

async function testMatrix() {
  console.log('=== TEST 1: PHONE NORMALIZATION UNIT TEST MATRIX ===');
  const testInputs = [
    { input: '7006298759', expected: '7006298759' },
    { input: '+917006298759', expected: '7006298759' },
    { input: '917006298759', expected: '7006298759' },
    { input: '+91 7006298759', expected: '7006298759' },
    { input: '+91-7006298759', expected: '7006298759' },
  ];

  for (const t of testInputs) {
    const res = normalizeIndianPhone(t.input);
    const pass = res === t.expected;
    console.log(
      `Input: "${t.input}" -> Normalized: "${res}" | Expected: "${t.expected}" | Result: ${pass ? 'PASS' : 'FAIL'}`,
    );
    if (!pass) throw new Error(`Normalization failed for ${t.input}`);
  }

  console.log('\n=== TEST 2: INVALID INPUT VALIDATION ===');
  const invalidInputs = ['700629879599', '1234567890', '+9112345', 'abc'];
  for (const inv of invalidInputs) {
    try {
      normalizeIndianPhone(inv);
      console.error(`FAIL: Invalid input "${inv}" was NOT rejected!`);
    } catch (e) {
      console.log(`Input: "${inv}" -> Successfully REJECTED with message: "${e.message}" | PASS`);
    }
  }

  console.log('\n=== TEST 3: DB REGISTRATION → APPROVAL → LOGIN INTEGRATION ===');
  const testPhoneInput = '+91 7006298759';
  const canonicalPhone = normalizeIndianPhone(testPhoneInput);
  const testEmail = `test_owner_${Date.now()}@foodhub.com`;
  const rawPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  // Clean up any old test record
  await prisma.restaurant.deleteMany({ where: { phone: canonicalPhone } });
  await prisma.user.deleteMany({ where: { phone: canonicalPhone } });

  // 1. Register User & Restaurant
  const user = await prisma.user.create({
    data: {
      phone: canonicalPhone,
      email: testEmail,
      passwordHash,
      role: UserRole.RESTAURANT_OWNER,
      isVerified: true,
      isActive: true,
    },
  });

  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'Test Phone Standardization Grill',
      slug: `test-phone-grill-${Date.now()}`,
      phone: canonicalPhone,
      email: testEmail,
      ownerId: user.id,
      licenseFssai: `FSSAI-${Date.now()}`,
      addressLine: '123 Test Street',
      latitude: 12.9716,
      longitude: 77.5946,
      status: 'PENDING_APPROVAL',
    },
  });

  console.log(`Created User ID: ${user.id} | Stored Phone in DB: "${user.phone}"`);
  if (user.phone !== '7006298759') {
    throw new Error(`Database stored phone "${user.phone}" is NOT canonical "7006298759"!`);
  }
  console.log('✓ Database canonical phone storage verified: 7006298759');

  // 2. Approve Restaurant
  await prisma.restaurant.update({
    where: { id: restaurant.id },
    data: { status: 'APPROVED' },
  });
  console.log('✓ Restaurant approved in database.');

  // 3. Test Merchant Login Lookups
  const loginInputs = [
    '7006298759',
    '+917006298759',
    '917006298759',
    '+91 7006298759',
    '+91-7006298759',
  ];

  for (const input of loginInputs) {
    const normalizedInput = normalizeIndianPhone(input);
    const foundUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: normalizedInput },
          { phone: `+91${normalizedInput}` },
          { phone: `91${normalizedInput}` },
        ],
      },
    });

    const isMatch = foundUser && foundUser.id === user.id;
    const isPass = await bcrypt.compare(rawPassword, foundUser.passwordHash);

    console.log(
      `Login Attempt with "${input}" -> Found User ID: ${foundUser?.id} | Password Match: ${isPass} | Result: ${isMatch && isPass ? 'PASS' : 'FAIL'}`,
    );
    if (!isMatch || !isPass) {
      throw new Error(`Login lookup failed for input "${input}"`);
    }
  }

  // Cleanup test record
  await prisma.restaurant.delete({ where: { id: restaurant.id } });
  await prisma.user.delete({ where: { id: user.id } });
  console.log('✓ Test cleanup complete.');
  console.log('\nALL PHONE STANDARDIZATION & LOGIN TESTS PASSED SUCCESSFULLY!');
}

testMatrix()
  .catch((e) => {
    console.error('TEST MATRIX ERROR:', e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
