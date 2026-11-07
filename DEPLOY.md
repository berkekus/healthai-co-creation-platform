# Deploy Guide — HealthAI Co-creation Platform

Önerilen kurulum: **Frontend → Vercel**, **Backend → Railway**, **DB → MongoDB Atlas**.

---

## ⚠️ Önce Yapılacaklar (Bir Kez)

### 1. MongoDB Atlas şifresi ve JWT Secret'ı rotate edin
`backend/.env.atlas` dosyası geçmişte git'e commit edilmişti.  
Aşağıdaki adımları **hemen** uygulayın:

1. [MongoDB Atlas](https://cloud.mongodb.com) → Database Access → kullanıcıyı seçin → Edit → yeni şifre oluşturun.
2. `backend/.env.atlas` içindeki URI'daki şifreyi güncelleyin.
3. Yeni JWT secret üretin:
   ```bash
   openssl rand -hex 64
   ```
4. `.env.atlas` içindeki `JWT_SECRET` değerini güncelleyin.

---

## 1. MongoDB Atlas (Zaten Var)

`backend/.env.atlas` dosyasında Atlas URI mevcut. Bunu Railway'e ortam değişkeni olarak ekleyin.

Atlas URI formatı:
```
mongodb+srv://<user>:<password>@<cluster>.mongodb.net/healthai?retryWrites=true&w=majority
```

---

## 2. Backend → Railway

### 2.1 Yeni proje oluşturun
1. [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Repo: `healthai-co-creation-platform`, Root Directory: `backend`
3. Railway `backend/railway.json` ve `backend/Dockerfile` dosyalarını otomatik algılar.

### 2.2 Ortam değişkenleri (Railway Variables sekmesi)
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/healthai?retryWrites=true&w=majority
JWT_SECRET=<64-char-hex-from-openssl>
JWT_EXPIRES_IN=7d
PORT=5000
CLIENT_ORIGIN=https://www.healthcocreate.com
APP_BASE_URL=https://www.healthcocreate.com
TURNSTILE_SECRET_KEY=<cloudflare-turnstile-secret>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your.email@gmail.com
SMTP_PASS=<16-char-gmail-app-password>
SMTP_FROM="HEALTH AI" <noreply@your-domain.com>
GEMINI_API_KEY=<google-ai-studio-key>
GITHUB_CLIENT_ID=<optional>
GITHUB_CLIENT_SECRET=<optional>
LINKEDIN_CLIENT_ID=<optional>
LINKEDIN_CLIENT_SECRET=<optional>
```

> **Not:** `CLIENT_ORIGIN` ve `APP_BASE_URL` her zaman canlı alan adına ayarlanmalıdır: `https://www.healthcocreate.com`. Vercel adresi yalnızca teknik barındırma adresidir; e-posta bağlantılarında kullanılmaz.

### 2.3 Domain
Railway otomatik bir subdomain verir: `https://your-service.up.railway.app`  
Bunu `VITE_API_URL` için kullanacaksınız: `https://your-service.up.railway.app/api`

### 2.4 Sağlık kontrolü
Deploy sonrası: `https://your-service.up.railway.app/api/health`  
`{ "status": "ok", "db": "connected" }` dönmeli.

---

## 3. Frontend → Vercel

### 3.1 Import
1. [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Repo: `healthai-co-creation-platform`, Root Directory: `frontend`
3. Framework: **Vite** (otomatik algılanır)

### 3.2 Ortam değişkenleri (Vercel Environment Variables)
```env
VITE_API_URL=https://your-service.up.railway.app/api
VITE_TURNSTILE_SITE_KEY=<cloudflare-turnstile-site-key>
VITE_GEMINI_API_KEY=<google-ai-studio-key>
```

### 3.3 Build ayarları
Vercel otomatik algılar ama manuel girilmesi gerekirse:
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### 3.4 Deploy
`vercel.json` zaten mevcut (SPA rewrites). Deploy otomatik başlar.

---

## 4. Demo Verisi — Production'a YÜKLEMEYİN

Seed betikleri (`seed-realistic-posts.ts`, `seed-realistic-meetings.ts`, `seed-demo-messages.ts`)
yalnızca yerel geliştirme içindir. Oluşturdukları 14 demo hesabın şifresi bu herkese açık
repoda yazılı ve profiller gerçek kurumların alan adlarını kullanıyor: production'da olurlarsa
herkes bu hesaplarla giriş yapabilir ve gerçek kullanıcılar sahte profiller görür.

Production veritabanında demo hesap olup olmadığını kontrol edin ve varsa silin:
```bash
cd backend
MONGO_URI=mongodb+srv://... npm run remove:demo-accounts             # yalnızca listeler
MONGO_URI=mongodb+srv://... npm run remove:demo-accounts -- --apply  # siler (ilan, toplantı ve mesajlarıyla)
```
Betik, şifresi demo şifresi olan bütün hesapları bulur; admin hesaplarını silmez, yalnızca listeler.

---

## 5. Self-hosted (VPS / Docker Compose)

`docker-compose.prod.yml` ile tüm stack tek makinada:

```bash
# .env.prod dosyası oluşturun
cp backend/.env.example .env.prod
# değerleri doldurun...

# Build ve başlat
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

Gerekli env vars: `MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, `APP_BASE_URL`, `TURNSTILE_SECRET_KEY`

---

## 6. Kontrol Listesi (Checklist)

- [ ] MongoDB Atlas şifresi rotate edildi
- [ ] Yeni JWT_SECRET üretildi (64+ char)
- [ ] Railway backend deploy edildi ve `/api/health` OK dönüyor
- [ ] Vercel frontend deploy edildi
- [ ] Railway → `CLIENT_ORIGIN` ve `APP_BASE_URL` `https://www.healthcocreate.com` ile güncellendi
- [ ] Vercel → `VITE_API_URL` Railway URL'i ile güncellendi
- [ ] Cloudflare Turnstile site key + secret key ayarlandı
- [ ] SMTP (email) test edildi (kayıt → doğrulama maili geliyor)
- [ ] `npm run remove:demo-accounts` production'da 0 hesap gösteriyor (demo hesaplar silindi)
- [ ] Render → `NODE_ENV=production` (istek limitleri ve e-posta alan adı kontrolü buna bağlı); `RATE_LIMIT_ENABLED` tanımlı değil veya `true`
- [ ] Render otomatik deploy açık; deploy sonrası `/api/health` yanıtındaki `version` son commit'i gösteriyor
- [ ] GitHub OAuth (opsiyonel) callback URL güncellendi: `https://railway-url/api/auth/github/callback`
