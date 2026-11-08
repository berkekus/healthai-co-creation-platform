# Deploy Rehberi — HealthAI Co-creation Platform

Canlı yapı:

| Parça | Nerede | Adres |
|---|---|---|
| Frontend | Vercel | https://www.healthcocreate.com (apex → www yönlenir) |
| API | Render | https://healthai-co-creation-platform.onrender.com/api |
| Veritabanı | MongoDB Atlas | — |
| Mail | Resend (HTTPS API; Render dışarıya SMTP portunu kapatıyor) | — |
| AI | Google Gemini | — |

---

## Açılış öncesi kontrol listesi

Her madde bir panelde yapılacak iş; kodda karşılığı hazır.

### 1. Render (API)

- [ ] **Instance type: Starter** ($7/ay). Free plan 15 dk boşta kalınca uyuyor (ilk istek ~23 sn), CPU 0.1. Aşağıdaki yük testi sonuçlarına bakın; aynı anda yüzlerce kişi bekleniyorsa açılış haftası için **Standard** (1 CPU, $25/ay) düşünün, sonra geri düşürün.
- [ ] **Branch: `main`**, **Auto-Deploy: On**. 8 Kasım'da Vercel `main`'in son halini yayınlıyordu, Render ise 14 Eylül ile 15 Ekim arasındaki bir sürümde kalmıştı. Dashboard → **Events** sekmesinde son deploy'un "failed" olup olmadığına ve hangi branch'ten alındığına bakın.
- [ ] **Deploy sonrası kontrol:** `https://healthai-co-creation-platform.onrender.com/api/health` yanıtındaki `version`, merge commit'inin ilk 7 karakteri olmalı. `.../api/avatars/000000000000000000000000` adresi `"Route not found"` değil `"Photo not found"` dönmeli. Böyle değilse yeni backend yayında değildir, Render'da **Manual Deploy → Deploy latest commit** yapın.
- [ ] **Start Command:** Node runtime ise `npm start` olmalı (Docker runtime ise Dockerfile'daki `CMD` kullanılır, ayrıca bir şey gerekmez). `npm start` = `node --single-threaded-gc dist/src/index.js`. Bu bayrak olmadan 0.5 CPU'da 300 kişilik ani kayıt dalgası tamamen tıkanıyor (aşağıya bakın).
- [ ] **Build Command:** `npm ci --include=dev && npm run build` · **Root Directory:** `backend`. `--include=dev` şart: `NODE_ENV=production` tanımlıyken npm devDependencies'i atlıyor, `typescript` de onların içinde, ve build `tsc: not found` ile düşüyor.
- [ ] **Health Check Path:** `/api/health`
- [ ] **Environment** — şu değişkenler tanımlı olsun:

| Değişken | Değer |
|---|---|
| `NODE_ENV` | `production` (rate limit, captcha ve e-posta domain kontrolü bununla açılır) |
| `MONGO_URI` | Atlas bağlantı adresi |
| `JWT_SECRET` | 64+ karakter rastgele (`openssl rand -hex 64`) |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_ORIGIN` | `https://www.healthcocreate.com` |
| `CLIENT_ORIGIN_EXTRA` | `https://healthcocreate.com` (isteğe bağlı) |
| `APP_BASE_URL` | `https://www.healthcocreate.com` (maillerdeki linkler) |
| `SERVER_BASE_URL` | `https://healthai-co-creation-platform.onrender.com` (OAuth callback) |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile gerçek secret |
| `RESEND_API_KEY` | Resend API anahtarı |
| `SMTP_FROM` | `"HEALTH AI" <noreply@healthcocreate.com>` — Resend'de **doğrulanmış domain** olmalı, yoksa hiçbir mail gitmez |
| `GEMINI_API_KEY` | Google AI Studio anahtarı |
| `GEMINI_MODEL` | AI Studio'da çalıştığı doğrulanmış güncel model (bkz. `backend/.env.example`) |
| `RATE_LIMIT_ENABLED` | **Tanımlamayın.** Production'da limitler zaten açık; `false` yazarsanız kapanır |

- [ ] Deploy sonrası: `curl https://healthai-co-creation-platform.onrender.com/api/health` → `"version"` alanı son `main` commit'inin ilk 7 karakteri olmalı.

### 2. Resend (mail)

- [ ] **Pro plan** ($20/ay). Free plan günde 100 mail gönderiyor; 100'ü aşan kayıtlar doğrulama maili alamaz ve **hiç giriş yapamaz**.
- [ ] Domains → `healthcocreate.com` **Verified** (SPF + DKIM).
- [ ] Kendi adresinizle bir test kaydı yapın; mail gelene kadar açılışa geçmeyin.

### 3. Gemini (AI)

- [ ] Google AI Studio → projeye **billing** açın (kullandıkça öde, bu ölçekte birkaç dolar). Yeni Flash modellerinin ücretsiz kotası günde birkaç düzine isteğe kadar düşmüş olabilir; panelde projenin kotasını görün.
- [ ] Kota bitse de site çalışır: kod Gemini'den 429 alınca bir süre çağrı yapmayı bırakıyor ve kural tabanlı öneriler gösteriyor.

### 4. MongoDB Atlas

- [ ] **Yedek alın.** M0 (free) kümede otomatik yedek yok. Açılıştan önce: `mongodump --uri "<MONGO_URI>" --out backup-2026-11-09`
- [ ] Network Access, Render'ın bağlanmasına izin veriyor (şu an çalışıyorsa dokunmayın).

### 5. Vercel (frontend)

- [ ] `VITE_API_URL=https://healthai-co-creation-platform.onrender.com/api`
- [ ] `VITE_TURNSTILE_SITE_KEY` gerçek site key; Turnstile panelinde `www.healthcocreate.com` izinli domain.
- [ ] `main` merge olduktan sonra Production deploy'un yeni commit'te olduğunu görün.

### 6. Güvenlik

- [ ] **Demo hesapları silin.** Seed script'lerinin şifresi (`HealthAI2026!`) bu public repoda; o şifreyle açılan her hesaba herkes girebilir.
  ```bash
  cd backend
  MONGO_URI="<production uri>" npm run remove:demo-accounts             # önce listeler
  MONGO_URI="<production uri>" npm run remove:demo-accounts -- --apply  # sonra siler
  ```
  Admin hesapları silinmez, sadece listelenir: o hesaplarla giriş yapıp **Profil → Şifre değiştir** ile şifrelerini değiştirin.
- [ ] Atlas şifresi ve `JWT_SECRET` daha önce git geçmişine girdiyse (`backend/.env.atlas`) yenilenmiş olsun. `JWT_SECRET` değişince herkesin oturumu kapanır; açılıştan önce yapın, açılış günü değil.

### 7. Açılış günü

- [ ] UptimeRobot (ücretsiz) ile `/api/health`'i 5 dakikada bir izleyin; düşerse mail gelsin.
- [ ] Render → Metrics'te CPU'yu izleyin. Kalabalıkta kayıt/giriş 10-30 sn sürebilir; 30 sn'den uzun bekleyen istek "Sunucu şu anda çok yoğun" mesajıyla (503) döner, kullanıcı tekrar dener.
- [ ] Sorun olursa önce Render loglarına bakın: `Gemini quota exceeded`, `Resend API send failed`, `The server is busy` satırları en olası üç sebep.

---

## Kapasite: yük testi (8 Kasım 2026)

Yerel ölçüm: API Windows Job Object ile sabit CPU'ya sınırlandı, veritabanı yerel replica set. Her sanal kullanıcı kayıt oluyor, 3-10 sn sonra maildeki linke "tıklıyor", giriş yapıyor ve dashboard'u açıyor. Tüm istekler aynı IP'den (tek Wi-Fi'daki bir salon gibi). Atlas'ın ağ gecikmesi dahil değil.

| CPU | GC bayrağı | Senaryo | Giriş yapabilen | Kayıt p95 | Giriş p95 |
|---|---|---|---|---|---|
| 0.5 (Starter) | yok | 60 kişi / 5 sn | 60/60 | 1.9 sn | 2.6 sn |
| 0.5 (Starter) | yok | 300 kişi / 60 sn | 297/300 | 9.5 sn | 15 sn |
| 0.5 (Starter) | yok | 300 kişi / 10 sn | **0/300** (tıkandı) | — | — |
| 0.5 (Starter) | `--single-threaded-gc` | 60 kişi / 5 sn | 60/60 | 3.5 sn | 1.8 sn |
| 0.5 (Starter) | `--single-threaded-gc` | 300 kişi / 60 sn | 300/300 | 10.3 sn | 10.3 sn |
| 0.5 (Starter) | `--single-threaded-gc` | 300 kişi / 10 sn | 289/300 (11 kişi "yoğun" 503) | 28 sn | 30 sn |
| 1.0 (Standard) | yok | 300 kişi / 10 sn | 300/300 | 9.3 sn | 9.8 sn |
| 1.0 (Standard) | `--single-threaded-gc` | 300 kişi / 10 sn | 300/300 | 10.8 sn | 12.5 sn |

Özet: Starter + bayrak, bir dakikaya yayılan 300 kişiyi kaldırıyor. 300 kişi aynı 10 saniyede gelirse (sahnede "herkes şimdi kayıt olsun" denirse) bazıları 30 sn bekleyip "yoğun" mesajı alıyor; bunu istemiyorsanız açılış günü Standard'a geçin.

API'nin bellek tepe değeri 130-180 MB (Starter'da 512 MB var). Darboğaz şifre hash'i (bcrypt): sırayla, tek tek yapılıyor ki kalabalıkta diğer istekler donmasın.

---

## Self-hosted (VPS / Docker Compose)

`docker-compose.prod.yml` ile tüm stack tek makinede:

```bash
cp backend/.env.example .env.prod   # değerleri doldurun
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

Gerekli değişkenler: `MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, `APP_BASE_URL`, `TURNSTILE_SECRET_KEY`.
