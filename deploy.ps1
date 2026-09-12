cd apps/backend
tar.exe -caf backend.zip dist src package.json pnpm-lock.yaml prisma
scp -P 20065 backend.zip root@148.113.6.63:/root/foodhub/apps/backend/
ssh -p 20065 root@148.113.6.63 "cd /root/foodhub/apps/backend && unzip -o backend.zip && pnpm i && find ./src -type f -exec touch {} + && find ./dist -type f -exec touch {} + && pm2 restart zayka-backend"
