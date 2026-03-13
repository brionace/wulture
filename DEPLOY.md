# Wulture — Plesk Deployment Guide

## What was fixed for production

| Problem | Fix |
|---|---|
| `express` and `cors` only in `server/package.json`, missing from root | Added to root `dependencies` |
| `app.js` used fire-and-forget `import(...)` | Uses `await import(...)` for proper startup |
| Prisma client used fragile `__dirname` hack for DB path | Now reads `DATABASE_URL` env var |
| CORS hardcoded to `localhost` only | Accepts `ALLOWED_ORIGINS` env var for production domains |
| Server didn't load `.env` | Added `import "dotenv/config"` |
| Scripts cluttered with duplicates | Cleaned to 7 essential scripts |

---

## Step-by-step Plesk Deployment

### 1. Push your code to Git
```bash
git add -A
git commit -m "production deployment setup"
git push
```

### 2. On Plesk: Create domain and clone
- Add a domain or subdomain (e.g. `wulture.yourdomain.com`)
- Go to **Websites & Domains > your domain > Git**
- Clone from: `https://github.com/brionace/wulture.git`
- Target: the domain's `httpdocs` folder

### 3. SSH in and install
```bash
cd /var/www/vhosts/yourdomain.com/httpdocs
npm install                        # installs root deps + runs prisma generate
cd client && npm install && cd ..  # installs vite, react, tailwind, d3
```

### 4. Create `.env`
```bash
cat > .env << 'EOF'
DATABASE_URL="file:./dev.db"
PORT=3001
ALLOWED_ORIGINS=https://wulture.yourdomain.com
EOF
```

### 5. Set up the database
```bash
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

### 6. Build the client
```bash
npm run build
# creates client/dist/
```

### 7. Test
```bash
node app.js
# Should print: Server running on http://localhost:3001
```

### 8. Configure Plesk Node.js
Go to **Websites & Domains > Node.js** and set:

| Setting | Value |
|---|---|
| Node.js version | 20+ (ideally 22+) |
| Application root | `/var/www/vhosts/yourdomain.com/httpdocs` |
| Application startup file | `app.js` |
| Application mode | production |

Click **Enable Node.js** then **Restart**.

### 9. Verify
```
https://wulture.yourdomain.com         → world map
https://wulture.yourdomain.com/health  → {"status":"ok"}
```

---

## Alternative: pm2 + nginx reverse proxy
Use this if Plesk's Node.js extension gives trouble.

```bash
npm install -g pm2
pm2 start app.js --name wulture
pm2 save
pm2 startup   # run the printed command to survive reboots
```

In Plesk: **Websites & Domains > Apache & nginx Settings > Additional nginx directives**:
```nginx
location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

---

## If Node on Plesk is older than v22
Replace `app.js` with:
```js
import { register } from "node:module";
register("tsx/esm", import.meta.url);
await import("./server/src/index.ts");
```

---

## Re-deploying after code changes
```bash
git pull
npm install                    # only if deps changed
npm run build                  # only if frontend changed
npx prisma migrate deploy      # only if schema changed
pm2 restart wulture            # or Plesk Node.js > Restart
```