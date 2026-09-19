const fs = require('fs');
['setup-server.sh', 'setup-server-final.sh'].forEach(f => {
  if (!fs.existsSync(f)) return;
  let sh = fs.readFileSync(f, 'utf8');
  const replacement = `
# Fail-Fast Migration Verification
echo "Verifying migrations against production database..."
export PRISMA_HIDE_UPDATE_MESSAGE=true

cd apps/backend
if ! npx prisma migrate deploy; then
  echo "CRITICAL ERROR: prisma migrate deploy failed."
  exit 1
fi

if ! npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code; then
  echo "CRITICAL ERROR: Schema drift detected after migrations! Deployment stopped."
  exit 1
fi
cd ../..

# Generate Prisma Client
pnpm --filter backend exec prisma generate

build_backend
cd apps/backend
pm2 delete zayka-backend || true
pm2 start dist/src/main.js --name "zayka-backend" --max-memory-restart 500M
pm2 save
`;
  sh = sh.replace(/# Generate Prisma Client[\S\s]*pm2 save/, replacement.trim());
  fs.writeFileSync(f, sh);
});