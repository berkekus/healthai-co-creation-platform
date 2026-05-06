# Full-Stack Integration Review

> Branch: `backend` — Tarih: 2026-05-06

---

## Genel Durum

Temel auth, post ve meeting akışlarının mimarisi sağlam kurulmuş. Ancak **notification sistemi temelden kırık**, **PostDetailPage direkt URL'de çalışmıyor**, ve backend'de tam olan **forgot/reset password özelliği frontend'de hiç yok**. Bu 3 alan kritik kullanıcı deneyimi sorununa yol açıyor.

---

## Görev Listesi

### Kritik (Şu An Çalışmıyor)

- [x] **#1** `notificationStore.fetchByUser` — response shape uyumsuzluğu, bildirimler hiç yüklenmiyor
- [x] **#2** `notificationStore.push` — admin-only endpoint çağrılıyor, bildirimleri DB'ye kaydetmiyor
- [x] **#3** `meetingController` — hiçbir meeting olayında server-side bildirim oluşturulmuyor
- [x] **#4** `PostDetailPage` — direkt URL'de `getById` local-only, "Post not found" hatası
- [ ] **#5** Forgot/Reset Password — backend hazır, frontend sayfaları + route'lar tamamen eksik

### Önemli (Yanlış Davranış)

- [ ] **#6** `ExpressInterestModal` — meeting isteğinde post statüsünü `meeting_scheduled` yapıyor (bypass)
- [ ] **#7** `changePassword` — `PUT /auth/me/password` endpoint'i var, frontend UI yok
- [x] **#8** `Post.meetingCount` — `requestMeeting`'de güncellenmemiyor, her zaman 0 kalıyor

### Küçük / İyileştirme

- [ ] **#9** `meetingStore.fetchByUser` — `userId` query param gönderiyor, backend ignore ediyor
- [ ] **#10** `expressInterest` — duplicate önleme yok, aynı kullanıcı sonsuz kez artırabilir
- [ ] **#11** `Meeting.time_proposed` — enum'da tanımlı ama hiçbir endpoint bu statüyü setlemiyor
- [ ] **#12** `GET /notifications/unread-count` — verimli endpoint var, frontend 30s'de tüm listeyi çekiyor
- [ ] **#13** `GET /auth/me/export` — endpoint çalışıyor, ProfilePage'de download butonu yok

---

## Detaylı Problemler ve Çözümler

---

### #1 — Notification Fetch Response Shape Uyumsuzluğu

**Dosya:** `frontend/src/store/notificationStore.ts:31-32`

**Problem:**
Backend `GET /notifications` şu yapıyı döner:
```json
{ "success": true, "data": { "notifications": [...], "total": 5, "page": 1, "limit": 20, "pages": 1 } }
```
Frontend `data.data.map(normalise)` ile düz dizi bekliyor. `data.data` bir nesne olduğu için `TypeError: data.data.map is not a function` fırlatıyor. `catch {}` bloğu hatayı yutuyor → bildirimler her zaman boş görünür.

**Şu an (kırık):**
```typescript
const { data } = await api.get<{ success: boolean; data: Notification[] }>('/notifications')
set({ notifications: data.data.map(normalise) })
```

**Düzeltilmiş:**
```typescript
const { data } = await api.get<{
  success: boolean
  data: { notifications: Notification[]; total: number; page: number; limit: number; pages: number }
}>('/notifications')
set({ notifications: data.data.notifications.map(normalise) })
```

---

### #2 — `notificationStore.push()` Admin-Only Endpoint Çağırıyor

**Dosya:** `frontend/src/components/meetings/ExpressInterestModal.tsx:102`
**Dosya:** `frontend/src/store/notificationStore.ts:60-73`

**Problem:**
`POST /notifications` endpoint'i `adminOnly` middleware ile korunuyor. `ExpressInterestModal` regular user olarak çağırınca 403 alır. `push()` içindeki `catch {}` bloğu hatayı yutar ve bildirimi **sadece local state'e** kaydeder. Sayfa yenilenince kaybolur. Post sahibi hiç gerçek bildirim almaz.

**Şu an (kırık) — ExpressInterestModal.tsx:93-107:**
```typescript
await request(...)
update(post.id, { status: 'meeting_scheduled' })  // await yok + yanlış mantık
push({ userId: user.id, type: 'meeting_request', ... })  // 403 — silent fail
onSuccess()
```

**Düzeltilmiş:**
```typescript
await request(...)
onSuccess()
// Bildirim oluşturma server-side yapılacak (#3)
```

---

### #3 — Meeting Olaylarında Server-Side Bildirim Yok

**Dosya:** `backend/controllers/meetingController.ts`

**Problem:**
`requestMeeting`, `acceptMeeting`, `declineMeeting`, `cancelMeeting`, `completeMeeting` — hiçbiri `notificationService.pushNotification()` çağırmıyor. Tüm bildirim akışı frontend'e bırakılmış ama frontend bunu yapamıyor (admin-only). Kullanıcılar birbirinin toplantı taleplerini, kabullerini ve iptallerini asla haberdar olamıyor.

**Eklenecek çağrılar:**

`requestMeeting` — `log(...)` satırından sonra:
```typescript
notificationService.pushNotification({
  userId: post.authorId.toString(),
  type: 'meeting_request',
  title: 'New collaboration request',
  body: `${requester.name} has expressed interest in "${post.title}"`,
  linkTo: '/meetings',
}).catch(() => {})
```

`acceptMeeting` — `log(...)` satırından sonra:
```typescript
notificationService.pushNotification({
  userId: meeting.requesterId.toString(),
  type: 'meeting_accepted',
  title: 'Meeting request accepted',
  body: `Your request for "${meeting.postTitle}" has been accepted`,
  linkTo: '/meetings',
}).catch(() => {})
```

`declineMeeting` — `log(...)` satırından sonra:
```typescript
notificationService.pushNotification({
  userId: meeting.requesterId.toString(),
  type: 'meeting_declined',
  title: 'Meeting request declined',
  body: `Your request for "${meeting.postTitle}" was not accepted`,
  linkTo: '/meetings',
}).catch(() => {})
```

`cancelMeeting` — `log(...)` satırından sonra (iptal eden tarafın karşısına bildir):
```typescript
const notifyUserId = req.userId === meeting.requesterId.toString()
  ? meeting.ownerId.toString()
  : meeting.requesterId.toString()
notificationService.pushNotification({
  userId: notifyUserId,
  type: 'meeting_cancelled',
  title: 'Meeting cancelled',
  body: `The meeting for "${meeting.postTitle}" has been cancelled`,
  linkTo: '/meetings',
}).catch(() => {})
```

`meetingController.ts`'in başına import ekle:
```typescript
import * as notificationService from '../services/notificationService'
```

---

### #4 — `PostDetailPage` Direkt URL'de Çalışmıyor

**Dosya:** `frontend/src/pages/posts/PostDetailPage.tsx:41`
**Dosya:** `frontend/src/store/postStore.ts:95`

**Problem:**
```typescript
// postStore.ts:95
getById: (id) => get().posts.find(p => p.id === id)
```
Sadece local state'te arar, API çağrısı yapmaz. Kullanıcı `/posts/abc123`'e direkt gittiğinde veya sayfayı yenilediğinde posts henüz yüklenmemiş → `post = undefined` → "Post not found" gösterir.

**Şu an (kırık) — PostDetailPage.tsx:41:**
```typescript
const post = getById(id ?? '')
if (!post) { return <PostNotFoundUI /> }
```

**Düzeltilmiş:**
```typescript
import { useState, useEffect } from 'react'
import api from '../../lib/api'
import type { Post } from '../../types/post.types'

// component içinde:
const { id } = useParams<{ id: string }>()
const { getById } = usePostStore()
const [post, setPost] = useState<Post | undefined>(getById(id ?? ''))
const [isLoading, setIsLoading] = useState(!post)

useEffect(() => {
  if (post || !id) return
  setIsLoading(true)
  api.get<{ success: boolean; data: Post & { _id?: string } }>(`/posts/${id}`)
    .then(({ data }) => {
      const raw = data.data
      setPost({ ...raw, id: raw._id ?? raw.id })
    })
    .catch(() => {})
    .finally(() => setIsLoading(false))
}, [id])

if (isLoading) return <LoadingSpinner />
if (!post) return <PostNotFoundUI />
```

---

### #5 — Forgot Password / Reset Password Frontend Eksik

**İlgili dosyalar:**
- `frontend/src/router/AppRouter.tsx` — route yok
- `frontend/src/constants/routes.ts` — path tanımlı değil
- `frontend/src/pages/auth/` — sadece Login, Register, VerifyEmail var
- `backend/.env` — `APP_BASE_URL=http://localhost:5173`

**Problem:**
Backend `POST /auth/forgot-password` ve `POST /auth/reset-password` çalışıyor. Reset email'i `http://localhost:5173/reset-password?token=...` linkiyle gönderiliyor. Bu URL frontend'de 404 döner — kullanıcı şifresini sıfırlayamaz.

**Yapılacaklar:**

1. `frontend/src/constants/routes.ts`'e ekle:
```typescript
FORGOT_PASSWORD: '/forgot-password',
RESET_PASSWORD:  '/reset-password',
```

2. `frontend/src/pages/auth/ForgotPasswordPage.tsx` oluştur — email form, `api.post('/auth/forgot-password', { email })` çağrısı

3. `frontend/src/pages/auth/ResetPasswordPage.tsx` oluştur — URL'den `?token=` oku, yeni şifre formu, `api.post('/auth/reset-password', { token, newPassword })` çağrısı

4. `AppRouter.tsx`'e route'ları ekle:
```typescript
<Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
<Route path={ROUTES.RESET_PASSWORD}  element={<ResetPasswordPage />} />
```

5. `LoginPage.tsx`'e "Forgot password?" linki ekle

---

### #6 — `ExpressInterestModal` Post Statüsünü Bypass Ediyor

**Dosya:** `frontend/src/components/meetings/ExpressInterestModal.tsx:101`

**Problem:**
```typescript
update(post.id, { status: 'meeting_scheduled' })  // await yok
```
Meeting isteği gönderildiğinde post `meeting_scheduled` yapılıyor ama toplantı henüz sadece `pending`. Post sahibi henüz kabul etmedi. `await` da yok — hata sessizce kaybolur.

**Düzeltilmiş:** Bu satırı sil. `meeting_scheduled` statüsü ya `acceptMeeting` sırasında backend'de setlenmeli ya da bu statüs kaldırılmalı.

---

### #7 — `changePassword` Frontend UI Yok

**Backend endpoint:** `PUT /auth/me/password` — `{ oldPassword, newPassword }` bekliyor, çalışıyor.
**Frontend:** `authStore`'da action yok, `ProfilePage`'de form yok.

**Yapılacak:** `ProfilePage.tsx`'e "Change Password" bölümü ekle:
```typescript
// authStore.ts'e ekle:
changePassword: async (oldPassword: string, newPassword: string) => {
  await api.put('/auth/me/password', { oldPassword, newPassword })
},
```

---

### #8 — `Post.meetingCount` Güncellemiyor

**Dosya:** `backend/controllers/meetingController.ts:48-62` (requestMeeting)
**Model:** `backend/models/Post.ts` — `meetingCount: Number` field var

**Problem:** `requestMeeting` başarılı olduğunda `post.meetingCount` artırılmıyor. Dashboard veya post card'da bu sayı gösteriliyorsa her zaman 0 görünür.

**Düzeltilmiş:**
```typescript
// meetingController.ts — requestMeeting, meeting oluşturulduktan sonra:
await Post.findByIdAndUpdate(postId, { $inc: { meetingCount: 1 } })
```

---

### #9 — `meetingStore.fetchByUser()` Gereksiz `userId` Param Gönderiyor

**Dosya:** `frontend/src/store/meetingStore.ts:27`

**Problem:**
```typescript
api.get('/meetings', { params: { userId } })
```
Backend `GET /meetings`'de `userId` query param kullanılmıyor — `req.userId` (JWT'den) kullanılıyor. Param gönderilmesi zararsız ama yanıltıcı.

**Düzeltilmiş:**
```typescript
api.get('/meetings')
```

---

### #10 — `expressInterest` Duplicate Önleme Yok

**Dosya:** `backend/controllers/postController.ts` — `expressInterest`
**Model:** `backend/models/Post.ts`

**Problem:** `POST /posts/:id/interest` her çağrıda `interestCount`'u artırıyor. Aynı kullanıcı defalarca basabilir. Kimin interest ettiği hiç kaydedilmiyor.

**Çözüm seçenekleri:**
- Post modeline `interestedUserIds: [{ type: ObjectId, ref: 'User' }]` ekle, upsert/addToSet kullan
- Ya da sadece `expressInterest` endpoint'ine kullanıcı başına rate limit ekle

---

### #11 — `Meeting.time_proposed` Status Kullanılmıyor

**Dosya:** `backend/models/Meeting.ts`

**Problem:** `status` enum'unda `time_proposed` tanımlı ama hiçbir controller bu statüyü setlemiyor. Geçiş: `pending → confirmed/declined/cancelled` şeklinde çalışıyor.

**Düzeltilmiş:** Bu statüsü kullanacak bir endpoint ekle veya enum'dan kaldır.

---

## API Uyumsuzluk Tablosu

| Frontend İsteği | Backend Endpoint | Problem | Çözüm |
|---|---|---|---|
| `GET /notifications` → `data.data.map()` | `GET /notifications` → `{data:{notifications:[], total, ...}}` | Frontend array bekliyor, object geliyor | `data.data.notifications.map()` kullan |
| `POST /notifications` (regular user) | `POST /notifications` (adminOnly) | 403 — silent fail | Satırı sil, server-side bildirim yap |
| Yok | `GET /posts/:id` | PostDetailPage bu endpoint'i hiç çağırmıyor | `useEffect` ile API çağrısı ekle |
| `GET /meetings?userId=...` | `GET /meetings` | `userId` param ignored, JWT kullanılıyor | Params'ı gönderme |
| Yok | `POST /auth/forgot-password` | Frontend sayfası yok | `ForgotPasswordPage` oluştur |
| Yok | `POST /auth/reset-password` | Frontend sayfası + route yok | `ResetPasswordPage` oluştur |
| Yok | `PUT /auth/me/password` | Store action yok, UI yok | authStore'a ekle, ProfilePage'de form |

---

## Öncelik Sırası

| Öncelik | # | Tahmini Süre |
|---|---|---|
| 🔴 Kritik | #1 notificationStore response fix | 5 dk |
| 🔴 Kritik | #2 + #3 push() kaldır + server-side bildirim | 30 dk |
| 🔴 Kritik | #4 PostDetailPage API çağrısı | 15 dk |
| 🔴 Kritik | #5 Forgot/Reset Password sayfaları | 45 dk |
| 🟠 Önemli | #6 ExpressInterestModal status bypass kaldır | 5 dk |
| 🟠 Önemli | #7 changePassword UI | 20 dk |
| 🟠 Önemli | #8 meetingCount güncelleme | 5 dk |
| 🟡 Küçük | #9 meetingStore userId param | 2 dk |
| 🟡 Küçük | #10 expressInterest duplicate | 20 dk |
| 🟡 Küçük | #11 time_proposed cleanup | 10 dk |
