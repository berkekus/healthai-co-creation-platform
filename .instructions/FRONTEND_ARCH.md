# FRONTEND ARCHITECTURE SKILL — HEALTH AI Co-Creation Platform
> Projedeki klasör yapısı, isimlendirme kuralları ve clean code prensiplerini tanımlar.
> Her yeni dosya, bileşen veya hook bu kurallara uygun üretilir.

---

## 1. Tech Stack

| Katman | Teknoloji | Versiyon |
|---|---|---|
| Framework | React | 18+ |
| Dil | TypeScript | 5+ strict mode |
| Build | Vite | 5+ |
| Stil | TailwindCSS | 3+ |
| Routing | React Router | v6 |
| State | Zustand | 4+ |
| Form | React Hook Form + Zod | latest |
| HTTP | Axios veya Fetch API | — |
| İkon | lucide-react | latest |
| Test | Vitest + Testing Library | latest |

---

## 2. Klasör Yapısı

```
src/
├── assets/                  # Statik dosyalar (logo, svg, font)
│   ├── icons/
│   └── images/
│
├── components/              # Yeniden kullanılabilir UI bileşenleri
│   ├── ui/                  # Atomik: Button, Input, Badge, Modal, Spinner
│   ├── layout/              # Navbar, Sidebar, Footer, PageWrapper
│   ├── posts/               # PostCard, PostForm, PostStatusBadge, PostFilters
│   ├── meetings/            # MeetingRequestCard, TimeSlotPicker, NDAModal
│   ├── admin/               # UserTable, PostTable, LogTable, StatsWidget
│   └── notifications/       # NotificationBell, NotificationItem
│
├── pages/                   # Route seviyesi bileşenler (bir route = bir dosya)
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── VerifyEmailPage.tsx
│   ├── dashboard/
│   │   └── DashboardPage.tsx
│   ├── posts/
│   │   ├── PostListPage.tsx
│   │   ├── PostDetailPage.tsx
│   │   ├── PostCreatePage.tsx
│   │   └── PostEditPage.tsx
│   ├── meetings/
│   │   └── MeetingsPage.tsx
│   ├── profile/
│   │   └── ProfilePage.tsx
│   ├── admin/
│   │   └── AdminPage.tsx
│   ├── notifications/
│   │   └── NotificationsPage.tsx
│   └── errors/
│       ├── NotFoundPage.tsx
│       └── UnauthorizedPage.tsx
│
├── hooks/                   # Custom React hook'ları
│   ├── useAuth.ts
│   ├── usePosts.ts
│   ├── useMeetings.ts
│   └── useNotifications.ts
│
├── store/                   # Zustand store slice'ları
│   ├── authStore.ts
│   ├── postStore.ts
│   ├── meetingStore.ts
│   └── notificationStore.ts
│
├── services/                # API çağrıları ve iş mantığı
│   ├── authService.ts
│   ├── postService.ts
│   ├── meetingService.ts
│   └── adminService.ts
│
├── types/                   # TypeScript tip tanımları
│   ├── auth.types.ts
│   ├── post.types.ts
│   ├── meeting.types.ts
│   └── common.types.ts
│
├── utils/                   # Saf yardımcı fonksiyonlar
│   ├── formatDate.ts
│   ├── validators.ts        # .edu email kontrolü vb.
│   └── cn.ts                # Tailwind class merge helper
│
├── constants/               # Sabit değerler
│   ├── domains.ts           # Tıbbi domain listesi
│   ├── routes.ts            # Route path sabitleri
│   └── config.ts            # Env değişkenleri
│
├── data/                    # Mock / seed data (demo için)
│   ├── mockUsers.ts
│   ├── mockPosts.ts
│   └── mockLogs.ts
│
├── router/
│   ├── AppRouter.tsx        # Tüm route tanımları
│   └── ProtectedRoute.tsx   # RBAC route koruması
│
├── styles/
│   └── globals.css          # Tailwind direktifleri + CSS variables
│
├── App.tsx
└── main.tsx
```

---

## 3. İsimlendirme Kuralları

### Dosyalar
| Tür | Kural | Örnek |
|---|---|---|
| React bileşeni | PascalCase + `.tsx` | `PostCard.tsx` |
| Hook | camelCase, `use` prefix | `useAuth.ts` |
| Store | camelCase, `Store` suffix | `authStore.ts` |
| Service | camelCase, `Service` suffix | `postService.ts` |
| Tip dosyası | camelCase, `.types.ts` suffix | `post.types.ts` |
| Util | camelCase, eylem ismi | `formatDate.ts` |
| Sayfa | PascalCase, `Page` suffix | `PostListPage.tsx` |

### Değişkenler & Fonksiyonlar
- `camelCase` — değişken, fonksiyon, prop
- `PascalCase` — React bileşeni, TypeScript interface/type
- `SCREAMING_SNAKE_CASE` — sabit (const enum, config)
- Boolean değişkenler: `is`, `has`, `can`, `should` prefix → `isLoading`, `hasError`
- Event handler: `handle` prefix → `handleSubmit`, `handleClose`

### CSS / Tailwind
- Custom class: `kebab-case` → `.glass-card`, `.page-bg`
- Tailwind class sırası: layout → spacing → sizing → color → typography → effects → state

---

## 4. TypeScript Kuralları

```typescript
// ✅ Her zaman interface değil type kullan (union için gerekli)
type UserRole = 'engineer' | 'healthcare_professional' | 'admin';

// ✅ Post yaşam döngüsü — string union
type PostStatus = 'draft' | 'active' | 'meeting_scheduled' | 'partner_found' | 'expired';

// ✅ Prop tipleri her bileşende explicit
interface PostCardProps {
  post: Post;
  onExpressInterest?: (postId: string) => void;
  className?: string;
}

// ✅ API response sarmalayıcı
type ApiResponse<T> = {
  data: T;
  success: boolean;
  message?: string;
};

// ❌ any kullanma
// ❌ as Type casting — tipi doğru tanımla
// ❌ non-null assertion (!) — optional chaining kullan
```

**tsconfig:** `strict: true`, `noImplicitAny: true`, `exactOptionalPropertyTypes: true`

---

## 5. Bileşen Mimarisi Prensipleri

### 5.1 Single Responsibility
Bir bileşen tek şey yapar. `PostCard` sadece post gösterir — veri çekmez, state yönetmez.

### 5.2 Props Drilling Yasağı
2 seviyeden derin prop drilling yasak. Zustand store veya Context kullan.

### 5.3 Bileşen Boyutu
- 200 satırı geçen bileşen → parçala
- JSX içinde iş mantığı yok → custom hook'a taşı
- Koşullu render karmaşıklaşırsa → ayrı bileşen

### 5.4 Composition Pattern
```tsx
// ✅ Doğru — composition
<Card>
  <Card.Header><PostStatusBadge status={post.status} /></Card.Header>
  <Card.Body>{post.description}</Card.Body>
  <Card.Footer><Button>Express Interest</Button></Card.Footer>
</Card>

// ❌ Yanlış — tek devasa bileşen
<PostCardWithEverything post={post} showBadge showFooter showActions />
```

### 5.5 Custom Hook Kuralı
Bileşen içinde 3+ useState veya useEffect varsa → custom hook çıkar.

```typescript
// ✅ usePosts.ts
export function usePosts(filters: PostFilters) {
  const posts = usePostStore(s => s.posts);
  const filteredPosts = useMemo(() => applyFilters(posts, filters), [posts, filters]);
  return { posts: filteredPosts, isEmpty: filteredPosts.length === 0 };
}
```

---

## 6. State Yönetimi — Zustand Kuralları

```typescript
// ✅ Slice pattern — her domain ayrı store
// store/authStore.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (credentials) => {
    const user = await authService.login(credentials);
    set({ user, isAuthenticated: true });
  },
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

**Kurallar:**
- Server state (API verisi) → store içinde
- UI state (modal açık/kapalı) → local useState
- Form state → React Hook Form
- URL state (filtreler) → URL query params (`useSearchParams`)

---

## 7. Form Yönetimi — React Hook Form + Zod

```typescript
// ✅ Her form için Zod schema — validators.ts içinde
export const postCreateSchema = z.object({
  title: z.string().min(5, 'En az 5 karakter').max(100),
  domain: z.string().min(1, 'Domain seçiniz'),
  description: z.string().min(20, 'En az 20 karakter').max(2000),
  expertiseRequired: z.string().min(1),
  projectStage: z.enum(['idea','concept_validation','prototype','pilot','pre_deployment']),
  city: z.string().min(1),
  country: z.string().min(1),
  commitmentLevel: z.enum(['advisor','co_founder','research_partner']),
  confidentiality: z.enum(['public_pitch','meeting_only']),
  expiryDate: z.date().min(new Date()),
});

export type PostCreateFormData = z.infer<typeof postCreateSchema>;
```

---

## 8. Route & RBAC Yapısı

```typescript
// constants/routes.ts
export const ROUTES = {
  HOME:            '/',
  LOGIN:           '/login',
  REGISTER:        '/register',
  VERIFY_EMAIL:    '/verify-email',
  DASHBOARD:       '/dashboard',
  POSTS:           '/posts',
  POST_DETAIL:     '/posts/:id',
  POST_CREATE:     '/posts/new',
  POST_EDIT:       '/posts/:id/edit',
  MEETINGS:        '/meetings',
  PROFILE:         '/profile',
  NOTIFICATIONS:   '/notifications',
  ADMIN:           '/admin',
  PRIVACY:         '/privacy',
} as const;

// router/ProtectedRoute.tsx
// allowedRoles prop'u yoksa sadece auth kontrolü yapılır
// allowedRoles: ['admin'] → sadece admin erişir, yoksa /unauthorized
```

---

## 9. Service Katmanı Kuralı

Bileşenler doğrudan `fetch`/`axios` çağırmaz. Her API çağrısı `services/` altında.

```typescript
// services/postService.ts
export const postService = {
  getAll: (filters: PostFilters): Promise<Post[]> => { ... },
  getById: (id: string): Promise<Post> => { ... },
  create: (data: PostCreateFormData): Promise<Post> => { ... },
  update: (id: string, data: Partial<Post>): Promise<Post> => { ... },
  markPartnerFound: (id: string): Promise<Post> => { ... },
};
```

Demo aşamasında service fonksiyonları mock data döndürür — gerçek API'ye geçiş sadece bu katmanı değiştirir.

---

## 10. Clean Code Prensipleri (Projeye Özgü)

1. **Erken return** — nested if yerine guard clause
2. **Magic number yok** — sabit dosyasına al
3. **Yorum yok (genel)** — kod kendini açıklar; "neden" gerektiren edge case'lerde tek satır
4. **DRY ama erken optimizasyon yok** — 3. kez tekrar ettiğinde soyutla
5. **Bileşen adı = dosya adı** — `export default PostCard` → dosya `PostCard.tsx`
6. **Named export tercihli** — default export sadece page bileşenlerinde
7. **Seed data gerçekçi** — tüm Türk/Avrupa şehirleri, gerçek tıbbi domain isimleri
8. **Tip import `import type`** — bundle boyutu için
