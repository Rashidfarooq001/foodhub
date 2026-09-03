const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const key = 'media_file_file-1786422852791-308516608.png';
  const record = await prisma.systemSetting.findUnique({
    where: { key },
  });
  console.log('=== POSTGRESQL MEDIA BINARY BACKUP RECORD CHECK ===');
  console.log(`- Key: ${key}`);
  console.log(`- Exists in PostgreSQL DB? ${!!record}`);
  if (record) {
    console.log(`- Data length: ${record.value.length} chars`);
    const parsed = JSON.parse(record.value);
    console.log(`- MimeType: ${parsed.mimeType}, Base64 prefix: ${parsed.base64?.slice(0, 30)}...`);
  }
}

main().finally(() => prisma.$disconnect());
