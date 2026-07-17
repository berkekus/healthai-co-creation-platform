# HealthAI Co-Creation Platform — Kapsamlı Analiz Raporu

**Tarih:** 17 Temmuz 2026
**Kapsam:** Tüm depo — backend, frontend, altyapı (Docker/Railway/Vercel/nginx), güvenlik, GDPR, test ve dokümantasyon.
**Amaç:** Projenin küresel ölçekte, herkes tarafından güvenle kullanılabilir gerçek bir ürün olarak yayınlanabilmesi için gereken tüm eksik, hata ve düzeltmelerin tespiti.

> İlgili dokümanlar: [IYILESTIRMELER.md](IYILESTIRMELER.md) (çözüm önerileriyle detaylı düzeltme listesi) · [YOL-HARITASI.md](YOL-HARITASI.md) (fazlı roadmap)
>
> **Güncelleme (17 Tem 2026):** Bu rapor denetim anının fotoğrafıdır. Bulguların büyük bölümü aynı gün yamalandı — güncel durum ve deploy'a ertelenen işler için [UYGULAMA-DURUMU.md](UYGULAMA-DURUMU.md)'ye bakın.

---

## 1. Yönetici Özeti

Proje mimari olarak sağlam: katmanlı backend (routes → controllers → services → models), tip güvenli iki taraf (TS her yerde), testler (backend 52, frontend 20 — hepsi geçiyor), Docker/Railway/Vercel deploy hazırlığı ve GDPR bilinciyle yazılmış akışlar mevcut. `tsc` her iki tarafta da temiz, prod build başarılı.

**Ancak proje bugünkü haliyle küresel yayına çıkarılamaz.** Aşağıdaki 6 kritik bulgu yayın öncesi mutlaka kapatılmalıdır:

| # | Kritik Bulgu | Etki |
|---|---|---|
| K1 | `POST /api/auth/register` `role: "admin"` kabul ediyor | Herkes kendine **admin hesabı** açabilir |
| K2 | `backend/.env.atlas` git geçmişinde (public repo!) | Atlas DB şifresi + JWT secret **halka açık** |
| K3 | Demo hesap şifreleri prod build'de ve README'de | `admin@healthai.edu / Admin1234!` herkesin elinde |
| K4 | `GET /api/meetings/:id` yetki kontrolü yok (IDOR) | Her kullanıcı herkesin toplantısını, **e-postalarını**, mesajını okuyabilir |
| K5 | `trust proxy` ayarı yok | Railway'de rate limiter **hata fırlatır** (auth endpoint'leri 500 döner) |
| K6 | OAuth kullanıcılarının şifresi **düz metin** kaydediliyor | `Math.random()` şifre, hash'siz; e-posta eşleşmesiyle otomatik hesap birleştirme → hesap ele geçirme riski |

Kritiklerin ardından en önemli tema **GDPR silme/veri kapsamı eksikleri**, **kalıcı olmayan dosya depolama (avatarlar)**, **bildirim tercihlerinin hiç uygulanmıyor olması** ve **doğrulama (validation) katmanının inceliği**dir.

---

## 2. Mevcut Durum Fotoğrafı

### 2.1 Çalışan ve iyi durumda olanlar

- **Auth çekirdeği:** bcrypt (12 round), token'lar SHA-256 hash'lenerek DB'de saklanıyor, e-posta doğrulama + şifre sıfırlama akışları doğru kurgulanmış ("email var mı" bilgisini sızdırmayan sessiz başarı dahil) — [authService.ts](../../backend/services/authService.ts)
- **Meeting durum makinesi:** pending → time_proposed → confirmed → completed geçişleri atomik `findOneAndUpdate` filtreleriyle; slot çakışma kontrolü, rakip taleplerin otomatik reddi, `resolveUpdateFailure` ile doğru hata ayrımı — [meetingService.ts](../../backend/services/meetingService.ts)
- **Konuşma yetkilendirmesi:** tüm conversation/message erişimleri katılımcı kontrolünden geçiyor — [conversationService.ts](../../backend/services/conversationService.ts)
- **Hata yönetimi:** merkezi `errorHandler` Multer/CastError/duplicate/validation/JWT ayrımı yapıyor, 500'lerde iç bilgi sızdırmıyor — [errorHandler.ts](../../backend/middleware/errorHandler.ts)
- **Önceki code review'un düzeltmeleri uygulanmış:** `POST /api/notifications` artık `adminOnly`, public profil e-posta sızdırmıyor, slot format doğrulaması eklenmiş (bkz. [backend/CODE_REVIEW.md](../../backend/CODE_REVIEW.md))
- **Build/test:** `tsc` iki tarafta da hatasız; backend 52/52, frontend 20/20 test geçiyor; Vite prod build başarılı.

### 2.2 Sayısal özet

| Kategori | Kritik | Yüksek | Orta | Düşük |
|---|---|---|---|---|
| Güvenlik | 6 | 6 | 8 | 4 |
| Veri/GDPR | – | 3 | 2 | 1 |
| Altyapı/Deploy | – | 3 | 5 | 3 |
| Kod kalitesi/DX | – | 1 | 6 | 5 |
| **Toplam** | **6** | **13** | **21** | **13** |

---

## 3. KRİTİK Bulgular (yayın engelleyici)

### K1 — Herkes admin olarak kayıt olabiliyor
[authController.ts:11](../../backend/controllers/authController.ts#L11) → `VALID_ROLES = ['engineer', 'healthcare_professional', 'admin']` ve register handler'ı `role`'ü body'den alıp bu listeyle doğruluyor. Frontend yalnızca iki rol sunsa da API'ye doğrudan `{"role":"admin"}` gönderen herkes, e-posta doğrulamasından sonra **tam yetkili admin** olur: kullanıcı silme, askıya alma, audit log okuma, istatistikler.

**Çözüm:** Register'da `VALID_ROLES`'ten `admin` çıkarılmalı; admin hesapları yalnızca seed/script ile oluşturulmalı.

### K2 — Sırlar public git geçmişinde
`backend/.env.atlas` dosyası `ed0c0f0` commit'inde eklenmiş, `3ab770e`'de izlemeden çıkarılmış — ama **geçmişte duruyor** ve repo `github.com/berkekus/healthai-co-creation-platform` adresinde public. `git log -p` ile MongoDB Atlas bağlantı dizesi (kullanıcı+şifre) ve JWT secret'a herkes ulaşabilir.

**Çözüm:** (1) Atlas şifresi ve JWT secret **derhal rotate** (DEPLOY.md'de zaten yazıyor ama yapılıp yapılmadığı doğrulanmalı), (2) `git filter-repo` / BFG ile geçmiş temizliği + force push, (3) GitHub secret scanning uyarıları kontrol.

### K3 — Demo hesaplar prod'a gömülü
[LoginPage.tsx:12-16](../../frontend/src/pages/auth/LoginPage.tsx#L12-L16) `DEV_ACCOUNTS` sabiti admin dahil üç hesabın e-posta+şifresini içeriyor ve **prod bundle'a giriyor**. Aynı bilgiler [README.md](../../README.md)'de yayınlanmış. Küresel yayında bu, herkese açık admin girişidir.

**Çözüm:** Quick-login bloğu `import.meta.env.DEV` koşuluna alınmalı; prod DB'de bu hesaplar ya hiç olmamalı ya şifreleri rotate edilmeli; README'den kaldırılmalı.

### K4 — Meeting IDOR (yetkisiz veri erişimi)
[meetingController.ts:65-68](../../backend/controllers/meetingController.ts#L65-L68) → `getMeeting` yalnızca `protect` arkasında; **katılımcı/admin kontrolü yok**. Meeting dokümanı iki tarafın adını, **e-posta adreslerini**, NDA mesajını ve slotları içeriyor. Ardışık ID denemesi gerekmez; herhangi bir listeden ID elde eden her kullanıcı okuyabilir.

**Çözüm:** `requesterId/ownerId === req.userId || admin` kontrolü servise eklenmeli.

### K5 — `trust proxy` yok → Railway'de rate limiter patlar
[app.ts](../../backend/src/app.ts)'de `app.set('trust proxy', ...)` çağrısı yok. Railway (ve nginx) proxy arkasında `X-Forwarded-For` başlığı gelir; `express-rate-limit` v8 bu durumda **`ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` fırlatır** → `/api/auth/login` dahil rate-limitli tüm endpoint'ler 500 döner. Ayrıca `req.ip` proxy IP'si olur: tüm kullanıcılar tek IP sayılır, audit loglara yanlış IP yazılır.

**Çözüm:** `app.set('trust proxy', 1)` (Railway/nginx tek hop).

### K6 — OAuth şifreleri düz metin + hesap birleştirme riski
[passport.ts:34,76](../../backend/src/passport.ts#L34) → OAuth ile oluşturulan kullanıcıya `password: Math.random().toString(36)` atanıyor. `User` modelinde pre-save hash hook'u **yok** (hash'leme yalnızca `authService.registerUser` içinde manuel) → bu değer **düz metin** olarak DB'ye yazılıyor. Ek risk: OAuth profili, e-posta eşleşmesiyle mevcut hesaba otomatik bağlanıyor ([passport.ts:21](../../backend/src/passport.ts#L21)) — sağlayıcı tarafında doğrulanmamış bir e-postayla hesap ele geçirme vektörü.
Not: `passport-linkedin-oauth2`'nin kullandığı `r_emailaddress`/`r_liteprofile` scope'ları LinkedIn tarafından **kaldırıldı**; yeni LinkedIn uygulamalarında bu akış zaten çalışmaz (OpenID Connect gerekir).

**Çözüm:** OAuth kullanıcıları için `password` alanı opsiyonel yapılmalı (veya `crypto.randomBytes` + bcrypt); e-posta eşleşmesinde otomatik birleştirme yerine doğrulama adımı; LinkedIn stratejisi OIDC'ye taşınmalı ya da kaldırılmalı.

---

## 4. YÜKSEK Öncelikli Bulgular

### Y1 — GDPR silme kapsamı eksik
`cascadeDeleteUser` ([authService.ts:266-299](../../backend/services/authService.ts#L266-L299)) yalnızca Meeting/Post/Notification'ı ele alıyor. **Silinmeyenler:** kullanıcının Message'ları, Conversation üyelikleri, Comment'leri, SavedSearch'leri. "Hesabınız kalıcı olarak silindi" e-postası atılıyor ama mesajlar ve yorumlar adıyla birlikte duruyor → GDPR Art. 17 ihlali. Aynı şekilde `exportUserData` (Art. 20) mesajları, yorumları ve saved search'leri **içermiyor**.

### Y2 — Hesap silme standalone MongoDB'de çalışmaz
`session.withTransaction` kullanılıyor; transaction'lar yalnızca replica set'te çalışır. Atlas'ta sorun yok, ama lokal `mongodb://localhost` veya tek konteyner Mongo ile **hesap silme her zaman hata verir**. En azından dev/test için fallback veya dokümantasyon gerekli.

### Y3 — Avatar dosyaları kalıcı değil + prod'da 404
- Railway konteyner dosya sistemi **ephemeral**: her deploy'da `uploads/` silinir, tüm avatarlar kaybolur.
- `docker-compose.prod.yml` senaryosunda [nginx.conf](../../frontend/nginx.conf) yalnız `/api`'yi proxy'liyor; `/uploads` yolu **statik root'tan aranır → 404**.
- Ek olarak git'te 3 gerçek kullanıcı avatarı izleniyor (`backend/uploads/avatars/*.png`) — kişisel verinin repoda tutulması ayrı bir GDPR sorunu.

**Çözüm:** S3/R2/Cloudinary'ye geçiş (kalıcı çözüm) veya Railway volume + nginx `/uploads` proxy (kısa vadeli).

### Y4 — Bildirim tercihleri (notifPrefs) hiç uygulanmıyor
Kullanıcı profilde 6 bildirim tercihini kapatabiliyor ama `pushNotification` ([notificationService.ts:4-12](../../backend/services/notificationService.ts#L4-L12)) tercihleri **hiç okumuyor**. Tek istisna weeklyDigest. Ayrıca mesaj bildirimi yanlış tiple atılıyor: [conversationService.ts:97-103](../../backend/services/conversationService.ts#L97-L103) `type: 'meeting_request'` — çünkü enum'da `message` tipi yok ([Notification.ts](../../backend/models/Notification.ts)). Sonuç: "Yeni mesaj" bildirimleri toplantı isteği kategorisinde görünüyor ve mesaj tercihiyle susturulamıyor.

### Y5 — Haftalık digest'te bozuk sorgu
[weeklyDigest.ts:27-30](../../backend/src/cron/weeklyDigest.ts#L27-L30) → `Meeting.find({ $or: [{ requesterId: user.email }, ...] })`: `requesterId` ObjectId alanına **e-posta** veriliyor → CastError → o kullanıcının digest'i tamamen atlanır (hata loglanır). Doğrusu `requesterEmail`. Ayrıca digest HTML'ine `user.name`, `post.title` escape edilmeden gömülüyor (e-posta HTML injection) ve `expertiseTags` ham regex'e çevriliyor (`new RegExp(t,'i')` → ReDoS).

### Y6 — AI endpoint'leri korumasız (maliyet + kota)
`/api/ai/*` rotalarında **rate limit yok** ([aiRoutes.ts](../../backend/routes/aiRoutes.ts)). Dev loglarında gerçek `Gemini 429 - quota exceeded` hataları mevcut ([dev-server.out.log](../../backend/dev-server.out.log)). Kötü niyetli tek kullanıcı Gemini kotasını/bütçesini tüketebilir. `improvePost`'ta `JSON.parse` hata fırlatırsa 500 döner (try/catch yok, diğer servislerde var).

### Y7 — Sunucu tarafı `.edu` doğrulaması yok
`.edu` kuralı yalnızca frontend Zod şemasında ([validators.ts:43](../../frontend/src/utils/validators.ts#L43)). API'ye doğrudan istekle herhangi bir e-posta kayıt olabilir. Kural ürün gereksinimiyse backend'de de zorunlu olmalı; değilse frontend'den kaldırılmalı (tutarlılık).

### Y8 — Regex injection / ReDoS (herkese açık arama)
[postService.ts:60-63](../../backend/services/postService.ts#L60-L63) `domain`, `expertise`, `city`, `country` filtreleri kullanıcı girdisini **escape etmeden** `$regex`'e veriyor; [authService.ts:206](../../backend/services/authService.ts#L206) ve [logService.ts:27](../../backend/services/logService.ts#L27) aynı deseni izliyor. Kötü niyetli desen (ör. `(a+)+$`) sorguları kilitleyebilir. `escapeRegExp` helper'ı şart.

### Y9 — JWT yaşam döngüsü
- Logout token'ı geçersiz kılmıyor (yalnız log); şifre değişince/sıfırlanınca **eski token'lar 7 gün geçerli** kalıyor (`passwordChangedAt` vs `iat` kontrolü yok).
- Frontend'te 30 dk idle timeout var ama sadece UX; token yaşıyor.
- Token `localStorage`'da → XSS durumunda çalınabilir (kabul edilebilir bir takas ama CSP ile desteklenmeli).

### Y10 — Socket.io CORS ve auth boşlukları
[socket.ts:14-20](../../backend/src/socket.ts#L14-L20) origin listesi `app.ts`'tekiyle uyumsuz: `CLIENT_ORIGIN_EXTRA` ve Vercel preview regex'i yok → o origin'lerden HTTP çalışır, **websocket bağlanamaz**. Socket auth'ta `isSuspended` kontrolü yok (askıya alınan kullanıcı canlı bildirim almaya devam eder).

---

## 5. ORTA Öncelikli Bulgular

| # | Bulgu | Konum |
|---|---|---|
| O1 | tsconfig testleri+scriptleri derliyor → `npm test` `dist/tests/*.js`'i de koşup **4 test dosyası FAIL** gösteriyor; prod imajına test/seed kodu giriyor | [backend/tsconfig.json:28-29](../../backend/tsconfig.json#L28), [vitest.config.ts](../../backend/vitest.config.ts) |
| O2 | Repo hijyeni: `dev-server.*.log`, gerçek avatar PNG'leri, bozuk `frontend/C:/Program Files/Git/app/package-lock.json` yolu ve `.DS_Store` git'te izleniyor | `git ls-files` |
| O3 | `APP_BASE_URL` çift anlamlı: e-posta linkleri **frontend** URL'i bekliyor ([emailService.ts:23](../../backend/services/emailService.ts#L23)), OAuth callback **backend** URL'i bekliyor ([passport.ts:7](../../backend/src/passport.ts#L7)). DEPLOY.md'ye göre kurulursa OAuth kırılır | DEPLOY.md §2.2 |
| O4 | OAuth token'ı redirect URL query'sinde (`?token=...`) → tarayıcı geçmişi/proxy loglarına sızar | [authRoutes.ts:50](../../backend/routes/authRoutes.ts#L50) |
| O5 | CORS reddi `cb(new Error(...))` → errorHandler'da **500** olarak dönüyor; 403 olmalı. Vercel preview regex'i tüm preview'lara API açıyor (prod'da daraltılmalı) | [app.ts:40-47](../../backend/src/app.ts#L40-L47) |
| O6 | Post silinince o postun meeting/conversation/comment'leri **orphan** kalıyor | [postService.ts:191-197](../../backend/services/postService.ts#L191-L197) |
| O7 | Comment: post var mı kontrolü yok (olmayan postId'ye yorum), `parentId` doğrulanmıyor | [commentController.ts:24-45](../../backend/controllers/commentController.ts#L24-L45) |
| O8 | Şema-tabanlı validation yok (zod/joi): alan uzunluk sınırları (title/bio/expertiseTags sayısı), `avatarUrl` serbest string (profile update ile istenilen URL yazılabilir) | [authController.ts:119-133](../../backend/controllers/authController.ts#L119-L133) |
| O9 | E-posta şablonlarında kullanıcı adı/başlıklar HTML-escape edilmiyor | [emailService.ts](../../backend/services/emailService.ts), [weeklyDigest.ts](../../backend/src/cron/weeklyDigest.ts) |
| O10 | Sunucu tarafı hesap kilitleme yok — login cooldown yalnız client-side kozmetik; IP başına 20/15dk var ama hedefli hesaba dağıtık deneme mümkün | [rateLimiter.ts](../../backend/middleware/rateLimiter.ts) |
| O11 | Graceful shutdown / `unhandledRejection` handler / Mongo yeniden bağlanma stratejisi yok | [index.ts](../../backend/src/index.ts) |
| O12 | `lastActiveThrottle` Map'i sınırsız büyüyor (yavaş bellek sızıntısı) | [authMiddleware.ts:26](../../backend/middleware/authMiddleware.ts#L26) |
| O13 | Frontend port tutarsızlığı: `socket.ts` ve ProfilePage OAuth linkleri fallback olarak **5001**, `api.ts` **5000** kullanıyor | [socket.ts:3](../../frontend/src/lib/socket.ts#L3), [ProfilePage.tsx:686](../../frontend/src/pages/profile/ProfilePage.tsx#L686) |
| O14 | `deleteAccount` sessionStorage token'ını temizlemiyor | [authStore.ts:131-141](../../frontend/src/store/authStore.ts#L131-L141) |
| O15 | Ana JS bundle 751 kB (gzip 231 kB); jspdf 390 kB ayrı chunk ama react-vendor split yok | Vite build çıktısı |
| O16 | Ölü kod: `src/data/mock*.ts` hiçbir yerden import edilmiyor; `@google/generative-ai` bağımlılığı kullanılmıyor; README + DEPLOY.md hâlâ `VITE_GEMINI_API_KEY` belgeliyor (anahtar artık yalnız backend'de) | package.json, README |
| O17 | ESLint/Prettier yok; CI/CD (GitHub Actions) yok — test/build/lint hiçbir yerde otomatik koşmuyor | repo kökü |
| O18 | Turnstile doğrulaması secret yokken prod'da **sessizce geçiyor** (fail-open) — bilinçliyse en azından startup'ta uyarı loglanmalı | [verifyTurnstile.ts:4](../../backend/utils/verifyTurnstile.ts#L4) |
| O19 | Cron işleri her instance'ta çalışır — Railway'de birden çok replica olursa duplike e-posta | [cron.ts](../../backend/src/cron.ts) |
| O20 | `conversation.deleteConversation` — tek katılımcı, karşı tarafın da tüm mesaj geçmişini kalıcı siler (ürün kararı olarak gözden geçirilmeli) | [conversationService.ts:117-121](../../backend/services/conversationService.ts#L117-L121) |
| O21 | Admin arama kutusu regex'i escape edilmiyor (adminOnly olsa da) | [authService.ts:204-209](../../backend/services/authService.ts#L204-L209) |

---

## 6. DÜŞÜK Öncelikli / İyileştirme Bulguları

- **SEO/meta:** [index.html](../../frontend/index.html) — description, Open Graph, favicon linki yok; `lang="en"` sabit (i18n 5 dil destekliyor).
- **Google Fonts CDN:** AB'de GDPR ihtilaflı (IP aktarımı) + performans; fontlar self-host edilmeli.
- **Güvenlik başlıkları (frontend):** Vercel/nginx tarafında CSP, HSTS, X-Frame-Options vs. yok (helmet yalnız API yanıtlarını kapsıyor). `vercel.json`'a `headers` bloğu eklenmeli.
- **Health check:** DB koparsa `/api/health` 503 → Railway restart döngüsü tetikleyebilir; liveness/readiness ayrımı önerilir.
- **Gözlemlenebilirlik:** request logging (pino-http), error tracking (Sentry), uptime monitoring yok.
- **API dokümantasyonu:** OpenAPI şeması yok (README roadmap'inde de açık madde).
- **Digest e-postasında tek tık unsubscribe yok** (yalnız profile linki) — e-posta uyumluluğu için önerilir.
- **`makeOAuthToken` role claim'i `'user'`** — sistemdeki rollerle uyumsuz (authMiddleware DB'den okuduğu için zararsız ama kafa karıştırıcı).
- **Notification tablosunda TTL yok** — okunmuş eski bildirimler sonsuza dek birikir.
- **`getUserById` (`/api/auth/users/:id/badges` dahil)** — davranış doğru ama `users/:id` public profil endpoint'i login gerektiriyor; ürün kararı olarak dokümante edilmeli.
- **Frontend test kapsamı çok dar:** yalnız `validators.test.ts`; store'lar, sayfalar, kritik akışlar (login, meeting) test edilmiyor. Backend'de conversations/notifications/comments/AI testleri yok.
- **`docker-compose.prod.yml`'de Mongo yedekleme stratejisi yok** (Atlas kullanılıyorsa Atlas backup planı doğrulanmalı).

---

## 7. Deploy-Hazırlık Kontrol Listesi (Go-Live Gate)

Yayın öncesi sıralı kontrol listesi — tamamı [YOL-HARITASI.md](YOL-HARITASI.md) Faz 0-1'e eşlenmiştir:

- [ ] K1: Register'dan `admin` rolü kaldırıldı
- [ ] K2: Atlas şifresi + JWT secret rotate edildi, git geçmişi temizlendi
- [ ] K3: Demo hesaplar prod'dan kaldırıldı/rotate edildi; quick-login yalnız DEV
- [ ] K4: `GET /api/meetings/:id` katılımcı kontrolü eklendi
- [ ] K5: `app.set('trust proxy', 1)` eklendi ve Railway'de doğrulandı
- [ ] K6: OAuth şifre üretimi düzeltildi; LinkedIn stratejisi gözden geçirildi
- [ ] Y1: GDPR silme/eksport kapsamı tamamlandı (mesaj, yorum, saved search)
- [ ] Y3: Avatar depolama kalıcı hale getirildi (S3/R2 veya volume + nginx `/uploads`)
- [ ] Y5: weeklyDigest sorgusu düzeltildi
- [ ] Y6: AI endpoint'lerine rate limit eklendi
- [ ] Y8: Tüm `$regex` girdileri escape edildi
- [ ] O3: `API_BASE_URL` / `APP_BASE_URL` ayrıştırıldı; OAuth callback Railway'de test edildi
- [ ] O17: CI pipeline (lint + tsc + test + build) yeşil
- [ ] Turnstile gerçek anahtarlarla prod'da doğrulandı
- [ ] SMTP prod'da test edildi (kayıt → doğrulama maili)
- [ ] `/api/health` Railway healthcheck ile doğrulandı
- [ ] Vercel `VITE_API_URL` → Railway URL; Railway `CLIENT_ORIGIN` → Vercel URL çapraz doğrulandı
- [ ] Atlas otomatik yedekleme açık
- [ ] Sentry/uptime izleme aktif (önerilen)

---

## 8. Metodoloji

Analiz; tüm backend kaynak dosyalarının (controllers, services, models, middleware, routes, cron, socket, passport), frontend çekirdeğinin (api/socket/store/router/validators/i18n/build config), tüm deploy yapılandırmalarının (Dockerfile'lar, docker-compose, railway.json, nginx.conf, vercel.json, .env.example'lar) satır satır okunması; `git ls-files` / `git log` ile depo ve geçmiş denetimi; `tsc`, `vitest` (backend+frontend) ve Vite prod build'inin fiilen çalıştırılması ile yapılmıştır. Dev sunucu logları (`dev-server.*.log`) gerçek çalışma zamanı hataları için incelenmiştir.
