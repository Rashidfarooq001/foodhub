/**
 * Production Environment Variables Startup Validation Script
 */

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'REDIS_HOST',
  'REDIS_PORT',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
] as const;

const OPTIONAL_ENV_VARS = [
  'PORT',
  'NODE_ENV',
  'MSG91_AUTH_KEY',
  'CLOUDFLARE_R2_ACCESS_KEY',
  'ALLOWED_ORIGINS',
] as const;

export function validateEnvironment(): void {
  console.log('🔍 Validating Production Environment Variables...');

  const missing: string[] = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error('❌ CRITICAL ERROR: The following required environment variables are missing:');
    missing.forEach((varName) => console.error(`   - ${varName}`));
    console.error('\nStartup aborted. Please populate required secrets before running production containers.\n');
    process.exit(1);
  }

  console.log('✅ Required environment variables verified:');
  REQUIRED_ENV_VARS.forEach((varName) => {
    console.log(`   [✓] ${varName}`);
  });

  console.log('\nℹ️ Optional environment status:');
  OPTIONAL_ENV_VARS.forEach((varName) => {
    console.log(`   [${process.env[varName] ? '✓' : 'x'}] ${varName}`);
  });

  console.log('\n🎉 Production environment validation successful!\n');
}

if (require.main === module) {
  validateEnvironment();
}
