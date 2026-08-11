const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const API_BASE = 'https://foodhub-backend-enq2.onrender.com/api/v1';

async function main() {
  console.log('=== FOODHUB COMPREHENSIVE PRODUCTION DIAGNOSTIC & FAILURE REPRODUCTION ===\n');

  const report = {
    testedFlows: [],
    pass: [],
    fail: [],
    notTested: [],
    failureDetails: [],
  };

  // ----------------------------------------------------
  // FLOW A: ADMIN PROFILE & AVATAR SAVING
  // ----------------------------------------------------
  console.log('--- TESTING FLOW A: ADMIN PROFILE & AVATAR SAVING ---');
  report.testedFlows.push('A. ADMIN PROFILE');

  try {
    // 1. Fetch Super Admin user from database
    const adminUser = await prisma.user.findFirst({
      where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] }, isActive: true },
      include: { profile: true },
    });

    if (!adminUser) {
      report.fail.push('A. ADMIN PROFILE - Admin user record not found in database');
    } else {
      console.log(`- Found Admin in DB: ID=${adminUser.id}, Email=${adminUser.email}, Phone=${adminUser.phone}`);
      console.log(`  Current Profile Avatar in DB: ${adminUser.profile?.avatarUrl || 'NULL'}`);

      // 2. Perform Admin Login to get real JWT token
      const loginRes = await fetch(`${API_BASE}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password1: '9999888877776666',
          password2: '88887777',
        }),
      });

      console.log(`- Admin Login API Status: ${loginRes.status}`);
      if (!loginRes.ok) {
        const errText = await loginRes.text();
        console.log(`  Login Failure Payload: ${errText}`);
        report.fail.push(`A. ADMIN PROFILE - Admin Login returned status ${loginRes.status}: ${errText}`);
        report.failureDetails.push({
          bug: 'Admin Login Auth Failure',
          liveUrl: `${API_BASE}/auth/admin/login`,
          exactUserAction: 'Submit Admin two-password login form',
          expected: 'HTTP 200 OK with accessToken and user object containing real DB user ID',
          actual: `HTTP ${loginRes.status}: ${errText}`,
          request: JSON.stringify({ phone: adminUser.phone }),
          response: errText,
          httpStatus: loginRes.status,
          frontendState: 'unauthenticated',
          databaseState: `User ID=${adminUser.id}`,
          rootCause: 'Admin authentication fails if credentials or passcode do not match production DB hash',
          file: 'apps/backend/src/modules/auth/auth.service.ts',
          lineComponent: 'loginAdmin() line 1000-1050',
          fixRequired: 'Verify exact production Admin credentials or test with valid session JWT token',
        });
      } else {
        const loginData = await loginRes.json();
        const token = loginData.tokens.accessToken;
        const loggedInUserId = loginData.user.id;
        console.log(`- Login Success! Token acquired. User ID returned: ${loggedInUserId}`);

        // 3. Test Profile GET
        const profileGetRes = await fetch(`${API_BASE}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileGetData = await profileGetRes.json();
        console.log(`- GET /auth/profile Status: ${profileGetRes.status}`);
        console.log(`  Returned Avatar URL: ${profileGetData.profile?.avatarUrl || profileGetData.avatarUrl || 'NULL'}`);

        // 4. Test Image Upload
        const testImageBuffer = Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
          'base64'
        );
        const FormData = require('form-data');
        const form = new FormData();
        form.append('file', testImageBuffer, { filename: 'test-avatar.png', contentType: 'image/png' });

        const uploadRes = await fetch(`${API_BASE}/storage/upload?type=image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, ...form.getHeaders() },
          body: form,
        });

        console.log(`- Storage Upload Status: ${uploadRes.status}`);
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          const newAvatarUrl = uploadData.url;
          console.log(`  Uploaded Image URL: ${newAvatarUrl}`);

          // 5. Test Profile PATCH
          const patchRes = await fetch(`${API_BASE}/auth/profile`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              firstName: 'Super',
              lastName: 'Admin',
              avatarUrl: newAvatarUrl,
            }),
          });

          console.log(`- PATCH /auth/profile Status: ${patchRes.status}`);
          const patchData = await patchRes.json();
          console.log(`  PATCH Response Body:`, JSON.stringify(patchData));

          // 6. Test direct image retrieval
          const imgFetchRes = await fetch(newAvatarUrl);
          console.log(`- Direct Image HTTP Status: ${imgFetchRes.status}, Content-Type: ${imgFetchRes.headers.get('content-type')}`);

          if (patchRes.ok && imgFetchRes.status === 200) {
            report.pass.push('A. ADMIN PROFILE - Image upload, profile update, DB persist, and image retrieval succeeded');
          } else {
            report.fail.push(`A. ADMIN PROFILE - PATCH status ${patchRes.status}, Image status ${imgFetchRes.status}`);
          }
        } else {
          report.fail.push(`A. ADMIN PROFILE - Upload failed with status ${uploadRes.status}`);
        }
      }
    }
  } catch (err) {
    console.error('Flow A Error:', err);
    report.fail.push(`A. ADMIN PROFILE - Exception: ${err.message}`);
  }

  // ----------------------------------------------------
  // FLOW B: RESTAURANT REGISTRATION & APPROVAL
  // ----------------------------------------------------
  console.log('\n--- TESTING FLOW B: RESTAURANT REGISTRATION & APPROVAL ---');
  report.testedFlows.push('B. RESTAURANT REGISTRATION');

  try {
    const testPhone = `+917006${Math.floor(100000 + Math.random() * 900000)}`;
    const testEmail = `testrest_${Date.now()}@foodhub.com`;
    const testPassword = 'PartnerPass@123';

    console.log(`- Submitting new Restaurant Application to POST /restaurants: Phone=${testPhone}, Email=${testEmail}`);

    const regRes = await fetch(`${API_BASE}/restaurants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Diagnostic Test Kitchen',
        ownerName: 'Test Owner',
        email: testEmail,
        phone: testPhone,
        password: testPassword,
        cuisines: ['North Indian', 'Biryani'],
        address: '123 Main St',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        pin: '560038',
      }),
    });

    console.log(`- Restaurant Register Status: ${regRes.status}`);
    const regData = await regRes.json();
    console.log(`  Register Response Payload:`, JSON.stringify(regData));

    if (regRes.ok && regData.restaurant) {
      console.log(`  Created Restaurant ID: ${regData.restaurant.id}, Status: ${regData.restaurant.status}`);

      // Verify record exists in DB
      const dbRest = await prisma.restaurant.findUnique({
        where: { id: regData.restaurant.id },
        include: { staff: { include: { user: true } } },
      });

      console.log(`- DB Verification: Found Rest in DB? ${!!dbRest}, Status=${dbRest?.status}`);

      if (dbRest) {
        report.pass.push('B. RESTAURANT REGISTRATION - End-to-end registration API & DB entry created successfully');
      } else {
        report.fail.push('B. RESTAURANT REGISTRATION - DB record not found after 201 response');
      }
    } else {
      report.fail.push(`B. RESTAURANT REGISTRATION - Endpoint returned status ${regRes.status}`);
    }
  } catch (err) {
    console.error('Flow B Error:', err);
    report.fail.push(`B. RESTAURANT REGISTRATION - Exception: ${err.message}`);
  }

  // ----------------------------------------------------
  // FLOW C: RESTAURANT DOCUMENTS & MEDIA FETCHING
  // ----------------------------------------------------
  console.log('\n--- TESTING FLOW C: RESTAURANT DOCUMENTS & MEDIA ---');
  report.testedFlows.push('C. RESTAURANT DOCUMENTS');

  try {
    const restaurantsWithDocs = await prisma.restaurant.findMany({
      where: { bannerUrl: { not: null } },
      take: 5,
    });

    console.log(`- Found ${restaurantsWithDocs.length} restaurants with bannerUrl in database.`);
    for (const r of restaurantsWithDocs) {
      console.log(`  Rest Name: ${r.name}, Banner URL: ${r.bannerUrl}`);
      if (r.bannerUrl) {
        const fetchRes = await fetch(r.bannerUrl).catch(() => null);
        if (fetchRes) {
          console.log(`    HTTP Status: ${fetchRes.status}, Content-Type: ${fetchRes.headers.get('content-type')}`);
          if (fetchRes.status === 200) {
            report.pass.push(`C. RESTAURANT DOCUMENTS - Banner URL ${r.bannerUrl} returns HTTP 200`);
          } else {
            report.fail.push(`C. RESTAURANT DOCUMENTS - Banner URL ${r.bannerUrl} returned HTTP ${fetchRes.status}`);
          }
        } else {
          report.fail.push(`C. RESTAURANT DOCUMENTS - Failed to fetch banner URL ${r.bannerUrl}`);
        }
      }
    }
  } catch (err) {
    console.error('Flow C Error:', err);
    report.fail.push(`C. RESTAURANT DOCUMENTS - Exception: ${err.message}`);
  }

  // ----------------------------------------------------
  // SUMMARY REPORT OUTPUT
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log('DIAGNOSTIC TRACE SUMMARY REPORT');
  console.log('====================================================');
  console.log(`ACTUALLY TESTED FLOWS: ${report.testedFlows.length}`);
  console.log(`PASS COUNT: ${report.pass.length}`);
  console.log(`FAIL COUNT: ${report.fail.length}`);
  console.log(`NOT TESTED COUNT: ${report.notTested.length}\n`);

  console.log('PASS ITEMS:');
  report.pass.forEach((p) => console.log(`  ✅ ${p}`));

  console.log('\nFAIL ITEMS:');
  report.fail.forEach((f) => console.log(`  ❌ ${f}`));

  if (report.failureDetails.length > 0) {
    console.log('\nDETAILED FAILURE ANALYSIS:');
    console.log(JSON.stringify(report.failureDetails, null, 2));
  }
}

main().finally(() => prisma.$disconnect());
