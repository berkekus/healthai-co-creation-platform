# HealthAI — Düzeltme ve İyileştirme Raporu (Backend + Frontend)

**Tarih:** 17 Temmuz 2026
**Bağlam:** [ANALIZ-RAPORU.md](ANALIZ-RAPORU.md)'ndaki bulguların her biri için somut çözüm önerisi. Bulgu numaraları (K/Y/O) analiz raporuyla eşleşir.

---

## 1. Backend Düzeltmeleri

### 1.1 Güvenlik

#### K1 — Register'dan admin rolünü kaldır
```ts
// backend/controllers/authController.ts
const VALID_ROLES = ['engineer', 'healthcare_professional'] as const  // 'admin' KALDIRILDI
```
Admin oluşturma yalnızca `scripts/` altında bir seed/CLI komutuyla yapılmalı (`reset-admin-password.ts` zaten var, benzer desen).

#### K4 — Meeting erişim kontrolü
```ts
// backend/services/meetingService.ts
export async function getMeetingById(id: string, userId: string, isAdmin = false) {
  const meeting = await Meeting.findById(id)
  if (!meeting) throw makeError('Meeting not found', 404)
  const isParty = meeting.requesterId.toString() === userId || meeting.ownerId.toString() === userId
  if (!isParty && !isAdmin) throw makeError('Forbidden', 403)
  return (await withEmails([meeting]))[0]
}
```
Controller'dan `req.userId` ve `req.userRole === 'admin'` geçirin.

#### K5 — trust proxy
```ts
// backend/src/app.ts — const app = express() hemen sonrası
app.set('trust proxy', 1)  // Railway / nginx tek hop
```
Bu olmadan Railway'de `express-rate-limit` v8 `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` fırlatır; ayrıca `req.ip` ve audit log IP'leri yanlış olur.

#### K6 — OAuth şifre/hesap birleştirme
- `UserSchema.password` → `required: function() { return !this.githubId && !this.linkedinId }` yapın, OAuth kullanıcılarında hiç şifre tutmayın; **veya** `await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12)` kullanın.
- E-posta eşleşmesiyle otomatik hesap bağlamayı kaldırın; mevcut hesaba bağlama akışını "girişten sonra profil ekranında hesap bağla" düğmesine taşıyın.
- LinkedIn: `passport-linkedin-oauth2` eski scope'ları (`r_emailaddress`, `r_liteprofile`) kullanıyor; LinkedIn bunları kaldırdı. OIDC (`openid profile email`) destekleyen bir stratejiye geçin ya da LinkedIn girişini yayından kaldırın.

#### Y8/O21 — Regex escape helper'ı
```ts
// backend/utils/escapeRegExp.ts
export const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
```
Uygulanacak yerler: `postService.listPosts` (domain/expertise/city/country), `authService.getAllUsers` (search), `logService.getLogs` (action), `weeklyDigest` (expertiseTags → `$in` regex yerine `$text` veya escape'li regex).

#### Y9 — JWT yaşam döngüsü
- `User` şemasına `passwordChangedAt: Date` ekleyin; `changePassword`/`resetPassword`'da güncelleyin.
- `protect` middleware'inde `decoded.iat * 1000 < passwordChangedAt` ise 401.
- Orta vade: kısa ömürlü access token (15 dk) + refresh token (httpOnly cookie) mimarisine geçiş.

#### O5 — CORS reddini 403'e çevir
```ts
cb(Object.assign(new Error('Origin not allowed'), { statusCode: 403 }))
```
Ayrıca prod'da `vercelPreviewRe`'yi env flag'iyle kapatılabilir yapın (önizleme URL'leri herkese açık).

#### O10 — Sunucu tarafı hesap koruması
`express-rate-limit`'e ek olarak başarısız giriş sayacını kullanıcı bazında tutun (User şemasında `failedLoginAttempts`, `lockUntil`); 5 hatada 15 dk kilit. Client-side cooldown yalnız UX olarak kalsın.

#### O18 — Turnstile fail-open uyarısı
`NODE_ENV === 'production' && !TURNSTILE_SECRET_KEY` ise startup'ta `logger.warn` (veya kesin isteniyorsa `process.exit`).

### 1.2 Veri bütünlüğü ve GDPR

#### Y1 — Silme kaskadını tamamla
`cascadeDeleteUser` içine ekleyin (aynı session ile):
```ts
const convs = await Conversation.find({ participants: userId }).select('_id').session(session)
await Message.deleteMany({ conversationId: { $in: convs.map(c => c._id) } }, { session })
// Konuşmayı tamamen silmek yerine karşı taraf için anonimleştirme de düşünülebilir:
await Conversation.updateMany({ participants: userId }, { $set: { 'participantDetails.$[el].name': 'Deleted user' } }, { arrayFilters: [{ 'el.userId': userId }], session })
await Comment.deleteMany({ authorId: userId }, { session })      // veya authorName: 'Deleted user' anonimleştir
await SavedSearch.deleteMany({ userId }, { session })
```
`exportUserData`'ya messages + comments + savedSearches + notifications ekleyin.

#### Y2 — Transaction fallback
```ts
const supportsTx = mongoose.connection.readyState === 1 &&
  (mongoose.connection as any).client?.topology?.hasSessionSupport?.()
```
yerine daha basit pratik: `withTransaction`'ı try/catch'e alın; `MongoServerError: Transaction numbers are only allowed...` yakalanırsa session'sız sıralı silme yapın. README'ye "lokal geliştirmede replica set önerilir" notu ekleyin (`mongod --replSet rs0` veya `mongodb-memory-server` gibi).

#### O6 — Post silme kaskadı
`deletePost` içinde: o posta ait `pending/time_proposed` meeting'leri iptal edip bildirim atın; comment'leri silin. Confirmed meeting varsa silmeyi engellemek (409) daha güvenli bir ürün kararı.

#### O7 — Comment doğrulaması
`createComment` başında `await Post.exists({ _id: postId })` yoksa 404; `parentId` verilmişse aynı postId'ye ait olduğunu doğrulayın.

#### Bildirimler (Y4)
1. Enum'a `'message_received'` ekleyin; `conversationService.sendMessage` bunu kullansın.
2. `pushNotification` başında tercih kontrolü:
```ts
const PREF_BY_TYPE: Partial<Record<NotificationType, keyof INotifPrefs>> = {
  meeting_request: 'meetingRequests', meeting_accepted: 'meetingUpdates',
  meeting_declined: 'meetingUpdates', meeting_cancelled: 'meetingUpdates',
  meeting_completed: 'meetingUpdates', interest_received: 'interestReceived',
  message_received: 'messages', account_activity: 'adminMessages',
}
// User.findById(userId).select('notifPrefs') → kapalıysa sessizce return
```
3. `Notification` koleksiyonuna TTL veya periyodik temizlik (örn. okunmuş + 90 gün).

#### Y5 — weeklyDigest düzeltmesi
```ts
Meeting.find({
  $or: [{ requesterEmail: user.email }, { ownerEmail: user.email }],
  status: { $in: ['confirmed', 'pending', 'time_proposed'] },
})
```
+ HTML escape helper'ı (aşağıda) + digest'e tek tık unsubscribe linki (`/api/auth/unsubscribe?token=...` imzalı token ile).

#### O9 — E-posta HTML escape
```ts
const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
```
`emailService` ve `weeklyDigest` şablonlarındaki tüm dinamik değerlere uygulayın.

### 1.3 Doğrulama katmanı

#### O8 — Zod ile şema tabanlı validation (backend)
Frontend zaten Zod kullanıyor; backend'e de `zod` ekleyip route-level middleware yazın:
```ts
export const validate = (schema: ZodSchema) => (req, res, next) => {
  const r = schema.safeParse(req.body)
  if (!r.success) return res.status(400).json({ success: false, message: r.error.issues[0].message })
  req.body = r.data
  next()
}
```
Öncelikli şemalar: register (maks. uzunluklar + `.edu` kuralı → Y7), profile update (`avatarUrl` → yalnız `/uploads/...` veya https URL allowlist; `expertiseTags` maks. 10 öğe × 40 karakter; `bio` maks. 400), post create/update (title ≤ 120, description 50–3000), meeting request (message 20–1000, slot sayısı 3–10, tarihler gelecekte).

### 1.4 Operasyon ve dayanıklılık

#### O11 — Graceful shutdown + hata yakalayıcılar
```ts
process.on('unhandledRejection', (err) => logger.error({ err }, 'unhandledRejection'))
process.on('SIGTERM', async () => {
  httpServer.close(); await mongoose.connection.close(); process.exit(0)
})
```
`connectDB`'ye retry (örn. 5 deneme, exponential backoff) ekleyin; Railway cold start'ta Atlas'a ilk bağlantı bazen geç gelir.

#### O12 — lastActive throttle Map temizliği
Basit çözüm: Map yerine `lru-cache` (max 10k giriş) veya her 30 dk `lastActiveThrottle.clear()`.

#### O19 — Cron tek instance garantisi
Railway'de tek replica çalıştığı sürece sorun yok; ölçeklenince cron'u `RUN_CRON=true` env flag'ine bağlayın (yalnız bir instance'ta true).

#### Y6 — AI rate limit
```ts
export const aiLimiter = rateLimit({ ...baseOptions, windowMs: 60_000, max: 10 })  // kullanıcı başına düşünülecekse keyGenerator: req => req.userId
router.use(aiLimiter)  // aiRoutes.ts
```
`improvePost`'taki `JSON.parse`'ı try/catch'e alın (aiMatchService'teki `parseSuggestions` deseni).

#### O3 — Env değişkenlerini ayır
- `API_BASE_URL` (backend public URL) → passport callback'leri
- `APP_BASE_URL` (frontend URL) → e-posta linkleri
DEPLOY.md, .env.example ve docker-compose'ları buna göre güncelleyin.

#### O1 — Build/test yapılandırması
- `tsconfig.build.json` oluşturun: `"extends": "./tsconfig.json"`, `"exclude": ["tests", "scripts"]`; `"build": "tsc -p tsconfig.build.json"`.
- `vitest.config.ts` → `test.exclude: ['dist/**', 'node_modules/**']`.
Bu ikisi mevcut "4 failed test file" gürültüsünü ve prod imajındaki test kodunu kaldırır.

### 1.5 Depolama (Y3)

Önerilen hedef mimari: **Cloudflare R2 veya S3** + imzalı URL; `avatarUrl` mutlak URL olur, nginx/Vercel bağımlılığı kalkar, Railway ephemeral sorunu biter.
Kısa vadeli yama (self-host senaryosu): Railway volume mount + nginx'e:
```nginx
location /uploads {
    proxy_pass http://backend:5000/uploads;
}
```
Ek güvenlik: dosya içeriği magic-byte doğrulaması (`file-type` paketi), EXIF strip + yeniden boyutlandırma (`sharp`).

---

## 2. Frontend Düzeltmeleri

### 2.1 Güvenlik / doğruluk

| Bulgu | Düzeltme |
|---|---|
| K3 — DEV_ACCOUNTS prod'da | Bloğu `{import.meta.env.DEV && (...)}` koşuluna alın; sabitleri ayrı dosyaya taşıyıp prod bundle'dan tree-shake edilmesini sağlayın. README'deki şifreleri kaldırın |
| O13 — 5001/5000 tutarsızlığı | Tek kaynak: `src/lib/env.ts` içinde `export const API_URL`, `export const API_ORIGIN`; socket.ts, api.ts, Navbar, ProfilePage(×2), PublicProfilePage hepsinde bunu kullanın |
| O14 — deleteAccount token temizliği | `sessionStorage.removeItem('token')` ekleyin + `disconnectSocket()` çağırın |
| OAuth callback token'ı | `OAuthCallbackPage` token'ı URL'den okuyup temizliyorsa da tarayıcı geçmişinde kalır; backend one-time code akışına geçince `history.replaceState` ile birlikte güncelleyin |

### 2.2 Performans

- **Bundle (O15):** `vite.config.ts` → `build.rollupOptions.output.manualChunks` ile `react`, `react-dom`, `react-router-dom`, `framer-motion`, `i18next` vendor chunk'ı; `jspdf` + `html2canvas` importlarının yalnız kullanıldığı yerde `await import()` ile dinamik olduğundan emin olun (PDF export butonu tıklanınca yüklensin).
- **Google Fonts:** `@fontsource/plus-jakarta-sans`, `@fontsource/source-sans-3` ile self-host; `index.html`'den CDN linklerini kaldırın (GDPR + LCP iyileşmesi). Material Symbols yerine zaten kullanılan `lucide-react`'e tam geçiş değerlendirin (çift ikon sistemi var).
- **Axios timeout:** `axios.create({ timeout: 15000 })` — takılı istekler UI'ı sonsuz spinner'da bırakmasın.

### 2.3 SEO / meta / PWA

`index.html`'e ekleyin: `<meta name="description">`, OG/Twitter kartları, `<link rel="icon" href="/images/healthailogo.svg">`, `theme-color`. `lang` özniteliğini i18n diline göre `document.documentElement.lang = i18n.language` ile senkronlayın. `robots.txt` + `sitemap.xml` (Vercel'de statik) ekleyin.

### 2.4 Güvenlik başlıkları (Vercel)

```json
// vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [{
    "source": "/(.*)",
    "headers": [
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains" },
      { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
      { "key": "Content-Security-Policy", "value": "default-src 'self'; connect-src 'self' https://<railway-url> wss://<railway-url> https://challenges.cloudflare.com; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com" }
    ]
  }]
}
```
(CSP'yi font self-host sonrası daraltın.)

### 2.5 Temizlik

- `src/data/mock*.ts` dosyalarını silin (hiçbir import yok).
- `@google/generative-ai` bağımlılığını `package.json`'dan kaldırın.
- README + DEPLOY.md'den `VITE_GEMINI_API_KEY` satırlarını kaldırın (anahtar yalnız backend'de — 41728ab commit'inin devamı).
- Git'ten kaldırın: `backend/dev-server.*.log`, `backend/uploads/avatars/*` (gerçek kişi verisi!), `frontend/C:/` altındaki bozuk yol, kökteki `.DS_Store`; `.gitignore`'a `*.log`, `uploads/`, `.DS_Store` ekleyin.
- Kökteki anlamsız `package-lock.json` (114 bayt) gözden geçirilmeli.

---

## 3. Test ve Kalite Altyapısı

### 3.1 Backend test boşlukları
Mevcut: auth, authz, meetings, posts (52 test). Eksik ve öncelikli:
1. **Regresyon testleri (bu rapordaki buglar için):** register'da admin reddi, meeting IDOR 403, mesaj bildirimi tipi, weeklyDigest sorgusu.
2. conversations (yetki + silme kaskadı), notifications (tercih uygulanması), comments, saved searches.
3. GDPR: deleteAccount sonrası Message/Comment kalıntısı olmadığının testi.

### 3.2 Frontend test boşlukları
Mevcut: yalnız `validators.test.ts`. Öncelik: `authStore` (login/hydrate/logout akışı, token storage), `ProtectedRoute` (rol yönlendirmeleri), `matchPosts`/`calendarExport` util'leri, kritik form sayfaları için birer smoke render testi.

### 3.3 Lint + CI
- ESLint (typescript-eslint + react-hooks) ve Prettier config'i ekleyin — şu an hiç linter yok.
- `.github/workflows/ci.yml`: iki job (backend/frontend) × adımlar: `npm ci` → `lint` → `tsc --noEmit` → `test` → `build`. PR'lara zorunlu status check yapın.
- `npm audit` / Dependabot açın (bcryptjs 3.x, nodemailer 8.x gibi major sürümler takip gerektiriyor).

---

## 4. Gözlemlenebilirlik Önerileri

| Katman | Öneri | Neden |
|---|---|---|
| İstek logları | `pino-http` middleware | Şu an hiçbir HTTP isteği loglanmıyor; olay incelemesi imkânsız |
| Hata takibi | Sentry (backend + frontend) | 500'ler ve frontend exception'ları görünmez durumda |
| Uptime | Railway healthcheck + harici ping (UptimeRobot/BetterStack) | `/api/health` zaten hazır |
| Metrik | Basit `/api/health` genişletmesi (uptime, versiyon) + Railway metrics | Kapasite planlama |
| Audit log | Mevcut Log koleksiyonuna 24 ay TTL index (e-postadaki taahhütle uyum) | `sendAccountDeletedEmail` 24 ay retention vaat ediyor ama TTL yok |

---

## 5. Hızlı Kazanımlar (≤ 1 saatlik işler)

1. `app.set('trust proxy', 1)` (K5) — tek satır
2. Register'dan `admin` çıkar (K1) — tek satır
3. Meeting IDOR kontrolü (K4) — ~10 satır
4. weeklyDigest `requesterEmail` düzeltmesi (Y5) — tek satır
5. DEV_ACCOUNTS'u `import.meta.env.DEV`'e alma (K3-frontend) — ~5 satır
6. `aiLimiter` ekleme (Y6) — ~10 satır
7. socket/api port tutarlılığı (O13) — ~15 dakika
8. vitest `exclude: ['dist/**']` + `tsconfig.build.json` (O1) — ~15 dakika
9. mock dosyaları + kullanılmayan bağımlılık temizliği (O16) — ~15 dakika
10. `escapeRegExp` helper + 4 kullanım yeri (Y8) — ~30 dakika
