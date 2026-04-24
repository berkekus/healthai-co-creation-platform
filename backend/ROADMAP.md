# Backend Roadmap — Frontend Uyumlu Entegrasyon

Bu doküman, `backend/` klasörünün `frontend/` ile tam uyumlu çalışabilmesi için adım adım izlenecek yol haritasıdır. Her adımın sonunda frontend'in ilgili bölümü end-to-end çalışır durumda olmalıdır.

---

## 0. Genel İlkeler (Tüm Adımlar İçin Geçerli)

Frontend beklentilerini sabit olarak tut:

- **Base URL:** `http://localhost:5000/api` (frontend `VITE_API_URL` ile override edebilir)
- **Response formatı:** TÜM endpoint'ler şu sözleşmeye uymalı:
  ```json
  { "success": true, "data": <payload> }
  ```
  Hata durumunda:
  ```json
  { "success": false, "message": "açıklama" }
  ```
- **Auth:** `Authorization: Bearer <token>` header'ı. Token `localStorage` içinde tutulur.
- **ID normalizasyonu:** Mongo `_id` döner → frontend `_id` veya `id` alanını okuyor. Her ikisini de gönder (frontend zaten `normalise()` ile çeviriyor ama tutarlılık için `id` alias'ı ekle).
- **CORS:** `http://localhost:5173` (dev) ve `http://localhost:4173` (preview) izinli olmalı — zaten `src/index.ts` içinde var.
- **Tarihler:** ISO string olarak dön (`toISOString()`), frontend `Date` parse etmiyor — string bekliyor.

---

## 1. Ortam Kurulumu (Environment Setup)

### 1.1 `.env` dosyası oluştur
`backend/.env` (gitignore'a eklenmeli):
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/healthai
JWT_SECRET=<uzun-random-string>
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### 1.2 Frontend `.env` ile eşleştir
`frontend/.env` içinde:
```
VITE_API_URL=http://localhost:5000/api
```

### 1.3 `npm install` ve MongoDB başlat
- MongoDB local'de veya Atlas'ta ayağa kalkmış olmalı.
- `npm run dev` ile backend 5000 portunda çalışmalı.
- `curl http://localhost:5000/health` → `{ "status": "ok", ... }` döndürmeli.

**Doğrulama:** Frontend `npm run dev` ile ayağa kalkınca `/login` sayfası 401 değil network error almamalı.

---

## 2. Authentication — `/api/auth/*`

Frontend `authStore.ts` şu endpoint'leri çağırıyor:

| Endpoint | Method | Body | Response (`data`) |
|----------|--------|------|-------------------|
| `/auth/register` | POST | `RegisterData` | `{ user: User }` |
| `/auth/login` | POST | `{ email, password }` | `{ user: User, token: string }` |
| `/auth/me` | GET | — | `User` |
| `/auth/me/profile` | PUT | `Partial<User>` | `User` |
| `/auth/users` | GET | — (admin) | `User[]` |
| `/auth/users/:id` | GET | — | `User` |
| `/auth/users/:id/suspend` | PUT | `{ isSuspended }` | `User` |

### 2.1 `User` model (hazır) — `models/User.ts`
Frontend `User` tipi ile birebir uyumlu olmalı. Kontrol et:
- `id` (Mongo'da `_id`) — response'ta `id` olarak da ekle
- `createdAt`, `lastActive` → ISO string
- `password` asla response'ta dönmesin (`.select('-password')` kullan)

### 2.2 `authController.ts` — bakılacaklar
- `register`: bcrypt ile hash, default `role`'u doğrula (enum), duplicate email 409 dönsün.
- `login`: bcrypt.compare, başarılıysa JWT sign et (`{ id, role }` payload).
- `getMe`: `req.user.id`'den `findById(...).select('-password')`.
- `updateProfile`: sadece `name, institution, city, country, bio, expertiseTags` güncellenebilir. Role ve email dokunulmaz.
- `setSuspended`: admin-only, request body'den `isSuspended: boolean`.

### 2.3 `authMiddleware.ts`
- `protect`: header'dan token çıkar, `jwt.verify`, `req.user = { id, role }` set et.
- `adminOnly`: `protect` sonrası çağrılır, `req.user.role === 'admin'` değilse 403.

**Doğrulama:**
1. Frontend `/register` formundan kullanıcı oluştur.
2. `/login` ile giriş yap → token localStorage'a yazılmalı.
3. Sayfa refresh → `hydrate()` → `/auth/me` başarılı, kullanıcı hâlâ giriş yapmış görünmeli.
4. Profil sayfasında bilgi güncelle → persist olmalı.

---

## 3. Posts — `/api/posts/*`

Frontend `postStore.ts` şu endpoint'leri çağırıyor:

| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/posts` | GET | — | `Post[]` |
| `/posts` | POST | `PostCreateData + authorName + authorRole` | `Post` |
| `/posts/:id` | PUT | `Partial<Post>` | `Post` |
| `/posts/:id/publish` | POST | — | `Post` |
| `/posts/:id/partner-found` | POST | — | `Post` |
| `/posts/:id` | DELETE | — | `{ success: true }` |

### 3.1 `Post` model kontrol
Frontend `post.types.ts` şu alanları bekliyor (en az):
- `id`, `title`, `description`, `domain`, `expertiseRequired`
- `city`, `country`, `projectStage`, `status`, `authorId`, `authorName`, `authorRole`
- `createdAt`, `updatedAt` (ISO string)

### 3.2 Business kurallar
- `createPost`: `authorId`'yi token'dan (`req.user.id`) al, **client'tan GELEN authorId'ye güvenme**.
- `updatePost`: sadece author veya admin düzenleyebilir.
- `publishPost`: `status: 'draft' → 'published'`, sadece author.
- `markPartnerFound`: `status: 'partner_found'`, sadece author.
- `deletePost`: author veya admin.
- `listPosts`: query param ile filtre desteği (opsiyonel; frontend client-side filtreliyor, ama büyük datasetler için server-side ekle).

**Doğrulama:**
1. Frontend'de yeni post oluştur → listede görünmeli.
2. Refresh → `fetchPosts()` ile liste geri gelmeli.
3. Post'u başka kullanıcı olarak silmeye çalış → 403 almalı.

---

## 4. Meetings — `/api/meetings/*`

Frontend `meetingStore.ts` beklentileri:

| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/meetings?userId=...` | GET | — | `Meeting[]` |
| `/meetings` | POST | `{ postId, postTitle, requesterName, ownerId, ownerName, message, ndaAccepted, proposedSlots }` | `Meeting` |
| `/meetings/:id/accept` | POST | `{ slot: TimeSlot }` | `Meeting` |
| `/meetings/:id/decline` | POST | — | `Meeting` |
| `/meetings/:id/cancel` | POST | — | `Meeting` |

### 4.1 `Meeting` model kontrol
Frontend `meeting.types.ts` şu alanları bekliyor:
- `id`, `postId`, `postTitle`, `requesterId`, `requesterName`, `ownerId`, `ownerName`
- `message`, `ndaAccepted`, `proposedSlots: TimeSlot[]`, `selectedSlot?: TimeSlot`
- `status: 'pending' | 'accepted' | 'declined' | 'cancelled'`
- `createdAt`

### 4.2 Business kurallar
- `request`: `requesterId = req.user.id`, `ownerId`'yi post'tan doğrula (post.authorId ile eşleşmeli).
- `accept`: sadece `ownerId === req.user.id`, status `pending → accepted`, `selectedSlot` set et.
- `decline`: sadece owner, status `pending → declined`.
- `cancel`: requester veya owner, status → `cancelled`.
- `list (GET)`: sadece `req.user.id` requester veya owner olduğu meeting'leri döndür.

### 4.3 Notification tetikleme (adım 5 ile entegre)
Her state değişiminde ilgili kullanıcıya notification oluştur:
- `request` → owner'a "Yeni toplantı isteği"
- `accept` → requester'a "Toplantı kabul edildi"
- `decline` → requester'a "Toplantı reddedildi"
- `cancel` → karşı tarafa "Toplantı iptal edildi"

**Doğrulama:**
1. İki farklı hesapla (A: engineer, B: healthcare_professional) post aç → meeting request gönder.
2. B hesabına geçip `/meetings` sayfasında isteği gör → kabul et.
3. A hesabında seçilen slot görünmeli, status "accepted".

---

## 5. Notifications — `/api/notifications/*`

Frontend `notificationStore.ts` beklentileri:

| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/notifications` | GET | — | `Notification[]` (sadece `req.user.id`'e ait) |
| `/notifications` | POST | `Omit<Notification, 'id'\|'createdAt'>` | `Notification` |
| `/notifications/:id/read` | POST | — | `Notification` |
| `/notifications/mark-all-read` | POST | — | `{ success: true }` |

### 5.1 `Notification` model kontrol
- `id`, `userId`, `type`, `title`, `message`, `link?`, `isRead`, `createdAt`

### 5.2 Business kurallar
- `GET /notifications`: sadece `req.user.id`'in kendi bildirimleri, `createdAt` desc sıralı.
- `markRead`: sadece sahip okuyabilir (`userId === req.user.id`).
- `markAllRead`: `updateMany({ userId: req.user.id }, { isRead: true })`.
- İç tetikleyiciler (adım 4'teki gibi) `notificationService.create(...)` üzerinden çağırsın — controller üzerinden değil.

**Doğrulama:**
1. Meeting request gönderildiğinde karşı kullanıcının notification sayısı 1 artmalı.
2. `markAllRead` sonrası unreadCount = 0 olmalı.

---

## 6. Logs — `/api/logs/*`

Frontend ne çağırıyor kontrol et — muhtemelen sadece admin panel için.

### 6.1 Kurallar
- Tüm `/logs` endpoint'leri `adminOnly`.
- Kritik eylemleri `logService.create()` ile audit trail'e yaz:
  - login/logout, register
  - post create/delete/publish
  - user suspend/unsuspend
  - meeting accept/decline

**Doğrulama:** Admin paneline gir → log listesi doluyor mu?

---

## 7. Error Handling & Response Tutarlılığı

### 7.1 `errorHandler.ts` kontrolü
- Mongoose `ValidationError` → 400 + `{ success: false, message }`
- Mongoose `CastError` → 400 "Invalid ID"
- Duplicate key (11000) → 409 "Already exists"
- JWT errors → 401
- Her else → 500

### 7.2 Controller wrapper
Try/catch tekrarını azaltmak için `asyncHandler` util:
```ts
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)
```

### 7.3 Response helper
```ts
export const ok = (res, data, status = 200) =>
  res.status(status).json({ success: true, data })
```
Tüm controller'ları bu helper'a geçir — frontend sözleşmesi zaten buna bağlı.

---

## 8. Güvenlik & Sertleştirme

- [ ] `bcrypt` salt rounds ≥ 10
- [ ] JWT secret `.env`'den, production'da 256-bit random
- [ ] Rate limiting (`express-rate-limit`) en azından `/auth/login` ve `/auth/register` için
- [ ] `helmet()` middleware ekle (`npm i helmet`)
- [ ] Input validation — `zod` veya `express-validator` ile register/login/post body'leri doğrula
- [ ] Password min length 8, email regex kontrolü
- [ ] Mongo injection koruması — `mongoose` otomatik cast ediyor ama `$where` gibi operatörleri stripla
- [ ] `.env` git'e düşmesin (`.gitignore` kontrol)

---

## 9. Test & Dokümantasyon

### 9.1 Smoke test scripti
`backend/scripts/smoke.ts` — tüm endpoint'leri sırayla çağıran bir script:
1. Register → 2. Login → 3. /me → 4. Create post → 5. Request meeting → vs.
Her adım `console.log` ile doğrula.

### 9.2 API dokümanı
`backend/API.md` dosyasında endpoint tablosu + örnek request/response. Frontend geliştirirken tek bakış kaynağı olsun.

### 9.3 (Opsiyonel) Postman/Thunder Client collection
`backend/docs/postman.json` — frontend olmadan manuel test için.

---

## 10. Son Entegrasyon Testi (Full E2E)

Her iki servis ayağa kalktıktan sonra şu flow'u çalıştır:

1. **Register** — engineer (A) ve healthcare_professional (B) hesapları
2. **Login** (A) → Post oluştur → publish et
3. **Login** (B) → Feed'de A'nın postunu gör → meeting request gönder (NDA kabul)
4. **Login** (A) → Notification gör → Meeting'i kabul et (slot seç)
5. **Login** (B) → Notification gör → accepted meeting'i detayda gör
6. **Login** (Admin) → Users list, logs, suspend B
7. **Login** (B) → Suspended kullanıcı login olamamalı / action atamamalı

Bu senaryonun tamamı hatasız geçiyorsa backend-frontend entegrasyonu **production-ready**.

---

## Öncelik Sırası (TL;DR)

1. **Kritik yol:** Adım 1 → 2 (auth) → 3 (posts) — frontend'in ilk açılışı için yeterli.
2. **Orta öncelik:** 4 (meetings) + 5 (notifications) — birbirine bağlı, beraber yap.
3. **Son:** 6 (logs), 7-8 (cilalama), 9-10 (test).

Her adımı **tamamlayıp frontend'de doğruladıktan sonra** bir sonraki adıma geç. Adımları paralel yapma — her seviyede frontend canlı çalışır durumda olmalı.

---

# Current Gaps — Mevcut Kod Denetimi (2026-04-24)

Backend kodu frontend'deki tüm store'lar, tipler ve UI beklentileriyle karşılaştırıldı. Aşağıdaki liste *gerçek koddaki* eksikler ve uyumsuzluklar — öncelik sırasına göre.

## 🔴 P0 — Frontend'i doğrudan etkileyen hatalar

### 1. `incrementMeetingCount` post durumunu yanlış yönetiyor
- **Nerede:** `services/postService.ts:104-109` + `services/meetingService.ts:27`
- **Sorun:** Her meeting request'te post `status: 'meeting_scheduled'` yapılıyor. Meeting decline/cancel olsa bile post bu durumda kalıyor; `partner_found` post'a bile yeni request gelince geri "meeting_scheduled"a dönüyor.
- **Fix:** Durumu yalnızca meeting `confirmed` olduğunda `meeting_scheduled` yap. Accept/Decline/Cancel flow'unda post durumunu yeniden değerlendiren `recomputePostStatus(postId)` helper'ı yaz.
- **Frontend etkisi:** `PostCard` / `PostDetailPage`'de yanlış rozet; feed filtresi "active" post'ları kaçırır.

### 2. Log action isimleri tutarsız — admin UI kritik eventleri göremiyor
- **Nerede:** `frontend/src/pages/admin/AdminPage.tsx:23-29` vs `controllers/authController.ts:39`
- **Sorun:** Frontend `CRITICAL_ACTIONS` seti `LOGIN_FAILED`, `USER_SUSPENDED`, `POST_REMOVED_BY_ADMIN` bekliyor (UPPERCASE). Backend `login`, `user_suspend`, `post_delete` yazıyor (snake_case). Hiç eşleşmiyor.
- **Fix:** `backend/constants/logActions.ts` oluştur, hem backend hem frontend aynı sözlüğü import etsin. Tercih: snake_case'i baz al, frontend'teki seti güncelle.

### 3. Login/register FAILURE log'u hiç atılmıyor
- **Nerede:** `controllers/authController.ts:49-69`
- **Sorun:** Controller yalnızca `result: 'success'` yazıyor. `loginUser` hata fırlatınca `next(err)`'e düşüp log atılmadan bitiyor.
- **Fix:** `try { ... } catch (err) { createLog({ action: 'login_failed', result: 'failure', ... }); next(err) }` — register için aynı.
- **Frontend etkisi:** Admin panelindeki "Security events" sayacı sürekli 0 gösterir.

### 4. `GET /posts` yayınlanmamış draft'ları herkese açıyor
- **Nerede:** `services/postService.ts:46-64`
- **Sorun:** Filtre verilmediğinde tüm statüler dönüyor (draft dâhil).
- **Fix:** Default `status: { $ne: 'draft' }`. Kullanıcı kendi draft'larını istiyorsa `?mine=true` + token sahibiyle eşleştir.

### 5. Meeting listesi yetkisiz erişime açık
- **Nerede:** `controllers/meetingController.ts:62-71`
- **Sorun:** `GET /meetings?postId=X` → `getMeetingsByPost` herkese dönüyor. Post sahibi olmayan biri tüm request'leri okuyabilir.
- **Fix:** `postId` query'li erişimde `post.authorId === req.userId` kontrolü, değilse 403.

## 🟠 P1 — Eksik / yarım kalmış özellikler

### 6. "Partner found" bildirimi tetiklenmiyor
- **Nerede:** `services/postService.ts:86-94`
- **Sorun:** `markPartnerFound` hiçbir bildirim/side-effect atmıyor. `partner_found` notification tipi modelde tanımlı ama hiç kullanılmıyor.
- **Fix:** O post'a meeting request atmış diğer kullanıcılara `partner_found` bildirimi + pending meeting'leri `cancelled`'a çevir.

### 7. "Interest" (ilgi gösterme) backend endpoint'i yok
- **Nerede:** `types/post.types.ts:26` + `components/meetings/ExpressInterestModal.tsx`
- **Sorun:** `Post.interestCount` alanı ve frontend modalı var; `POST /posts/:id/interest` yok.
- **Fix:** `POST /posts/:id/interest` → `$inc: { interestCount: 1 }` + `interest_received` notification tipi + log.

### 8. Post expiry otomasyonu yok
- **Nerede:** `models/Post.ts:22`
- **Sorun:** `expiryDate` saklanıyor ama geçmiş post'lar `expired`'a çevrilmiyor.
- **Fix:** MVP: `listPosts` içinde `expiryDate < now && status='active'` olanları virtually `expired` göster. İleride: hafif cron (`node-cron`) veya TTL index.

### 9. `lastActive` yalnızca login'de güncelleniyor
- **Nerede:** `services/authService.ts:76-77`
- **Sorun:** Admin panelinin "Last active" kolonu bu değere bakıyor; kullanıcı login olmadan 30 gün aktif kullansa bile "1 ay önce" gözükür.
- **Fix:** `protect` middleware'ine 5 dakikalık throttle'lu `$set: { lastActive: new Date() }` ekle.

### 10. Suspend sonrası mevcut JWT geçerli kalıyor
- **Nerede:** `middleware/authMiddleware.ts:29-37`
- **Sorun:** `protect` suspended kullanıcıyı engelliyor ama token hâlâ 7 gün geçerli — her request'te DB lookup olduğu için pratikte blok var, ancak token invalidation yok.
- **Fix:** `User.tokenVersion` alanı ekle, JWT payload'a koy, suspend/logout'ta artır. MVP'de mevcut yeterli ama belgelensin.

### 11. Notification silme / arşivleme yok
- **Nerede:** `routes/notificationRoutes.ts`
- **Sorun:** Kullanıcı bildirim temizleyemiyor, sonsuza kadar birikir.
- **Fix:** `DELETE /notifications/:id` + `DELETE /notifications` (bulk) + frontend'e "Clear all" butonu.

### 12. `/notifications/unread-count` var ama frontend kullanmıyor
- **Nerede:** `controllers/notificationController.ts:28-35` + `store/notificationStore.ts:31`
- **Sorun:** Frontend client-side sayıyor → pagination geldiğinde yanlış olur.
- **Fix:** Frontend `unreadCount`'u server'dan çeksin; polling interval'e bağla.

## 🟡 P2 — İyileştirmeler / sertleştirme

### 13. `listPosts` server-side pagination yok
- **Sorun:** `Post.find(query).sort(...)` tüm kayıtları döner. 1000+ post'ta frontend çöker.
- **Fix:** `?page=1&limit=20` → response `{ posts, total, page, limit }`. (Logs endpoint'iyle aynı kontrat.)

### 14. Rate limiter yalnızca `/auth` altında
- **Nerede:** `src/index.ts:48`
- **Fix:** Post create (günde 50), meeting request (saatte 10), notification create (dakikada 30) için ayrı limiter'lar.

### 15. Admin `getAllUsers` paginationsız ve admin'leri filtrelemiyor
- **Nerede:** `services/authService.ts:110-113`
- **Fix:** `?page&limit&role&search` destekle; admin rolündekileri default gizle.

### 16. Email doğrulama akışı boş
- **Nerede:** `models/User.ts:37` + `pages/auth/VerifyEmailPage.tsx`
- **Sorun:** `isVerified` ve `VerifyEmailPage` var, ama email gönderme veya doğrulama endpoint'i yok.
- **Fix (iki seviye):**
  - MVP: Otomatik `isVerified: true` + `VerifyEmailPage` route'unu kaldır.
  - Prod: Nodemailer/Resend + `emailVerificationToken` + `POST /auth/request-verify` + `GET /auth/verify-email/:token`.

### 17. Register response'taki token kullanılmıyor
- **Nerede:** `store/authStore.ts:60-68`
- **Sorun:** Backend token dönüyor, frontend atıyor, sonra login'e yönlendiriyor — tutarsız UX.
- **Fix:** Ya auto-login (token'ı store'a yaz), ya backend register'dan token dönmesin. Karar madde 16'ya bağlı.

### 18. Profil avatar/görseli yok
- **Sorun:** `User` modelinde `avatarUrl` yok; `ProfilePage` sadece initial gösteriyor.
- **Fix:** Önce `avatarUrl: String` eklentisiyle dış URL kabul et. Upload istenirse multer + Cloudinary/S3.

### 19. Notifications real-time değil
- **Sorun:** Meeting accept gibi eventleri görmek için refresh gerekiyor.
- **Fix:** Socket.io veya SSE. MVP: `notificationStore`'a 30s polling.

### 20. Global `asyncHandler` / response helper yok
- **Sorun:** Her controller aynı `try/catch` kalıbını tekrarlıyor.
- **Fix:** `utils/asyncHandler.ts` + `utils/response.ts` → tüm controller'ları refactor et.

### 21. Password change / reset endpoint'i yok
- **Fix:** `PUT /auth/me/password` (oldPassword + newPassword). Forgot-password email akışını madde 16 ile birlikte kur.

## 🟢 P3 — DX / belgeleme

### 22. `.env.example` dosyası yok
Sadece ROADMAP'te anlatılıyor. Ekle.

### 23. `API.md` yok
Endpoint tablosu + örnek request/response tek bakışta görülsün.

### 24. Smoke test scripti yok
`backend/scripts/smoke.ts` — register→login→me→createPost→requestMeeting→accept.

### 25. Docker Compose'dan MongoDB kaldırıldı, setup belgesi eksik
Son commit `e853ac8` MongoDB service'ini kaldırmış. README'de "Atlas URI veya host MongoDB gerekli" notu olmalı.

---

## Uygulama Sırası

1. **Bu hafta:** 1, 2, 3, 4, 5 — küçük fix, büyük etki.
2. **Sonraki sprint:** 6, 7, 8, 11 — yarım kalmış özellikler.
3. **Cilalama:** 9, 13, 14, 15, 20.
4. **Kapsam kararı gerektirir:** 16, 17, 18, 19, 21.
