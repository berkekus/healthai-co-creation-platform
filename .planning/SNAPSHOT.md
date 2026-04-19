# HEALTH AI — Proje Snapshot
_Güncelleme: 2026-04-19 | Faz 0–9 + Navbar fix + Landing UI güncellemeleri tamamlandı_

---

## Proje Özeti
Mühendisler ile sağlık profesyonellerini yapılandırılmış, GDPR uyumlu bir web platformunda buluşturan co-creation uygulaması.
**Ders:** SENG 384 – Spring 2026 | Demo: max 5 dk video (6 senaryo)
**Dizin:** `C:/Users/Berke/Desktop/healthaico-op/`

---

## Stack
React 18 + TypeScript 5 (strict) + Vite 6 + TailwindCSS 3 + React Router v6 + Zustand 5 + React Hook Form + Zod v4

---

## Tamamlanan Fazlar

### ✅ Faz 0 — Landing Page
- Claude Design'dan alınan tasarım dosyası birebir React'e aktarıldı
- "Clinical Editorial" estetik: Newsreader serif + IBM Plex Sans + IBM Plex Mono
- Palette B (Graphite/Oxblood) varsayılan, 4 palette seçeneği (A/B/C/D)
- Bölümler: Hero, Features, Coverage, Statement, Footer

### ✅ Faz 1 — Proje Kurulumu & Temel Yapı
**Dosya yapısı:**
```
src/
├── constants/    routes.ts, config.ts
├── types/        auth.types.ts, post.types.ts, meeting.types.ts, common.types.ts
├── data/         mockUsers.ts (5), mockPosts.ts (10), mockMeetings.ts (3), mockLogs.ts (20)
├── store/        authStore.ts, postStore.ts, meetingStore.ts, notificationStore.ts
├── components/
│   ├── layout/   Navbar.tsx, AppLayout.tsx, Footer.tsx, PageWrapper.tsx
│   ├── ui/       FormField.tsx, SessionTimeoutModal.tsx, CookieConsentBanner.tsx
│   ├── posts/    PostStatusBadge.tsx, PostCard.tsx
│   └── meetings/ ExpressInterestModal.tsx, MeetingCard.tsx
├── router/       AppRouter.tsx, ProtectedRoute.tsx
├── pages/        LandingPage + 14 sayfa (tümü implement edildi)
├── utils/        validators.ts
└── styles/       globals.css
```

**Seed data:**
- 5 kullanıcı: e.muller@charite.edu, m.rossi@polimi.edu, i.larsson@ki.edu, k.nakamura@tum.edu, admin@healthai.edu
- Şifreler: `password123` (admin: `admin123`)
- 10 ilan, 3 toplantı, 20 aktivite logu, 4 bildirim

### ✅ Faz 2 — Kimlik Doğrulama (Demo S1)
- `/register` — 3 adımlı form, .edu validasyonu, GDPR checkbox
- `/login` — email/password, loading spinner, hata banner, demo credentials kutusu
- `/verify-email` — mock checklist UI
- `SessionTimeoutModal` — 30 dk hareketsizlik → 60 sn geri sayım → otomatik logout
- `ProtectedRoute` — RBAC
- `DashboardPage` — rol bazlı karşılama, stat widget'ları, recent posts, pending meetings

### ✅ Faz 3 — Post Yönetimi (Demo S2)
- `PostStatusBadge` — 5 status renk kodu: draft/active/meeting_scheduled/partner_found/expired
- `PostCard` — hover border, domain tag, status badge, meta row
- `PostCreatePage` — tam form: title, domain(20 alan), expertiseRequired, description(min 50), projectStage, collaborationType, confidentiality(radio), city, country, expiryDate; "Save as Draft" + "Publish Post" butonları
- `PostListPage` — seed data görünür, empty state
- `PostDetailPage` — tüm alanlar, "Publish"/"Mark as Partner Found"/"Edit"/"Express Interest" butonları, owner kontrolü
- `PostEditPage` — pre-fill form, aynı Zod şeması
- `postStore.create` — authorRole parametresi düzeltildi (hardcoded 'engineer' kaldırıldı)

### ✅ Faz 4 — Arama & Filtreleme (Demo S3)
- Search bar — title + description full-text
- Sol sidebar filter panel — açılıp kapanabilir
  - Domain (20 tıbbi alan), Project stage, Status, Posted by (role), City, Country
- Aktif filtre sayacı badge, "Clear filters" butonu
- "X of Y listings" sonuç sayısı
- No results empty state (filtreye göre farklı mesaj)

### ✅ Faz 5 — Meeting Workflow (Demo S4)
- `ExpressInterestModal` — 3 adımlı:
  - Step 1: Mesaj (min 20 karakter)
  - Step 2: NDA checkbox ("I Accept & Continue")
  - Step 3: Min 3 zaman dilimi öner (date + time picker), slot ekle/kaldır
- Submit → meeting store'a kaydet, post status → `meeting_scheduled`, iki tarafa bildirim
- `MeetingCard` — incoming/outgoing ayrımı, slot accept (owner), decline (owner), cancel (requester)
- `MeetingsPage` — "Incoming requests" + "Outgoing requests" seksiyon, "awaiting action" badge
- Duplicate request koruması (aynı post için tekrar "Express Interest" gösterilmez)

### ✅ Faz 6 — Admin Panel (Demo S5)
- 3 sekmeli AdminPage: Users | Posts | Activity Logs
- **Users:** Tüm kullanıcılar tablosu, Suspend/Reinstate butonu, isSuspended badge
- **Posts:** Tüm ilanlar tablosu, Remove butonu (owner'a bildirim gönderir)
- **Activity Logs:** 20 seed log, Action + Result filtreleri, hata satırları kırmızı vurgulu
- **CSV Export:** Filtrelenmiş logları `healthai-logs-YYYY-MM-DD.csv` olarak indirir
- Tamper-resistant notu: "No deletion permitted. Retention: 24 months."
- 4 stat widget: Total users, Suspended, Active listings, Security events

### ✅ Faz 7 — Profile & GDPR (Demo S6)
- `ProfilePage` — avatar header, edit formu (name, institution, city, country, bio), expertise tag input (Enter ile ekle, × ile kaldır)
- `authStore.updateProfile` — store + mockUsers güncellenir
- **Export my data** → `healthai-data-uX-YYYY-MM-DD.json` (profil + ilanlar + toplantılar)
- **Delete account** — kırmızı bordered modal, "DELETE" yazılması zorunlu → logout
- `NotificationsPage` — tıklanabilir, linkTo'ya navigate, unread dot, "Mark all read"
- `profileSchema` validators.ts'e eklendi

### ✅ Faz 8 — GDPR, Rate Limiting, Session Polish
- `CookieConsentBanner` — fixed bottom, "Essential only" / "Accept all", localStorage persist
- **LoginPage rate limiting:** 3 başarısız → sarı uyarı; 3. denemede 60 sn cooldown + progress bar, buton disabled
- **SessionTimeoutModal polish:** Countdown'ın altına depleting progress bar (yeşil → kırmızı 20s altında)
- `PrivacyPage` — GDPR tam içerik: Art. 6 legal basis, Art. 15-22 haklar, cookie policy, retention, contact
- `AppLayout` — CookieConsentBanner eklendi

### ✅ Faz 9 — Polish & Responsive
- `globals.css` — responsive CSS classes: `.posts-layout`, `.filter-aside`, `.posts-grid`, `.dash-stats`
- Media queries: 760px (sidebar → üste geçer), 480px (tek sütun)
- `PostListPage` — inline style'dan CSS class'lara geçiş
- `DashboardPage` — "My recent posts" + "Meetings awaiting action" bölümleri eklendi

### ✅ Navbar Fix (Faz 9 sonrası)
- Landing page'de (unauthenticated) navbar orta bölümü boş görünüyordu
- Düzeltme: unauthenticated kullanıcılar için Features · Coverage · About anchor linkleri eklendi
- Authenticated kullanıcılar: Browse Posts · Meetings · (Admin) — değişmedi

### ✅ Landing Page UI Güncellemeleri (Faz 9 sonrası)
- **Hero başlık + paragraf + buton ortalandı:** Sol hero kolonuna `textAlign: 'center'` eklendi, paragraf margin'i `0 auto`, buton row'a `justifyContent: 'center'`
- **"How it works" interaktif stepper:** Büyük "Post. Match. Meet. Build." statik metni kaldırıldı; 4 adımlı slide-in stepper ile değiştirildi
  - `← →` ok butonları ile smooth CSS animasyonlu geçiş (`step-in-right` / `step-in-left`)
  - Aktif step dot'u genişler (8px → 28px), dot'lara tıklanarak direkt geçiş yapılabilir
  - Son/ilk stepte ilgili ok %25 opacity'ye düşer ve devre dışı kalır
  - `globals.css`'e `@keyframes stepSlideInRight` + `stepSlideInLeft` eklendi
- **Git altyapısı:** `.git` repo init edildi, `.gitignore` eklendi (node_modules, dist, .env, editor/OS dosyaları)

---

## Değişen Dosyalar (Tüm Fazlar)

### Yeni Oluşturulan
```
src/components/posts/PostStatusBadge.tsx
src/components/posts/PostCard.tsx
src/components/meetings/ExpressInterestModal.tsx
src/components/meetings/MeetingCard.tsx
src/components/ui/CookieConsentBanner.tsx
```

### Güncellenen
```
src/utils/validators.ts          — postCreateSchema, profileSchema eklendi
src/store/postStore.ts           — authorRole parametresi düzeltildi
src/store/authStore.ts           — updateProfile eklendi
src/components/layout/AppLayout.tsx   — CookieConsentBanner eklendi
src/components/layout/Navbar.tsx      — unauthenticated nav linkleri eklendi
src/components/ui/SessionTimeoutModal.tsx — progress bar eklendi
src/styles/globals.css           — responsive breakpoints + step slide animasyonları eklendi
src/pages/LandingPage.tsx        — hero ortalandı, How it works interaktif stepper eklendi
src/pages/dashboard/DashboardPage.tsx — recent posts + meetings eklendi
src/pages/posts/PostCreatePage.tsx    — tam form
src/pages/posts/PostListPage.tsx      — filter panel + CSS class'lar
src/pages/posts/PostDetailPage.tsx    — detay + modal bağlantısı
src/pages/posts/PostEditPage.tsx      — pre-fill form
src/pages/meetings/MeetingsPage.tsx   — incoming/outgoing
src/pages/admin/AdminPage.tsx         — 3 sekme + CSV export
src/pages/profile/ProfilePage.tsx     — edit + GDPR
src/pages/notifications/NotificationsPage.tsx — navigate + unread
src/pages/auth/LoginPage.tsx          — rate limiting
src/pages/errors/PrivacyPage.tsx      — GDPR içerik
```

---

## Teknik Kararlar

| Karar | Tercih | Gerekçe |
|---|---|---|
| Form yönetimi | React Hook Form + Zod v4 | Type-safe validation |
| State | Zustand 5 slice pattern | Basit, boilerplate yok |
| Stil | CSS custom properties (OKLCH) + inline styles | Design token sistemi |
| Mock data | In-memory store | API katmanı değişince sadece service dosyaları değişir |
| authorRole | Store create'e parametre olarak geçirilir | Hardcoded 'engineer' hatası düzeltildi |
| Rate limiting | Local state (failedAttempts + cooldown) | 3 deneme → 60s lockout |
| Cookie consent | localStorage 'healthai_cookie_consent' | Persist across sessions |

---

## Instruction Dosyaları (.instructions/)
- `UI_UX_SKILL.md` — Tasarım Anayasası
- `FRONTEND_ARCH.md` — Klasör yapısı, clean code
- `HEALTH_AI_CONTEXT.md` — Domain terminoloji, post state machine

---

## Dev Server
```bash
cd C:/Users/Berke/Desktop/healthaico-op
npm run dev
# → http://localhost:5173
```

## Demo Akışı
1. `http://localhost:5173` → Landing page (Features · Coverage · About nav + Sign in)
2. `/register` → non-.edu → hata | .edu → 3 adım kayıt
3. `/login` → `e.muller@charite.edu` / `password123` → Dashboard
4. `/posts/new` → form doldur → Draft / Publish
5. `/posts` → arama + filtrele → ilan aç → Express Interest (3 adım modal)
6. `/meetings` → slot kabul/reddet
7. `/login` → `admin@healthai.edu` / `admin123` → `/admin` → Users/Posts/Logs/CSV
8. `/profile` → edit → Export JSON → Delete (demo)
