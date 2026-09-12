import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Rely on IAM Role attached to EC2 instance if keys are not provided
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'zaykafood-media-prod';

async function main() {
  console.log('🔍 Starting Safe Base64 -> S3 Migration Audit...');

  // 1. Identify all Base64 images stored in PostgreSQL
  const mediaSettings = await prisma.systemSetting.findMany({
    where: {
      key: {
        startsWith: 'media_file_',
      },
    },
  });

  console.log(`Found ${mediaSettings.length} media files in PostgreSQL SystemSetting table.`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const setting of mediaSettings) {
    try {
      const parsed = JSON.parse(setting.value);

      // If it's already uploaded and we verified it, we can skip it.
      // But this script is safe: it doesn't delete the base64!
      if (parsed.s3Url) {
        console.log(`⏭️  Skipping ${setting.key}: Already has s3Url (${parsed.s3Url})`);
        skipCount++;
        continue;
      }

      if (!parsed.base64) {
        console.log(`⚠️  Skipping ${setting.key}: No base64 data found in JSON`);
        skipCount++;
        continue;
      }

      const filename = setting.key.replace('media_file_', '');
      const buffer = Buffer.from(parsed.base64, 'base64');
      const mimeType = parsed.mimeType || 'image/jpeg';

      console.log(`⬆️  Uploading ${filename} to S3 bucket ${BUCKET_NAME}...`);

      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: `uploads/${filename}`,
          Body: buffer,
          ContentType: mimeType,
        }),
      );

      const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/uploads/${filename}`;

      // Update the database but DO NOT DELETE the base64 string yet!
      parsed.s3Url = s3Url;

      await prisma.systemSetting.update({
        where: { id: setting.id },
        data: {
          value: JSON.stringify(parsed), // Preserves base64 string while adding s3Url
        },
      });

      console.log(`✅ Success: ${filename} uploaded. (Base64 string PRESERVED for safety)`);
      successCount++;
    } catch (error: any) {
      console.error(`❌ Failed to process ${setting.key}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n======================================');
  console.log('MIGRATION SUMMARY');
  console.log(`Total Found: ${mediaSettings.length}`);
  console.log(`Uploaded & Tagged: ${successCount}`);
  console.log(`Skipped: ${skipCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('======================================');
  console.log('NOTICE: The original base64 strings have NOT been deleted.');
  console.log(
    'Once you have verified the S3 URLs in the application, you can run a cleanup script to delete the base64 keys from the JSON objects to reclaim database space.',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
