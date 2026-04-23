# FRONTEND ARCHITECTURE — HEALTH AI Co-Creation Platform
> Bu dosya projenin **gerçek** klasör yapısı, isimlendirme kuralları, tasarım sistemi ve bileşen mimarisi sözleşmesini tanımlar.
> Her yeni dosya, bileşen veya hook bu kurallara uygun üretilir. Çelişki olursa bu dosya kaynak doğrudur; diğer planlama belgeleri buna göre güncellenir.

_Son güncelleme: 2026-04-20 — Faz 0 → Faz 9 tamamı implement edildi, tipografi Plus Jakarta Sans + Source Sans 3'e geçti, navbar premium micro-interaction sistemi yerleşti._

---

## 1. Tech Stack (mevcut sürümler)

| Katman         | Teknoloji                           | Versiyon           |
|----------------|-------------------------------------|--------------------|
| Framework      | React                               | 18.3.1             |
| Dil            | TypeScript (strict)                 | 5.7.2              |
| Build          | Vite                                | 6.4.2              |
| Stil           | Tailwind CSS + PostCSS + Autoprefixer | 3.4.17 / 8.4.49 / 10.4.20 |
| Routing        | React Router                        | 6.30.3             |
| State          | Zustand (+ localStorage persist)    | 5.0.12             |
| Form           | React Hook Form + Zod               | 7.72.1 / 4.3.6     |
| Resolver       | `@hookform/resolvers`               | 5.2.2              |
| İkon           | Material Symbols Outlined (Google Fonts) + `lucide-react` | 0.469.0 |
| Tip            | `@types/react`, `@types/react-dom`  | 18.3+              |

**Mocked backend:** Demo için backend yok. Zustand slice'ları `localStorage`'a persist eder, `data/mock*.ts` seed dosyaları ilk yüklemeyi sağlar. Servis katmanı ilerde eklendiğinde sadece store action'ları patch edilecek — bileşenler değişmeyecek.

---

## 2. Gerçek Klasör Yapısı (`src/`)

Aşağıdaki ağaç, kod tabanında fiilen var olan durumu yansıtır. Eski planlama doc'larında geçen `services/`, `hooks/`, `assets/`, `components/admin/`, `components/notifications/` klasörleri şu anda **yok** — ihtiyaç duyulduğunda eklenecek.

```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx       # Authenticated shell (Navbar + <Outlet> + Footer + modaller)
│   │   ├── LandingShell.tsx    # Public marketing shell (LandingPage'i sarar)
│   │   ├── Navbar.tsx          # Authenticated app navbar (premium hover + profile dropdown + bildirim bell'i)
│   │   ├── Footer.tsx          # Compact plum footer (auth shell)
│   │   └── PageWrapper.tsx     # maxWidth + padTop prop'lu responsive sayfa konteyneri
│   │
│   ├── posts/
│   │   ├── PostCard.tsx        # Directory card (match reason chips + featured mode)
│   │   ├── PostStatusBadge.tsx # Pill badge (hai-* tone eşlemeleri)
│   │   └── PostFormFields.tsx  # PostCreatePage + PostEditPage için paylaşılan 4-section form
│   │
│   ├── meetings/
│   │   ├── MeetingCard.tsx
│   │   └── ExpressInterestModal.tsx
│   │
│   └── ui/
│       ├── FormField.tsx        # Ortak `inputStyle` helper + field wrapper
│       ├── Skeleton.tsx         # Skeleton primitives (PostCardSkeleton dahil)
│       ├── CookieConsentBanner.tsx
│       └── SessionTimeoutModal.tsx
│
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx     # 3-step wizard
│   │   └── VerifyEmailPage.tsx
│   ├── dashboard/
│   │   └── DashboardPage.tsx
│   ├── posts/
│   │   ├── PostListPage.tsx     # Debounced search + "Best matches for you" + city quick-toggle
│   │   ├── PostDetailPage.tsx
│   │   ├── PostCreatePage.tsx
│   │   └── PostEditPage.tsx
│   ├── meetings/
│   │   └── MeetingsPage.tsx     # Tabbed inbox (All / Incoming / Outgoing / Confirmed)
│   ├── profile/
│   │   └── ProfilePage.tsx      # Identity + expertise tags + GDPR export/delete
│   ├── admin/
│   │   └── AdminPage.tsx        # Users / Posts / Logs tabs + CSV export
│   ├── notifications/
│   │   └── NotificationsPage.tsx
│   ├── errors/
│   │   ├── NotFoundPage.tsx     # 404 (çift radial glow + quick links)
│   │   ├── UnauthorizedPage.tsx # 403 (dinamik auth-aware CTA)
│   │   └── PrivacyPage.tsx      # GDPR policy (7 SectionCard + contact footer)
│   └── LandingPage.tsx          # Public marketing; kendi TopNav + büyük footer'ı içinde
│
├── store/
│   ├── authStore.ts
│   ├── postStore.ts
│   ├── meetingStore.ts
│   └── notificationStore.ts
│
├── types/
│   ├── auth.types.ts
│   ├── post.types.ts
│   ├── meeting.types.ts
│   └── common.types.ts
│
├── utils/
│   ├── matchPosts.ts            # computeMatchReasons + rankByMatch (Faz 4 smart matching)
│   └── validators.ts            # Zod schema'ları + .edu email regex'i
│
├── constants/
│   ├── routes.ts                # ROUTES + rotaları üreten helper'lar (postDetail, postEdit, ...)
│   └── config.ts                # SESSION_TIMEOUT_MS, SESSION_WARN_MS, rate-limit sabitleri
│
├── data/
│   ├── mockUsers.ts             # 5 kullanıcı + MOCK_CREDENTIALS
│   ├── mockPosts.ts             # 10 post (8 aktif + 1 draft + 1 expired + 1 partner_found)
│   ├── mockMeetings.ts          # 7 meeting (4 status çeşidi)
│   └── mockLogs.ts              # 20 log (login / post / meeting / admin aksiyonları)
│
├── router/
│   ├── AppRouter.tsx            # Tüm rota tanımları; LandingShell vs AppLayout ayrımı burada
│   └── ProtectedRoute.tsx       # RBAC guard; role uyuşmazsa /unauthorized
│
├── styles/
│   └── globals.css              # Tailwind directives + hai-* CSS tokens + keyframes (shimmer, step slide)
│
├── App.tsx
└── main.tsx
```

---

## 3. Tasarım Sistemi (hai-* palette + Plus Jakarta Sans + Source Sans 3)

### 3.1 Palet (`tailwind.config.js`)

| Token            | HEX       | Kullanım                                                          |
|------------------|-----------|-------------------------------------------------------------------|
| `hai-plum`       | `#36213E` | Primary ink & CTA fill; header başlıkları; tamam/bitti vurguları  |
| `hai-teal`       | `#8AC6D0` | Aktif ikon tone; interactive accent; küçük dot vurguları          |
| `hai-mint`       | `#B8F3FF` | Yumuşak hover fill; radial glow'lar; mint chip/pill'leri          |
| `hai-lime`       | `#D2FF74` | Enerjik pozitif aksan (featured match, "Near me" aktif state)     |
| `hai-cream`      | `#E3DCD2` | Nötr/offline legal tone (privacy, cookie disabled state)          |
| `hai-offwhite`   | `#F3F4F6` | Uygulama surface bg; disabled field fill; pill offwhite'ı         |

Shadow / glow tonları için **plum-tinted rgba** kullan: `rgba(54, 33, 62, 0.35)` — siyah shadow yerine marka hissiyle drop yapar (ör. Request Access butonu).

### 3.2 Tipografi

Tek iki aile, Google Fonts'tan `index.html`'de yükleniyor. Başka font **eklenmez**.

- `font-headline` · `font-feixen` (alias) · **`font-mono`** → **Plus Jakarta Sans** (büyük başlıklar, logo, butonlar, pill/caps label'ları, "tabular-ish" her şey)
- `font-body` → **Source Sans 3** (paragraf, uzun okuma metni)

> `font-mono` utility'si Tailwind default `ui-monospace` stack'inden Plus Jakarta Sans'a override'landı (`tailwind.config.js`). Yüzlerce mevcut `font-mono` pill/badge kullanımı tek noktada brand tipografisine düşüyor.

Legacy CSS var'lar (`--ff-display`, `--ff-sans`, `--ff-mono` — `src/styles/globals.css`) aynı ailelere remap edildi; yeni kodda tercih edilmezler, sadece geriye uyumluluk için duruyorlar.

### 3.3 Radius & kompozisyon

- Kartlar: `rounded-[1.5rem]` (küçük/list) · `rounded-[1.75rem]` (orta) · `rounded-[2rem]` (büyük hero header)
- Butonlar: `rounded-full` (CTA pill'leri) · `rounded-lg` (center-nav hover chamber'ları)
- Pill/badge: `rounded-full` + `px-2.5 py-0.5` (10 px mono caps, 0.14–0.18em tracking)
- Disc avatars / numbered indices: `rounded-full` + `w-9 h-9` + `font-mono font-bold`

### 3.4 Radial glow'lar

Header / hero kartlarında aydınlatma için `absolute` + `radial-gradient` kullan:
```tsx
<div className="absolute top-0 right-0 w-72 h-72 pointer-events-none opacity-60"
     style={{ background: 'radial-gradient(circle, #B8F3FF 0%, transparent 70%)' }} />
```
Yaygın renkler: `#B8F3FF` (mint, en yaygın), `#D2FF74` (lime, pozitif), `#E3DCD2` (cream, nötr).

### 3.5 Micro-interaction katalogu

Hiyerarşi: **sessiz wash** (sık hit edilen linkler) → **lift + bloom** (dönüşüm butonları).

**Center-nav hover (sık link):**
```
px-4 py-2 rounded-lg transition-colors duration-200 ease-in-out
idle  : text-neutral-600
hover : text-neutral-900 hover:bg-black/5
```

**CTA lift+bloom (Sign in / Sign up / Request Access / Go to Dashboard):**
- `transition-all duration-[250ms] ease-out will-change-transform`
- Hover: `-translate-y-0.5` + shadow offset/blur büyür (6/18 → 16/32 px)
- Active: `translate-y-0` + shadow küçülür (press feedback)
- Plum bg butonlar plum-tinted shadow kullanır (`rgba(54,33,62,·)`), siyah bg siyah shadow

Detaylı spec için `.planning/SNAPSHOT.md · "Navbar micro-interactions"` bölümüne bakın.

### 3.6 NavDivider deseni

Hover kutusuyla çatışan `border-r`/`border-l` ayraçlar **yasak**. Bunun yerine linkler arasına bağımsız span:
```tsx
function NavDivider() {
  return <span aria-hidden className="mx-0.5 h-4 w-px self-center bg-neutral-200" />
}
```

### 3.7 Skeleton sistemi

Liste / grid sayfalarda `<Skeleton/>`, `<SkeletonLine/>`, `<SkeletonPill/>`, `<SkeletonCircle/>`, `<PostCardSkeleton/>`, `<SkeletonGrid/>` (yol: `src/components/ui/Skeleton.tsx`). Shimmer `.skeleton-shimmer` utility'si `prefers-reduced-motion` altında kapanır.

---

## 4. İsimlendirme Kuralları

### 4.1 Dosyalar

| Tür                | Kural                     | Örnek                        |
|--------------------|---------------------------|------------------------------|
| React bileşeni     | PascalCase + `.tsx`       | `PostCard.tsx`               |
| Sayfa              | PascalCase + `Page.tsx`   | `PostListPage.tsx`           |
| Store              | camelCase + `Store.ts`    | `authStore.ts`               |
| Tip dosyası        | camelCase + `.types.ts`   | `post.types.ts`              |
| Util               | camelCase, eylem ismi     | `matchPosts.ts`              |
| Sabit              | camelCase (dosya)         | `routes.ts`                  |
| Mock data          | `mock` + PascalCase       | `mockMeetings.ts`            |

### 4.2 Değişkenler & fonksiyonlar

- `camelCase` — değişken, fonksiyon, prop
- `PascalCase` — React bileşeni, TypeScript `type`/`interface`
- `SCREAMING_SNAKE_CASE` — sabit (`ROUTES`, `MEDICAL_DOMAINS`, `SESSION_TIMEOUT_MS`)
- Boolean: `is` / `has` / `can` / `should` prefix (`isActive`, `hasError`)
- Event handler: `handle` prefix (`handleSubmit`, `handleLogout`)

### 4.3 Tailwind class sırası

Bir className string'i şu sırayla okunur (soldan sağa):
**layout → positioning → display/flex → spacing → sizing → color → typography → effects → transition → state variants**

---

## 5. TypeScript Kuralları

```typescript
// ✅ Union tipler için type, tek şekilli veri için interface
type UserRole = 'engineer' | 'healthcare_professional' | 'admin'
type PostStatus = 'draft' | 'active' | 'meeting_scheduled' | 'partner_found' | 'expired' | 'closed'

interface PostCardProps {
  post: Post
  matchReasons?: MatchReason[]  // Opsiyonel, "Best matches for you" row'unda dolu gelir
  featured?: boolean             // Boost visual weight
}

// ✅ Tip import'ları — bundle boyutu için
import type { Post } from '../types/post.types'

// ❌ any kullanma · as Type cast etme · non-null assertion (!) kullanma
```

**tsconfig:** `strict: true` · `noImplicitAny: true` · `exactOptionalPropertyTypes` açık.

---

## 6. Bileşen Mimarisi

### 6.1 Single Responsibility
`PostCard` sadece post gösterir — veri çekmez, store dinlemez. Store bağları sayfa seviyesinde kurulur.

### 6.2 Boyut sınırı
- 250 satırı geçen bileşen → parçala veya alt-bileşene çıkar (`SectionCard`, `StatCard` gibi).
- JSX içinde inline iş mantığı yok — karmaşıklaşırsa ayrı fonksiyon/hook.
- Koşullu render 3 dal aşarsa → alt bileşen.

### 6.3 Shared form pattern
Benzer alan grupları olan formlar için ortak bir "fields" bileşeni çıkar:
`PostFormFields.tsx` → `PostCreatePage` ve `PostEditPage` tarafından paylaşılır. Profile sayfasında da `SectionCard` yerelleştirilmiş olarak aynı deseni uygular (4 section × rounded white card × numaralı disc header).

### 6.4 Keyboard erişilebilirliği
`onClick` alan kart benzeri elementler `role="link"` / `role="button"` + `tabIndex={0}` + `onKeyDown` (Enter / Space) almalı. Örnek: `PostCard` (`src/components/posts/PostCard.tsx`).

### 6.5 Modal sözleşmesi
- `role="dialog"` (bilgilendirme) · `role="alertdialog"` (blok kritik — SessionTimeout)
- `aria-labelledby` + `aria-describedby` zorunlu
- Escape tuşu ile kapanmalı (`useEffect` + `keydown` listener)
- Overlay: `bg-hai-plum/70 backdrop-blur-sm`

---

## 7. State Yönetimi — Zustand

```typescript
// store/postStore.ts (örnek)
interface PostState {
  posts: Post[]
  filters: PostFilters
  setFilters: (f: Partial<PostFilters>) => void
  clearFilters: () => void
  getFiltered: () => Post[]            // selector
  createPost: (data: PostCreateFormData) => Post
  updatePost: (id: string, patch: Partial<Post>) => void
  // …
}
```

**Kurallar:**
- Her domain ayrı store slice'ı (`authStore`, `postStore`, `meetingStore`, `notificationStore`)
- Server state (mock API verisi) → store içinde + `localStorage` persist
- UI state (modal açık/kapalı, drawer toggle) → local `useState`
- Form state → React Hook Form (store'a yazma `onSubmit` anında)
- URL state (filtre key'leri) — yakın gelecekte `useSearchParams`'a taşınabilir; şu an store içinde

---

## 8. Form Yönetimi — React Hook Form + Zod

Her form Zod schema'ya bağlı. Schema'lar `src/utils/validators.ts` altında merkezde durur.

```typescript
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { postCreateSchema, type PostCreateFormData } from '../utils/validators'

const { register, handleSubmit, formState: { errors } } = useForm<PostCreateFormData>({
  resolver: zodResolver(postCreateSchema),
  defaultValues: { /* ... */ },
})
```

`FormField.tsx` — hem kontrol label'ını hem hata mesajını tek bileşende sunar; `inputStyle(error?)` helper'ı `.edu` email, post input vs. tüm alanlarda paylaşılır.

---

## 9. Routing & RBAC

```typescript
// src/constants/routes.ts
export const ROUTES = {
  HOME:          '/',
  LOGIN:         '/login',
  REGISTER:      '/register',
  VERIFY_EMAIL:  '/verify-email',
  DASHBOARD:     '/dashboard',
  POSTS:         '/posts',
  POST_CREATE:   '/posts/new',
  POST_DETAIL:   '/posts/:id',
  POST_EDIT:     '/posts/:id/edit',
  MEETINGS:      '/meetings',
  PROFILE:       '/profile',
  NOTIFICATIONS: '/notifications',
  ADMIN:         '/admin',
  PRIVACY:       '/privacy',
  UNAUTHORIZED:  '/unauthorized',
} as const

export const postDetail = (id: string) => `/posts/${id}`
export const postEdit   = (id: string) => `/posts/${id}/edit`
```

**Shell ayrımı (`src/router/AppRouter.tsx`):**
- `/` → `LandingShell` > `LandingPage` (kendi TopNav + büyük footer)
- Diğer her şey → `AppLayout` (Navbar + Outlet + Footer + SessionTimeoutModal + CookieConsentBanner)

**RBAC:**
- `ProtectedRoute` auth kontrolü yapar; `allowedRoles` prop'u uyuşmazsa `/unauthorized`'a yönlendirir
- `/admin` sadece `user.role === 'admin'` ise açık

---

## 10. Clean Code Prensipleri (Projeye Özgü)

1. **Early return** — guard clause tercih edilir, nested `if` kaçınılır
2. **Magic number yok** — sabit dosyalarına taşınır (`constants/config.ts`)
3. **Yorum eksi** — kod kendini açıklar; yorum sadece "neden" veya non-obvious trade-off için
4. **DRY ama erken optimizasyon yok** — 3. tekrar edildiğinde çıkart
5. **Bileşen adı = dosya adı** — `export default PostCard` ↔ `PostCard.tsx`
6. **Named export** utility/tipte tercih edilir; sayfa/atomic bileşenlerde `default`
7. **Seed data gerçekçi** — tüm Avrupa şehirleri + gerçek tıbbi domain isimleri + inanılır post başlıkları
8. **Tip import'u `import type`** ile — bundle boyutu için
9. **`prefers-reduced-motion` onur** — animasyonlar (shimmer, stepper, lift) bu kullanıcı için otomatik kapanır
10. **ARIA default** — modal / alert / progressbar / link role'ü olan kart hepsinde ARIA yeterli

---

## 11. Performans Notları

- **Bundle:** `496 kB JS / 68 kB CSS` (gzip 132+12 kB) — target sınırı 250 kB JS gzip → halihazırda altında
- **Code split:** İleride büyüme olursa `AdminPage` + `PrivacyPage` dynamic import adayıdır; şu an monolitik
- **Font yükleme:** Google Fonts preconnect + `display=swap` → FOIT yok, sadece FOUT  
- **Animasyon:** `will-change-transform` sadece navigation CTA'larında — her yere serpilmez (memory maliyeti)
- **Shimmer:** Tek CSS keyframes, JS yok

---

## 12. Dokümantasyon Sözleşmesi

- `.planning/roadmap.md` — faz başına deliverable listesi
- `.planning/SNAPSHOT.md` — faz başına implementasyon kararları + build metrikleri
- `.instructions/FRONTEND_ARCH.md` (bu dosya) — "bu projede nasıl kod yazarız" sözleşmesi
- `.instructions/UI_UX_SKILL.md` — projenin görsel dili / micro-interaction / hover katalogu
- `.instructions/HEALTH_AI_CONTEXT.md` — domain terminolojisi, seed data kaynağı

Yeni bir faz tamamlandığında SNAPSHOT'a kayıt düşülür. Mimari bir karar değişirse bu dosya güncellenir.
