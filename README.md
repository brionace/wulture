# Install
- cd /var/www/vhosts/yourdomain.com/wulture
- pnpm install
- cd client && pnpm install && cd ..
- cd server && pnpm install && cd ..
- pnpx prisma migrate deploy    # apply migrations (not dev!)
- pnpx prisma generate
- pnpx tsx prisma/seed.ts
- pnpm run build     