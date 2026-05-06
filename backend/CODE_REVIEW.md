# Backend Code Review — HEALTH AI Co-Creation Platform

Review tarihi: 2026-05-06
Branch: `backend`
Kapsam: `backend/` altındaki tüm dosyalar (models, controllers, services, routes, middleware, utils, tests, config).

---

## 1. Genel Backend Mimarisi

**İyi:**
- Klasör ayrımı net: `routes → controllers → services → models`. Sorumluluklar oldukça temiz dağılmış.
- `asyncHandler` ([utils/asyncHandler.ts](utils/asyncHandler.ts)) ile try/catch tekrarından kurtulunmuş.
- `controllers/postController.ts` ve [controllers/meetingController.ts](controllers/meetingController.ts) içinde tanımlı yerel `log()` helper'ı tekrarı azaltıyor.

**Sorunlar:**
- `src/` ile `routes/`, `controllers/`, `services/` klasörleri **kardeş**. `tsconfig` `rootDir: "./"` olduğu için tüm yapı `dist/src/...`, `dist/routes/...` şeklinde derleniyor. Bu yüzden [src/app.ts:6-11](src/app.ts#L6-L11) `'../routes/...'` gibi `../` kullanıyor. Çözüm: ya her şey `src/` altına alınmalı ya da `paths` alias kullanılmalı.
- `Repository` katmanı **yok**. Service'ler doğrudan Mongoose modelleri çağırıyor; küçük proje için kabul edilebilir ama test izolasyonu zorlaşıyor.
- `controllers/authController.ts` ile [controllers/postController.ts](controllers/postController.ts), [controllers/meetingController.ts](controllers/meetingController.ts) içinde **aynı** `log()` fonksiyonu üç kez tanımlanmış. `utils/log.ts` gibi tek yere alınmalı.
- `makeError(message, status)` aynı şekilde [authService.ts:15-19](services/authService.ts#L15-L19), [postService.ts:6-10](services/postService.ts#L6-L10), [meetingService.ts:18-22](services/meetingService.ts#L18-L22), [notificationService.ts:24-26](services/notificationService.ts#L24-L26) içinde **dört kez** kopyalanmış. `utils/AppError.ts` veya custom `HttpError` class olmalı.
- `IUser`, `IPost` gibi modellerde `Document`'ten extend ederken `id: string` çakışması olur. Bu yüzden kodda her yerde `user.id as string` cast'i var (örn [authService.ts:27](services/authService.ts#L27)). `Document`'i çıkarıp `mongoose.HydratedDocument<...>` veya `interface IUser { ... }` + `Schema<IUser>` ile cast'siz olunabilir.

---

## 2. API Endpoint Kontrolü

**İyi:**
- REST yapısı çoğunlukla temiz: `GET /api/posts`, `POST /api/posts`, `PUT /api/posts/:id`, `DELETE /api/posts/:id`.
- Domain action'ları action-style URL ile ayrılmış: `POST /:id/publish`, `POST /:id/partner-found`, `POST /:id/interest` — REST puristleri eleştirir ama pratik.

**Sorunlar:**
- [routes/notificationRoutes.ts:12](routes/notificationRoutes.ts#L12) — `POST /api/notifications` endpoint'i, kullanıcı **başka bir kullanıcıya bildirim oluşturabiliyor**. [notificationController.ts:5-13](controllers/notificationController.ts#L5-L13) `userId`'yi body'den alıyor, **rol kontrolü yok**. Saldırgan, başka bir kullanıcının paneline çöp/spam bildirim atabilir. Bu endpoint ya `adminOnly` olmalı ya tamamen kaldırılıp internal helper olarak kullanılmalı (bu zaten `pushNotification` aracılığıyla servisten çağrılıyor).
- [routes/authRoutes.ts:24](routes/authRoutes.ts#L24) — `GET /api/auth/users/:id` herhangi bir oturum açmış kullanıcıya başka kullanıcının **tüm sanitize alanları**nı (email, isVerified, isSuspended dahil) veriyor. `email` ve hassas alanlar yalnız self / admin'e dönmeli.
- `POST /api/auth/logout` ([routes/authRoutes.ts:16](routes/authRoutes.ts#L16)) — JWT stateless olduğu için **server-side logout aslında bir şey yapmıyor**, sadece log atıyor. Token blacklisting / refresh token yok. Kullanıcı dijital olarak hâlâ geçerli token'a sahip.
- `GET /api/auth/me/export` ([routes/authRoutes.ts:22](routes/authRoutes.ts#L22)) GDPR Article 20 niyetiyle iyi, ancak **rate limit yok**. Saldırgan tek bir oturumla tonla I/O yapabilir.
- `requestMeeting` body'sinde `ownerId`, `ownerName`, `postTitle` istiyor ([meetingController.ts:22](controllers/meetingController.ts#L22)) — bunlar **sunucudan türetilebilir** alanlar. Client'a güvenmek yerine `postId`'den çekilmeli. `postTitle` zaten DB'de var; `ownerName/ownerId` `Post.findById` ile alınmalı.

---

## 3. Validation ve Error Handling

**İyi:**
- [middleware/errorHandler.ts](middleware/errorHandler.ts) Multer, CastError, duplicate key (E11000), Mongoose ValidationError ve JWT hatalarını ayrı ayrı handle ediyor — solid.
- 500'lerde mesaj swap'lanıyor (`'Internal server error'`) — internal info leak yok.

**Sorunlar:**
- **Validation çok ince**. [authController.ts:12-34](controllers/authController.ts#L12-L34) elle yapılmış `if` zincirleri var; `expressionRequired`, `description`, `expiryDate` gibi alanların min/max uzunluğu, `expiryDate >= now` kontrolü **yok**. Önerim: `zod` veya `joi` ile schema-based validation. Şu anki regex `EMAIL_RE` aşırı naif.
- [postController.ts:24-28](controllers/postController.ts#L24-L28) `expiryDate` string olarak alınıyor, sonra Mongoose `Date` olarak parse ediyor. `new Date('blabla')` → `Invalid Date`; sonra `expiryDate: { type: Date, required: true }` validation'ı tetikler ama hata mesajı kullanıcıya kafa karıştırıcı. Önceden parse + 400 dönmek lazım.
- [meetingService.ts:38](services/meetingService.ts#L38) `data.message.length < 20` — `data.message` undefined olursa TypeError. Controller `!message` kontrolü yapıyor ama `message: ''` boş string için yine de fail eder. Yine de boundary check yapılmalı.
- [meetingService.ts:39](services/meetingService.ts#L39) `proposedSlots.length < 3` — array değilse crash. `Array.isArray()` kontrolü yok.
- [meetingController.ts:84](controllers/meetingController.ts#L84) `slot.date` ve `slot.time` string format kontrolü yok. Kullanıcı `"yarın"` gönderebilir.
- [postController.ts:25](controllers/postController.ts#L25) `!confidentiality` — eğer client `'public_pitch'` gönderirse OK; ama enum kontrolü yapılmıyor. Mongoose enum'a düşüyor; UX için pre-validation önerilir.
- ✅ [services/logService.ts:31-32](services/logService.ts#L31-L32) `new Date(filters.from)` invalid input'ta `Invalid Date` üretir, MongoDB query patlar. Kontrol edilmeli.
- Error format **çoğunlukla** tutarlı: `{ success, message }`. Ama bazen `{ success, data }`, bazen `{ success, message }` dönülüyor; standart bir `{ success, data?, message?, error? }` envelope'u dokümante edilmeli.

---

## 4. Database ve Model Kontrolü

**İyi:**
- Indexler düşünülmüş: [Post.ts:78-82](models/Post.ts#L78-L82) authorId, status, domain, country+city, ve `text` index. [Meeting.ts:71-74](models/Meeting.ts#L71-L74) post/requester/owner/status. [Notification.ts:59](models/Notification.ts#L59) `(userId, isRead)` compound. [Log.ts:36-39](models/Log.ts#L36-L39) timestamp/action/result.
- `timestamps: true` her modelde var → audit fields hazır.

**Sorunlar:**
- **Denormalization fazla**. [Meeting.ts:21-26](models/Meeting.ts#L21-L26) `requesterName, requesterEmail, ownerName, ownerEmail` denormalize edilmiş. Kullanıcı isim/email değiştirince **stale veri** kalır. `withEmails` ([meetingService.ts:7-16](services/meetingService.ts#L7-L16)) bu sorunu kısmen çözüyor ama isim için yapmıyor. Tutarlı strateji: ya tamamı populate edilsin, ya da güncellemede broadcast yapılsın.
- Aynı şekilde [Post.ts:13-14](models/Post.ts#L13-L14) `authorName` denormalize. User isim değiştirince eski post'larda eski isim kalır.
- [User.ts:17](models/User.ts#L17) `verifyToken: { type: String, index: true }` — bu **plain text** saklanıyor. Best practice: token'ı SHA256 hash'leyip DB'de hash'i tut, kullanıcıya plain version git. DB leak'inde token'lar açığa çıkmaz.
- [User.ts:28](models/User.ts#L28) `email: { unique: true }` ama `lowercase: true` var. OK; ama Mongoose'da `unique` index oluşturmak için `await mongoose.connection.syncIndexes()` çağırılmıyor — yeni deployment'larda silent index'siz başlayabilir.
- [Meeting.ts:34-40](models/Meeting.ts#L34-L40) `ITimeSlot` `date: string, time: string`. Ayrı string yerine tek bir `Date` olmalı; timezone bug'ları kapıda.
- `User` modelinde `password` alanı `select: false` **yok**. Yanlışlıkla `User.findById(...)` ile dönen objelerde password hash leak riski var. Şu anda kod manuel `sanitize()` çağırıyor ama unutulan bir endpoint felaket olur. `password: { select: false }` eklensin, sadece `loginUser`/`changePassword`'da `.select('+password')` denesin.
- ✅ [Log.ts:18](models/Log.ts#L18) `timestamp` field'ı + `timestamps: true` ile birlikte `createdAt` çift kaydediliyor. Tek birini kullan.
- Post'larda `authorId + ref: 'User'` var ama populate hiç çağrılmıyor. Denormalize edilmiş `authorName` için OK ama `authorRole` kullanıcı sonradan rol değiştirirse stale olur (admin değişimi vs).

---

## 5. Security Kontrolü

**Kritik:**
- ⚠️ **`POST /api/notifications` yetkisiz spam** — Madde 2'de detaylı. Authenticated her kullanıcı başkasına bildirim atabilir. **HEMEN kapatılmalı veya `adminOnly` yapılmalı**.
- ⚠️ [middleware/authMiddleware.ts:31](middleware/authMiddleware.ts#L31) — JWT `decoded.role` kullanılıyor. Kullanıcı **suspend edilirse** flag DB'den okunuyor (iyi), ama **role değişirse** (örn. admin'den engineer'a düşürülürse) eski token hâlâ admin yetkisi taşır. Çözüm: `req.userRole = user.role` (DB'den okunan), `decoded.role` değil. Şu an [authMiddleware.ts:44](middleware/authMiddleware.ts#L44) `req.userRole = decoded.role` — **token'a güveniyor**.
- [src/app.ts:32](src/app.ts#L32) `express.json({ limit: '10kb' })` — iyi, body bombing'e karşı.
- `helmet`, `cors` (whitelist), `mongoSanitize` var → solid.
- ✅ `bcrypt` SALT_ROUNDS=10 → düşük; modern öneri 12. Hesaplama maliyeti uygunsa 12'ye çıkar.
- [authService.ts:29](services/authService.ts#L29) `JWT_EXPIRES_IN ?? '7d'` — 7 gün uzun. Refresh token mekanizması yok. Stolen token 7 gün boyunca geçerli.
- [src/index.ts:4](src/index.ts#L4) `JWT_SECRET` minimum length kontrolü yok. Kısa secret → brute force.
- ✅ Avatar upload [middleware/uploadMiddleware.ts:17-21](middleware/uploadMiddleware.ts#L17-L21) — filename `${userId}-${Date.now()}${ext}`. `ext` user-controlled `originalname`'den geliyor. `path.extname` güvenli ama `.php`, `.html` gibi extension'lar engellenmemiş — sadece mime kontrolü var. `ALLOWED_TYPES` MIME'a göre filtreliyor ama dosya extension white-list edilmeli (`.jpg|.jpeg|.png|.webp|.gif`).
- `express-mongo-sanitize` v2.2.0 ile Express 4 uyumlu, ancak **Express 5'e geçince `req.query` immutable** ve bu paket çalışmaz; gelecek geçişte dikkat.
- `.env` validation [src/index.ts:4-10](src/index.ts#L4-L10) — sadece `JWT_SECRET` ve `MONGO_URI` var. `SMTP_*`, `CLIENT_ORIGIN` opsiyonel — OK.

**Orta:**
- [authMiddleware.ts:17-18](middleware/authMiddleware.ts#L17-L18) `lastActiveThrottle` in-memory `Map`. Birden fazla node instance'ında her biri ayrı throttle'lar. Kümede çalışınca DB write kontrolü dağılır. Redis ile çözülmeli ya da kabul edilmeli.

---

## 6. Performans

- ⚠️ [postService.ts:53-56](services/postService.ts#L53-L56) `listPosts` her çağrıda `Post.updateMany({ status: 'active', expiryDate: { $lt: now } }, ...)` çalıştırıyor. **Her listeleme isteği bir yazma yapıyor** — yüksek trafikte sorun. Cron job'a (`node-cron`) taşı veya TTL/timestamp tabanlı lazy filter (`$or: [{ status: 'active' }, ...]`) kullan.
- [meetingService.ts:7-16](services/meetingService.ts#L7-L16) `withEmails` zaten N+1'i önlüyor (toplu `$in` query) — iyi.
- [services/authService.ts:230-235](services/authService.ts#L230-L235) `exportUserData` paralel `Promise.all` — iyi.
- ✅ [postService.ts:125-139](services/postService.ts#L125-L139) `markPartnerFound` döngüde `meeting.save()` + `pushNotification` her iterasyonda await ediyor; `Promise.all`'a alınabilir.
- ✅ Aynı şekilde [authService.ts:261-275](services/authService.ts#L261-L275), [authService.ts:320-333](services/authService.ts#L320-L333) `for ... await meeting.save()` döngüsü `bulkWrite` ile tek roundtrip'e indirilebilir.
- ✅ `getNotificationsByUser` [notificationService.ts:14](services/notificationService.ts#L14) `limit(50)` hard-coded; **pagination yok**. 50'den fazla bildirimi olan kullanıcı eski olanları göremez.
- ✅ [logService.ts:38-39](services/logService.ts#L38-L39) `countDocuments` + `find` — paralel `Promise.all` yapılabilir.
- Cache: post listesi, public profile gibi sık okunan veriler için Redis cache layer mantıklı.

---

## 7. Kod Kalitesi

**İyi:**
- Naming convention tutarlı, çoğu fonksiyon kısa ve odaklı.
- TypeScript `strict` açık; cast'ler dışında tip güvenliği iyi.
- Comment'ler genelde "why" açıklıyor (örn [authMiddleware.ts:16](middleware/authMiddleware.ts#L16) `// Throttle lastActive writes...`).

**Sorunlar:**
- [postService.ts:99-101](services/postService.ts#L99-L101) `(post as any)[field] = (data as any)[field]` — `any` kaçışı.
- [postService.ts:164](services/postService.ts#L164) `return updated!` — non-null assertion. `findByIdAndUpdate` null dönerse runtime crash. `if (!updated) throw makeError(...)` ile guard et.
- [meetingService.ts:104, 124, 148, 174](services/meetingService.ts#L104) — `await resolveUpdateFailure(...)` her zaman throw eder ama sonraki satırda `meeting!` non-null assertion var. Tip sistemi `resolveUpdateFailure: Promise<never>` döndüğü için doğru ama okunabilirlik açısından zayıf.
- [authService.ts:147-151, 156-161, 199-201, 204-208, 211-216, 353-357](services/authService.ts) — `const err: Error & { statusCode?: number } = new Error(...)` boilerplate **6 kez** tekrarlanmış. Bunun için zaten `makeError()` aynı dosyada var ama tutarsız kullanılmış.
- `console.error` / `console.log` ([authService.ts:76, 112, 305](services/authService.ts#L76); [emailService.ts:28-31](services/emailService.ts#L28-L31)) doğrudan kullanılıyor. Production-grade için `pino` veya `winston` logger lazım.
- `req.userId as string`, `req.userRole as string` cast'leri sık. Tip-safe alternatif: `protect` middleware'de `req.userId` zorunlu olduktan sonra `AuthenticatedRequest` (userId required) tipi kullan.
- Magic number: `SALT_ROUNDS = 10`, `LAST_ACTIVE_THROTTLE_MS = 5min`, `VERIFY_TOKEN_TTL_MS = 24h` — config dosyasına çekilebilir.

---

## 8. Eksik Olabilecek Özellikler

- 🟥 **Şifre sıfırlama (forgot password)**: `resendVerification` var ama `forgot-password` flow yok. Hesabını doğrulamış kullanıcı şifresini unutursa kayıp.
- 🟥 **Refresh token / token rotation**: Stateless JWT 7 gün — XSS'te token çalınırsa felaket.
- ✅ **Pagination** notification'larda yok ([notificationService.ts:14](services/notificationService.ts#L14)).
- 🟧 **Sorting**: post listing'de `createdAt: -1` sabit. `?sort=interestCount` gibi opsiyon yok.
- 🟧 **Swagger/OpenAPI**: `swagger-jsdoc` + `swagger-ui-express` ile API.md otomatik üretilebilir.
- 🟧 **Global request logger**: Morgan veya custom middleware HTTP request audit eksik.
- ✅ **Health check**'in ([src/app.ts:37](src/app.ts#L37)) MongoDB connection state kontrolü yok. `mongoose.connection.readyState === 1` döndürmeli.
- 🟧 **Rate limit by user (not IP)**: `express-rate-limit` default IP-based; auth sonrası `keyGenerator: req => req.userId` ile per-user limit daha doğru.
- 🟧 **DTO katmanı**: Şu an Mongoose document'leri direkt JSON olarak dönüyor. Sanitize var ama bu manuel; class-transformer/zod-output-schemas tipinde formal DTO yok.
- 🟩 **Forgot password mail template**, account suspended mail template eksik.
- 🟩 **Test coverage**: `vitest run --coverage` script'i var ama threshold yok.
- 🟩 **Soft delete**: Şu an `Post.deleteMany`, `User.deleteOne` hard delete. GDPR için OK ama post'lar için soft delete + cascade flag düşünülebilir.
- 🟩 **Database transactions**: [authService.ts:286-301](services/authService.ts#L286-L301) hesap silinirken çoklu collection write var. Ortada hata olursa kısmi tutarsızlık. Mongoose `session` ve transaction sarmalı.
- 🟩 **Seed script**: `scripts/reset-admin-password.ts` var ama dev seed yok.
- 🟩 **Index sync**: deployment'ta `Model.syncIndexes()` çağrılmalı.

---

## 9. Test Edilebilirlik

- ✅ `mongodb-memory-server` + `vitest` + `supertest` — setup mükemmel.
- ✅ `tests/setup.ts` afterEach cleanup, JWT_SECRET stub, NODE_ENV='test' → rate limiter skip.
- ✅ `tests/helpers.ts` `createUser`, `createPost` fixture'ları temiz.
- ✅ Auth, posts, meetings için test var.

**Eksik test senaryoları:**
- ❌ `notificationController.createNotification` security testi yok — yani kritik açık için failing test bile yok.
- ❌ Authorization testleri zayıf: "User A, User B'nin post'unu silemez" gibi 403 testleri yok.
- ❌ `markPartnerFound` cascade testi (diğer meeting'ler cancel edildi mi) yok.
- ❌ `deleteAccount` sonrası meeting'lerin `'Deleted user'` olarak anonymize olduğu testi yok.
- ❌ `expiryDate` lazy update testi yok (ekspirasyon geçmiş post'un listing'de status='expired' olduğu).
- ❌ `cancelMeeting` + `recomputePostStatus` round-trip testi.
- ❌ Avatar upload testi (multer + dosya silme).
- ❌ Rate limiter testi (test'te skip edildiği için zaten skip).

---

## 10. Sonuç Raporu

### Güçlü Yönler
- Katmanlı mimari (route/controller/service/model) net ve tutarlı.
- Helmet, CORS whitelist, mongoSanitize, body-size limit, rate limiter — temel security stack hazır.
- Email verification + GDPR export + admin user management gibi gerçek production feature'ları mevcut.
- TypeScript `strict`, Mongoose tip güvenliği büyük ölçüde sağlanmış.
- Testler için memory-server + supertest setup hazır; auth/posts/meetings için integration testleri var.
- `errorHandler` Multer/CastError/E11000/ValidationError/JWT vakalarını ayrı ayrı yakalıyor.
- `withEmails` ile N+1 önlenmiş; meeting status state-machine guard'ları (`status: { $in: [...] }`) iyi tasarlanmış.
- Index'ler (özellikle text index ve compound `userId+isRead`) bilinçli yerleştirilmiş.

### Kritik Hatalar
1. **Yetkisiz bildirim oluşturma**: `POST /api/notifications` ([notificationController.ts:5-13](controllers/notificationController.ts#L5-L13)) — herhangi bir login olmuş kullanıcı body'de `userId` belirterek başkasına bildirim atabilir. **Spam/phishing vektörü.** ⇒ Endpoint `adminOnly` yapılsın veya tamamen kaldırılsın.
2. **JWT'deki rol DB'deki rolü override ediyor**: [authMiddleware.ts:44](middleware/authMiddleware.ts#L44) `req.userRole = decoded.role`. Admin'den düşürülen bir kullanıcı eski token'la admin endpoint'lerine erişebilir. ⇒ `req.userRole = user.role` (DB'den).
3. **Verify token plaintext**: [User.ts:17](models/User.ts#L17) DB'de plain saklanıyor. ⇒ SHA256 hash'le, kullanıcıya raw version git.

### Orta Seviye Eksikler
- Şifre sıfırlama (forgot password) flow yok.
- Refresh token yok; access token 7 gün geçerli.
- `User.password` `select: false` değil — hash leak riski.
- `withEmails` denormalization sorununu kısmen çözüyor; isim için yapmıyor → kullanıcı adı değişince stale.
- `listPosts` her çağrıda `Post.updateMany` yazıyor → cron'a taşı.
- `requestMeeting` body'de gereksiz `ownerId/ownerName/postTitle` alıyor; sunucudan türetilebilir.
- `GET /api/auth/users/:id` herhangi bir user'a başkasının email'ini sızdırıyor.
- DB transaction yok (delete/cascade work çoklu collection değiştiriyor).
- Notification list'inde pagination yok.
- Validation `if/else` zincirleri dağınık → zod/joi.
- `makeError` ve `log()` yardımcıları 3-4 dosyada kopyalanmış.

### Küçük İyileştirmeler
- `console.log/error` → `pino`/`winston` logger.
- `SALT_ROUNDS = 10` → 12.
- `JWT_SECRET` min length doğrulama (>= 32 char).
- `Date` field'ları için ayrı string tutma yerine native `Date` ([Meeting ITimeSlot](models/Meeting.ts#L11-L14)).
- `Log` modelinde `timestamp` ve `createdAt` çiftlemesi → birini sil.
- `(post as any)[field]` → tip-safe yardımcı.
- `req.userId as string` cast'leri için typed `AuthenticatedRequest`.
- ✅ `for ... await` döngüleri `bulkWrite` veya `Promise.all`'a çekilsin (markPartnerFound, deleteAccount).
- ✅ Health endpoint'i Mongo `readyState` döndürsün.
- ✅ File extension whitelist (`.jpg|.jpeg|.png|.webp|.gif`) MIME ile birlikte uygulansın.

### Eklenmesi Önerilen Özellikler
- Forgot/reset password flow (email link + tek kullanımlık hash'lenmiş token).
- Refresh token rotation veya kısa-ömür access token.
- Swagger / OpenAPI üretimi (`swagger-jsdoc` + `swagger-ui-express`).
- Per-user rate limiting (post-auth) — `keyGenerator: req => req.userId`.
- Notification pagination + filtering (read/unread/type).
- Post listing'de sorting parametresi (`?sort=interestCount|createdAt`).
- Morgan / structured request logger (audit log tamamlayıcısı).
- Mongo session/transaction (delete cascade'de atomicite).
- DTO/zod schema validation (tek yerden FE/BE tip paylaşımı).
- Coverage threshold ve daha fazla authz testi.
- `Model.syncIndexes()` deploy script'inde.
- Account lockout (X başarısız girişten sonra 15 dakika).

### Önceliklendirilmiş Yapılacaklar Listesi
1. ✅ **`POST /api/notifications` endpoint'ini `adminOnly` yap** veya kaldır — yetkisiz bildirim sızıntısı.
2. ✅ **`authMiddleware.protect` içinde `req.userRole = user.role`** olarak değiştir (DB'den, JWT'den değil).
3. ✅ **`User.verifyToken` SHA256 hash'le sakla**; verify-email endpoint'inde gelen token'ı hash'leyip karşılaştır.
4. ✅ **`User.password` schema'sına `select: false`** ekle, gerekli yerlerde `.select('+password')` ile çağır.
5. **`forgot-password` + `reset-password` flow'unu ekle.**
6. **Validation'ı zod/joi'ye geçir** (auth, post, meeting create endpoint'leri).
7. ✅ **`listPosts` lazy expiry update'ini cron'a taşı** veya kaldır + dynamic filter kullan.
8. ✅ **`makeError` ve `log()` helper'larını `utils/`'a taşı** (3 ayrı kopya birleşsin).
9. **Authorization-focused integration testleri** ekle (cross-user 403, admin-only 403).
10. **Refresh token mekanizması** veya en azından access token süresini kısalt (1-2 saat).
11. **Mongo transaction** ile `deleteAccount` ve `markPartnerFound` cascade'lerini sarmalayın.
12. ✅ **Notification list pagination** ekle.
13. **Swagger/OpenAPI** dokümanı oluştur (`API.md` manuel sürümünü değiştir).
14. **`Date` tipi tutarlılığı** (`ITimeSlot` ve `expiryDate` parse validation).
15. **`pino` veya `winston`** ile structured logging'e geç.
