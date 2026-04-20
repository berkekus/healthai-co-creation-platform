# HEALTH AI — Proje Snapshot
_Güncelleme: 2026-04-20 | **Navbar micro-interactions** — premium hover sistem: quiet black/5 wash (center nav) + lift+shadow bloom (CTA butonları) + NavDivider helper_

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

### ✅ Faz 0 — Landing Page (v2 · Payard-inspired refresh · 20·04·2026)
- **Eski tasarım:** "Clinical Editorial" (Newsreader + IBM Plex, OKLCH Oxblood/Graphite, 4 paletli tweak paneli)
- **Yeni tasarım:** Payard referansından uyarlandı → HealthAI içeriği
  - **Palet:** Teal `#8AC6D0` → Mint `#B8F3FF` → Plum `#36213E` + Off-white `#F3F4F6` + Lime/Cream accents
  - **Tipografi:** **Space Grotesk** (headline) + **Manrope** (body) + **Material Symbols Outlined** (ikon font)
  - **Yapı (sırayla):**
    1. Fixed transparan nav (beyaz pill + **"Request Access"** → plum bg + white font) + Sign in / Sign up
    2. **Hero zone** — gradient container: teal 0% → 44% teal → 72% off-white → 100% off-white (Join Directory kartının ortasından itibaren ve "Ready to co-create" CTA'sına kadar off-white surface)
    3. Title "Healthcare co-creation, without the silos." + badge + paragraph
    4. "Join the Directory" beyaz 2rem panel + 2 kart (For clinicians / For engineers) + her kartta tilted HeroPostMock
    5. Stats ribbon (.edu / 20 / 12 / 0)
    6. Dev "Platform" wordmark — plum/8% opacity ghost tone (off-white üstünde)
    7. 4 Platform kartı (Structured Directory / NDA-first Meetings / Intelligent Matching / GDPR-native — 4. siyah kart)
    8. CTA pill row "Ready to co-create?" + teal Request Access button
    9. **How it works — interaktif step-by-step guide** (4 adım: Post · Match · Meet · Build)
       - Büyük beyaz panel, üstte progress bar, sol: copy + breadcrumb, sağ: adım-özel custom visual (PostVisual / MatchVisual / MeetVisual / BuildVisual)
       - Sağ-sol ok butonları + dot pagination, `step-in-right` / `step-in-left` CSS animasyonlu slide geçişler
       - Önceki adım/sonraki adım isimleri butonlarda görünür; başa/sona gelince "Start"/"Done"
    10. Stacked headlines (mint bg) — GDPR-native · European institutions · Immutable audit trail · Zero patient data
    11. Structured collaboration (off-white bg) — 2x2 accordion grid + teal "Read policy" CTA
    12. Upcoming Features — Cross-institutional grants · Outcome tracking · Multi-site trials
    13. **Plum footer** — 4 col (Contact · Platform · Legal · Access) + **clamp(56px, 16vw, 240px) "healthai" wordmark tamamı görünür** (overflow-hidden ve negative margin yok) + SENG 384 bottom strip
  - **Router:** Landing `AppLayout`'tan çıkarıldı, kendine özel **`LandingShell`** wrapper'ına alındı (`CookieConsentBanner` + `SessionTimeoutModal` taşır)
- **Build:** temiz (`tsc -b && vite build` → 1704 modül, 438 kB JS / 39 kB CSS, 4.9 sn)

### ✅ Faz 1 — Proje Kurulumu & Temel Yapı (v2 · landing paletiyle uyumlandırıldı · 20·04·2026)
**Layout refresh:** Faz 0 ile aynı tasarım dili (hai-* palet + Space Grotesk/Manrope) authenticated-app shell'e uygulandı:
- **`Navbar.tsx`** — sticky `bg-white/85 backdrop-blur-md`, siyah kare "healthai." logo mark, pill-stili aktif link state (`bg-hai-mint text-hai-plum`), yuvarlak bell + avatar; `bg-hai-plum text-white` Request Access butonu; profile dropdown (2xl radius + plum header + role chip); responsive hamburger drawer
- **`Footer.tsx`** — kompakt plum footer (landing'in dev wordmark'lı ağır footer'ı sadece `/`'de), "HealthAI · Co-Creation Platform · zero patient data" + legal/GDPR linkleri + SENG 384 meta
- **`AppLayout.tsx`** — `min-h-screen flex flex-col font-body bg-hai-offwhite antialiased`
- **`PageWrapper.tsx`** — Tailwind class'lara + inline `maxWidth` prop backwards-compat (mevcut `maxWidth={720}` / `padTop="clamp(..)"` kullanımları bozulmadı)
- **Icon dili:** lucide-react internal shell'de (Bell/Menu/User/LogOut/Settings/LayoutDashboard), Material Symbols sadece landing'in atmosferinde

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

### ✅ Faz 2 — Kimlik Doğrulama (v2 · Studio Feixen Sans + hai-* palet refresh · 20·04·2026)
**Font altyapısı:**
- **Studio Feixen Sans** — `/public/fonts/feixen.css` (public klasöründen runtime serve, Vite build pipeline'ına girmez → uyarısız build)
- **Dosya konumu:** `/public/fonts/StudioFeixenSans/StudioFeixenSans-{Light,Regular,RegularItalic,Medium,SemiBold,Bold,Ultra}.woff2`
- **Fallback zinciri:** Feixen → Space Grotesk (headline) / Manrope (body) → sans-serif (font-display: swap)
- **Setup:** `public/fonts/StudioFeixenSans/README.md` — trial (ücretsiz, non-commercial) veya 75 CHF+ lisanslı indirme talimatları

**Sayfalar:**
- **`/login`** — 480 px max-w card tasarım: pill section badge (02 · Sign in) + 54 px Feixen "Welcome back." + cooldown/attempt/server banner'ları (2xl radius, Material Symbols iconlar) + rounded 12 px input'lar (teal focus ring) + plum 3.5-py round submit + cream demo credentials card (.edu bold, font-mono password)
- **`/register`** — 560 px card + pill step indicator (plum active, mint done, bordered pending) + 3 adım:
  - S0 Account: name / .edu email / password / confirm
  - S1 Role: 2 büyük rounded-2xl seçim kartı (engineer/healthcare_professional) — Feixen title + Material icon (memory/stethoscope) + radio dot
  - S2 Institution: institution + city + country (custom plum chevron select) + GDPR checkbox card (hai-offwhite bg)
- **`/verify-email`** — 520 px: pill badge (03) + mint-plum katmanlı mail ikonu (tilted) + 48 px Feixen "Check your inbox." + 4-step checklist card (02/04 complete progress header, plum-filled done rows) + cream demo notice + continue/back CTA çifti
- **`/dashboard`** — 1200 px: radial mint glow'lu header card (pill badge + 52 px Feixen "Welcome back, {Name}." + role + institution + 3-li quick action pill row, meetings'te badge count) → 3 stat kartı (article/handshake/visibility ikonlu renk-kodlu tint'ler: mint/lime/cream) → 2-kolon grid:
  - My recent posts (5 limit, status chip — mint/lime/plum renklerinde)
  - Meetings awaiting action (pending varsa amber gradient + pulse dot, yoksa "All caught up" empty state)

**Utility refresh:**
- **`FormField.tsx`** — Tailwind class'lara (hai-plum label, red-600 error, font-mono hint)
- **`inputStyle` helper** — 12 px border-radius, beyaz bg, Feixen font, plum text, hover/focus ring helper'ları (`FOCUS_SHADOW = 0 0 0 3px rgba(138,198,208,0.32)`)

**Tailwind config:**
- Yeni `font-feixen` family (Feixen → Space Grotesk → sans)
- `font-headline` / `font-body` de Feixen'i primary yapacak şekilde güncellendi

**`SessionTimeoutModal`** — mevcut 30 dk inactivity + 60 sn geri sayım davranışı korundu, görsel stil bir sonraki rafinajda aynı palete çekilecek

**Build:** temiz (1704 modül, 446 kB JS / 48 kB CSS gzip 123 + 10 kB, 2.4 sn, sıfır warning)
- `ProtectedRoute` — RBAC
- `DashboardPage` — rol bazlı karşılama, stat widget'ları, recent posts, pending meetings

### ✅ Faz 3 — Post Yönetimi (v2 · hai-* palet + Feixen + card-based tasarım · 20·04·2026)
**Yeniden yazılan bileşenler:**
- **`PostStatusBadge`** — pill-shaped tam tailwind; status→palet eşlemesi:
  - `draft` neutral-100 · `active` hai-mint+teal dot · `meeting_scheduled` hai-lime+plum dot · `partner_found` hai-plum+mint · `expired` hai-cream
  - 3 size (sm/md/lg), yuvarlak dot + mono uppercase label
- **`PostCard`** — 1.5rem rounded beyaz kart, hover'da teal border + plum shadow + translate-y lift, keyboard accessible (tabindex + Enter/Space):
  - Üst: hai-mint domain pill + status badge
  - Feixen başlık (line-clamp 2), 2 satır açıklama
  - 2 tag (stage + collab type) neutral border rounded-full
  - Alt: avatar + author + role icon + konum | interest count (bolt ikonlu) + day-left (<14 amber)

**Shared form:** yeni **`PostFormFields.tsx`** — 4 sectionlı kart tasarım (01 Basics · 02 Details · 03 Classification · 04 Location), her section beyaz rounded-2xl kart içinde numbered mint disc header + subtitle. Confidentiality radio'ları `peer-checked:` gradient mint arka plan + plum icon badge + plum radio dot ile. GDPR notice cream→white gradient kart, plum shield icon.

**Sayfalar:**
- **`/posts`** — `PostListPage`:
  - Header card: teal radial glow + pill badge (05) + 56 px Feixen "Collaboration opportunities." + plum "Post opportunity" pill
  - Büyük rounded-full search bar (offwhite bg → focus'ta plum border + beyaz bg, X temizleme butonu)
  - Result satırı: "X of Y results" + hai-lime filter chip + "Clear filters" link
  - Sidebar kart (lg sticky top-20): başlıkta `tune` ikon + filter count chip + `expand_more` collapse kontrolü
    - Filtreler: Domain select, Project stage, Status, **Posted by** (3 pill butonlu custom: Anyone/Engineer/Clinician — active=plum, inactive=offwhite), City, Country
  - Grid: responsive 1/2/3 col `gap-5` post kartları
  - Empty state: folder_open / search_off ikonlu mint disk + plum CTA
- **`/posts/new`** — `PostCreatePage`:
  - Back link ("← Directory") + intro card (lime radial glow, pill badge 07, 48 px Feixen "Post a collaboration opportunity.")
  - `PostFormFields` (4 section kartı)
  - **Sticky bottom-4 action kartı:** "Save as draft" (plum outlined) + "Publish post →" (plum filled, 2/3 width)
- **`/posts/:id/edit`** — `PostEditPage`:
  - Back link ("← Back to post") + intro card (mint radial glow + status badge lg yanında) + `PostFormFields` + sticky action kartı (Cancel + "Save changes →")
  - Post yoksa: rounded kart + search_off ikonlu empty state
- **`/posts/:id`** — `PostDetailPage`:
  - Back link ("← Directory") → hero card: pill badge (06) + status badge lg + mint domain pill + 48 px Feixen title + author row (avatar + role icon) + gün-sayacı chip (active için, <14 amber)
  - alreadyRequested alert card: mint→white gradient + check_circle + "Check your meetings" linki
  - 6-tile meta grid (sm 1col · md 3col): location_on · progress_activity · handshake · lock/visibility · event · bolt
  - "Expertise required" kartı (teal label + auto_awesome icon + 17 px semibold)
  - Description: `public_pitch` için beyaz kart, `meeting_only` için dashed border rounded cream lock card (48 px plum+mint ikonlu "Details shared under NDA")
  - **Sticky bottom action kartı:** rol-dinamik pill row (Publish / Mark partner found [lime] / Edit [white outlined] / Express interest [plum with shadow, right-aligned])

**Build:** temiz (1705 modül, 453 kB JS / 55 kB CSS gzip 125+11 kB, 2.4 sn, sıfır warning)

> ✅ **Tüm fazlar** (0 → 7) artık hai-* palet + Plus Jakarta Sans / Source Sans 3 + rounded-card treatment'ı kullanıyor. Eski `var(--ink)` / `var(--ff-display)` CSS var'ları legacy `globals.css` token'ları olarak kalıyor (kullanılan yer kalmadı).

### 🔤 Typography refresh — 20·04·2026
- **`index.html`** — Plus Jakarta Sans (400/500/600/700/800) + Source Sans 3 (300/400/500/600/700) Google Fonts eklendi; eski Newsreader/IBM Plex/Space Grotesk/Manrope/Studio Feixen Sans linkleri kaldırıldı
- **`tailwind.config.js`** — `fontFamily` güncellendi:
  - `headline` → Plus Jakarta Sans (büyük başlıklar, logomsu yazılar, butonlar, pill etiketler)
  - `body`     → Source Sans 3 (paragraf ve okuma metni)
  - `feixen`   → geri uyumluluk için Plus Jakarta Sans alias'ı (mevcut `font-feixen` kullanımları çalışmaya devam etsin diye)
- **Inline style tamiri:** `FormField.tsx` inputStyle (Source Sans 3), `PostListPage.tsx` selectStyle (Source Sans 3), `AdminPage.tsx` selectStyle (Plus Jakarta Sans — pill button feel)
- **`globals.css`** — legacy `--ff-display/--ff-sans` var'ları Plus Jakarta Sans / Source Sans 3'e remap edildi, `--ff-mono` system monospace'e dönüştürüldü
- **Temizlik:** `public/fonts/feixen.css` + `public/fonts/StudioFeixenSans/README.md` silindi
- **Build:** temiz (1706 modül, 479 kB JS / 61 kB CSS gzip 130+11 kB, 2.5 sn, sıfır warning)

### ✅ Faz 4 — Arama & Matching (v2 · debounced search + match reasoning + Best matches row · 20·04·2026)
**Yeni util:** `src/utils/matchPosts.ts` — `computeMatchReasons(post, user)` + `rankByMatch(posts, user)`
- 4 sinyal sınıfı (`MatchTone`): `city` (near_me · lime), `country` (public · mint), `role` (memory / stethoscope · plum→mint), `expertise` (auto_awesome · cream · user.expertiseTags ∩ post.expertiseRequired+description+domain)
- Kullanıcı kendi post'u için eşleşme üretmez, login yoksa boş döner
- `rankByMatch` — reason sayısına göre desc sıralama, tiebreak `createdAt` desc

**`PostCard` güncellemeleri:**
- Yeni props: `matchReasons?: MatchReason[]`, `featured?: boolean`
- Üstte chip rail (mint/lime/plum/cream tonları + Material Symbols ikon)
- `featured=true` → 2 px plum border + büyük shadow + hover glow boost (Best matches row için)

**`PostListPage` güncellemeleri:**
- **Debounced search** (220 ms `useEffect` + `setTimeout`, local state → global filter)
- **"Best matches for you" featured row** — login + filtre yok + en az 1 eşleşen aktif post varsa:
  - Başlık: `auto_awesome` ikon + "Best matches for you" + lime count chip + "Based on your city, role & expertise" subtitle
  - 3 col responsive grid (`featured` PostCard'lar)
  - Alt: "All opportunities" divider
- **"Near me · {user.city}" quick toggle** — city input'unun üstünde pill buton (aktifken lime bg + plum text)
- Per-card `matchReasons` Map (`useMemo`) — visible listedeki her kart için chip üretir
- Search input `onChange` artık `setLocalSearch` (debounce tetikler), clear butonu da aynı

**Davranış:**
- Filtre: Domain, Project stage, Status, Posted by (Anyone/Engineer/Clinician pill toggle), City (input + Near me toggle), Country (input)
- Aktif filtre sayısı badge + "Clear filters" link
- "X of Y results" özeti
- Empty state: filtreye göre `search_off` vs `folder_open` + ilgili CTA

**Build:** temiz (1706 modül, 457 kB JS / 56 kB CSS gzip 125+11 kB, 2.4 sn, sıfır warning)

### ✅ Faz 5 — Meeting Workflow (v2 · hai-* palet + Feixen + card-based tasarım · 20·04·2026)
**Yeniden yazılan bileşenler:**

- **`ExpressInterestModal`** — rounded-[2rem] beyaz modal, plum/70 + backdrop-blur overlay, Escape kapatma:
  - Header: mint radial glow + plum "Express interest" pill badge + 26 px Feixen post title (2 satır clamp) + offwhite close button
  - Step indicator: responsive pill row (done=plum/mint · active=mint/plum · idle=offwhite/gray), dashes between pills, labels `hidden sm:inline`
  - **Step 1** Your message: textarea (custom inputCls rounded-xl + focus plum + teal shadow) + char counter pill (dot sinyali: amber <20 / teal ≥20)
  - **Step 2** NDA agreement: cream `shield_lock` kartı + büyük custom checkbox label (aktifken 2 px plum border + mint bg, plum check badge)
  - **Step 3** Propose times: "X / 3 filled" durum pill'i + slot rows (offwhite rounded-2xl wrapper + numbered disc + date + time + × butonu, 3'ten fazla için), dashed full-width "Add another slot" pill
  - Footer: offwhite bg, "Cancel" / "← Back" (beyaz pill) + "Next" / "I accept & continue" / "Send request" (plum pill, paper-plane ikonu son adımda)
  - Error state: red-50/red-200 rounded-2xl alert + error ikon

- **`MeetingCard`** — white rounded-[1.5rem] kart + subtle shadow, 5 bölüm:
  - Header: plum/mint avatar disc (partner initials) + direction pill (`call_received`/`call_made` + partner adı) + Feixen title (post detail'e link) + status pill (5 durum → hai-* palette mapping: pending=lime/plum, time_proposed=mint/plum, confirmed=plum/mint, declined=red-50/red-600, cancelled=neutral)
  - Message kartı: offwhite rounded-2xl + mono label + 13.5 px message body
  - Proposed slots: `schedule` label + SlotChip grid (offwhite rounded-2xl, `event` ikon + date/time, owner için plum "Accept →" butonu)
  - Confirmed slot: `event_available` aktif SlotChip (lime bg + plum/30 border) + info notice (Zoom/Teams dışarıda)
  - Actions row: offwhite/50 bg, Decline (red-200/red-600 pill) + Cancel request (neutral pill) — sadece `pending`/`time_proposed` durumunda

- **`MeetingsPage`** — yeni sekmeli yapı:
  - Header card (mint radial glow + pill badge 11): 56 px Feixen "Your meetings." + paragraph + stats ribbon pills (total + **awaiting you** lime pill with pulsing dot + confirmed plum pill)
  - **Tab row (horizontal scroll)**: All / Incoming (`call_received`) / Outgoing (`call_made`) / Confirmed (`check_circle`) — aktif tab plum+white, her tab count chip'li (aktifken mint/plum, idle offwhite/plum)
  - Sort: her bucket `statusOrder` (pending→time_proposed→confirmed→declined→cancelled) sonra `updatedAt` desc
  - List: `MeetingCard` dikey gap-4
  - Empty state (4 farklı mesaj: all/incoming/outgoing/confirmed): mint disc + `inbox` ya da `filter_alt_off` ikon + Feixen başlık + plum CTA ("Browse directory →" veya "Show all meetings")

**Build:** temiz (1706 modül, 464 kB JS / 59 kB CSS gzip 128+11 kB, 2.4 sn, sıfır warning)

### ✅ Faz 6 — Admin Panel (v2 · hai-* palet + Feixen + card tables · 20·04·2026)
**Yeniden yazılan sayfa:** `src/pages/admin/AdminPage.tsx`

- **Header card:** mint radial glow + **plum "Admin · Restricted" pill** (`admin_panel_settings` ikon, plum bg + mint text), 56 px Feixen "Control panel." + paragraph + stats ribbon pills (suspended count kırmızı · security events lime)
- **Stats grid (2 col → 4 col lg):** yeni `StatCard` bileşeni — rounded-[1.5rem] beyaz kart + radial tone glow (mint/cream/lime/plum) + 34 px Feixen değer + sağda 40x40 rounded-2xl ikon badge. 4 kart: Total users (mint/group), Suspended (cream/person_off), Active listings (lime/article), Security events (plum/shield)
- **Tab row:** MeetingsPage'deki pill-tab pattern — Users (group) / Posts (article) / Activity logs (history). Aktif=plum+white, idle=white+border. Her sekmede count chip (aktifken mint/plum)

**Users tab:**
- Tablo üstünde offwhite search bar (name/email/institution) + "X of Y shown" sayacı
- Tablo: beyaz rounded-[1.75rem] kart wrapper, offwhite/60 th arkaplanı
  - Member column: plum/mint avatar disc (initials) + Feixen name + mono email
  - Role: offwhite pill + role ikonu (`memory`/`stethoscope`) + label
  - Institution: 220 px truncate body text
  - Status: mint/plum (active) veya red-50/red-600 (suspended) pill (teal/red dot)
  - Last active: mono tarih
  - Actions: beyaz pill (Reinstate=plum border / Suspend=red-200+red-600) + `person_add`/`block` ikon
  - Hover: mint/20 row; suspended row: red-50/40 bg

**Posts tab:**
- Beyaz kart tablo: Title (Feixen bold truncate) · Author · Domain (mint pill + teal dot) · Status (5 durum → hai-* mapping) · Created · Actions (Remove red pill + `delete` ikon)
- Hover mint/20 row

**Logs tab:**
- Filter bar (offwhite bg): 2 pill-shaped select (rounded-full + chevron SVG, `letterSpacing: 0.08em + uppercase`) — actions + results, "Clear" link (aktif filtre varsa), "X of Y entries" count, sağda plum "Export CSV" pill (`download` ikon)
- Tablo (min-w 920 px): Timestamp · User email · Role · Action (critical=red-600 bold + `warning` ikon, diğerleri plum semibold) · Target · Result pill (mint/red) · IP
- Failure row: red-50/30 bg tint; success row: hover mint/15
- Footer banner: offwhite/60 + `lock` ikon + "Logs are tamper-resistant · No deletion permitted · Retention 24 months"

**Build:** temiz (1706 modül, 472 kB JS / 60 kB CSS gzip 129+11 kB, 2.5 sn, sıfır warning)
- **Posts:** Tüm ilanlar tablosu, Remove butonu (owner'a bildirim gönderir)
- **Activity Logs:** 20 seed log, Action + Result filtreleri, hata satırları kırmızı vurgulu
- **CSV Export:** Filtrelenmiş logları `healthai-logs-YYYY-MM-DD.csv` olarak indirir
- Tamper-resistant notu: "No deletion permitted. Retention: 24 months."
- 4 stat widget: Total users, Suspended, Active listings, Security events

### ✅ Faz 7 — Profile & GDPR (v2 · hai-* palet + Feixen + card-based tasarım · 20·04·2026)
**Yeniden yazılan sayfa:** `src/pages/profile/ProfilePage.tsx`

- **Header card:** mint radial glow + pill badge (16 · Profile) + 56 px Feixen "Your profile." + **identity strip** (offwhite rounded-[1.5rem]):
  - Sol: 64×64 plum/mint avatar disc (initials, 20 px mono bold)
  - Orta: 22 px Feixen name + role pill (`memory`/`stethoscope`/`admin_panel_settings` ikonlu, beyaz bg + plum text) + `verified` mint pill (isVerified) + mono email + "Member since {Month Year}"
  - Sağ: 2 adet mini beyaz stat kartı (Posts / Meetings, 20 px Feixen değer + mono label)
- **Save success banner:** mint/teal rounded-2xl + `check_circle` ikon (2.5 sn auto-hide)

**Edit form — 4 SectionCard:**
- Her section: beyaz rounded-[1.75rem] kart + sol-başta 36×36 mint disc'li numara (01-04) + 20 px Feixen title + 12.5 px subtitle
- **01 Identity:** Full name + Institution (her biri FormField + inputStyle + plum focus ring + teal shadow)
- **02 Location:** City + Country (md:grid-cols-2)
- **03 About:** Bio textarea (5 satır, resize-y, "Optional · max 400 chars" hint)
- **04 Expertise tags:**
  - Input + plum "Add" pill (add ikonu + disabled state tagInput boşsa)
  - Boş state: dashed border rounded-2xl + mint `auto_awesome` disc + "No tags yet. Add keywords to improve post matching."
  - Dolu state: **hai-lime tag pill'leri** (plum text font-bold) + yuvarlak × butonu (hover'da plum bg + mint text)

**Sticky save action:** rounded-full beyaz bar + shadow → sol (sm+): teal dot + "Unsaved changes are kept locally" · sağ: plum "Save changes →" pill (shadow ile)

**GDPR section (`shield_lock` başlık):**
- **2 col grid** (md+):
  - **Export card** — beyaz rounded-[1.5rem] + **lime radial glow** + lime/plum ikon disc (`download`) + 17 px Feixen "Export my data" + açıklama + "GDPR Art. 20 · Right to data portability" mono caption + plum "Export JSON" pill (`file_download` ikon). Başarı durumunda mint banner (`download_done` ikon, 2.5 sn)
  - **Delete card** — beyaz rounded-[1.5rem] + **2 px red-100 border** + red-50 ikon disc (`delete_forever`) + 17 px Feixen red-600 "Delete account" + açıklama + "GDPR Art. 17 · Right to erasure · Demo only" mono caption + red outlined "Delete account" pill (`warning` ikon)
- Alt mono notice: `lock` ikon + "All data is stored encrypted at rest. Audit logs related to your account are retained for 24 months per our privacy policy, even after account deletion."

**DeleteModal (yeniden tasarlandı):**
- Plum/70 + backdrop-blur overlay, Escape ile kapatma
- rounded-[2rem] beyaz panel, 40 px shadow
- Red-50 "Danger zone" pill (`warning` ikonlu) + 24 px Feixen "Delete your account?"
- Açıklama + `Type DELETE to confirm` mono label + offwhite rounded-xl input (odakta red-400 border + beyaz bg + red shadow)
- Footer: Cancel (beyaz pill) + Delete account (red-600 pill + `delete_forever` ikon + red shadow), disabled state typed !== 'DELETE' iken neutral-200

**Build:** temiz (1706 modül, 479 kB JS / 61 kB CSS gzip 130+11 kB, 2.4 sn, sıfır warning)

### ✅ Faz 8 — Güvenlik & NFR (v2 · hai-* palet + Plus Jakarta Sans + card treatment · 20·04·2026)
**Yeniden yazılan bileşenler:**

- **`CookieConsentBanner`** — alt-ortada floating pill-card:
  - **Plum card** (rounded-[1.75rem]) + mint/15 ikon disc (`cookie`) + mint radial glow (sol-üst)
  - GDPR badge pill (mint dot + mint/80 text) + mint-linked paragraph (Privacy policy link)
  - **Essential only** (transparent + mint/30 border) + **Accept all** (mint bg + plum text + mint shadow, `check` ikon)
  - Mount'ta slide-up + opacity transition (60 ms delay), kapatırken 220 ms slide-down

- **`SessionTimeoutModal`** — plum/70 + backdrop-blur overlay, rounded-[2rem] beyaz kart:
  - Mint radial glow header
  - **Durum pill**: normal → lime/plum + `schedule` ikon · critical (≤20 sn) → red-50/red-600 + `warning` ikon
  - 26 px Plus Jakarta Sans "Still there?" + teal soru işareti
  - 20 px countdown sayısı (Plus Jakarta Sans bold, renkli: plum→red-600 critical'da)
  - **Progress bar** (teal → red geçişi, width 1 sn linear transition, bg-color 500 ms ease)
  - Action row: Sign out (beyaz pill) · Stay signed in (plum pill + `refresh` ikon + shadow, flex-1)
  - ARIA: `role="alertdialog"` + labelledby + describedby + progressbar

- **`PrivacyPage`** — header card + 7 SectionCard + contact footer kartı:
  - **Header card**: mint radial glow + 56 px "Privacy / policy." başlığı (teal nokta) + 3 pill badge row (GDPR compliant · Last updated 19 Apr 2026 · EEA)
  - **SectionCard**: beyaz rounded-[1.5rem] kart + numaralı disc (tone'a göre: mint/lime/cream/plum) + 20 px Feixen başlık + ikon badge (cream/mint/lime opak arka planlı)
  - 01 Who we are (mint · corporate_fare) · 02 Data we collect (lime · database) · 03 Legal basis (cream · gavel) · 04 Data retention (mint · schedule) · 05 Your rights (lime · account_circle) · 06 Cookies (cream · cookie) · 07 Data transfers (mint · public)
  - Bölüm içi `BulletRow` — teal dot + bold plum label + body text
  - **Data retention** section: özel 3-col grid (offwhite · lime/60 · mint renkli mini kartlar: "While active" / "24 months" / "In-memory")
  - **Data we collect** section alt notu: cream kart (`block` ikon) + "We do not collect patient data…"
  - Mail / `.edu` mentions: offwhite/mint rounded mono pill formatı
  - **Contact footer**: plum kart + mint radial glow + mint/15 `contact_support` disc + "Reach out anytime." başlık + mailto link
  
**LoginPage rate limiting** (Faz 2'de zaten hai-* palette yazılmış, dokunulmadı):
- 3 başarısız → sarı uyarı kartı; 3. denemede 60 sn cooldown + progress bar, buton disabled

**Build:** temiz (1706 modül, 486 kB JS / 63 kB CSS gzip 131+12 kB, 2.5 sn, sıfır warning)

### ✅ Faz 9 — Polish, Seed Data & Demo Hazırlığı (v2 · 20·04·2026)

**Error pages (redesigned · hai-* palet + Plus Jakarta Sans):**
- **`NotFoundPage` (`/404`)** — beyaz rounded-[2rem] kart + çift radial glow (mint sağ-üst + lime sol-alt); 22 vw (~220 px) "4·0·4" numerals (0 teal vurgulu); Err badge pill (offwhite + teal/30 border + `explore_off`); "We can't find that page." başlık (Plus Jakarta Sans bold, 44 px, teal nokta); kırık URL için mono pill (`link` ikon + truncate); aksiyon sırası: Go back (outline) · Back to home (plum pill + shadow + `home`) · Browse posts (mint pill + `grid_view`); alt "Quick links" grid (Dashboard / Meetings / Profile → offwhite→mint hover, teal ikon + `arrow_forward`)

- **`UnauthorizedPage` (`/403`)** — aynı kart dil, red-50/red-200 "Err · 403" pill + `lock` ikon; 4·0·3 numerals (0 kırmızı); "You don't have access." başlık (kırmızı nokta); kullanıcı auth durumuna göre dinamik: signed-in → rol badge'ü (mint pill + `badge` ikon) + "Back to dashboard" CTA · signed-out → "Sign in" CTA; ayrıca "Contact admin" (cream pill, mailto:admin@healthai.edu); alt bilgi satırı: `info` ikon + "Common reasons: pending verification / suspended / admin-only"

**Skeleton loading primitives** (`src/components/ui/Skeleton.tsx` — yeni):
- `<Skeleton/>` low-level (width/height/rounded='sm'|'md'|'lg'|'full'|number)
- `<SkeletonLine/>` · `<SkeletonPill/>` · `<SkeletonCircle size/>` helpers
- `<PostCardSkeleton/>` — canlı `PostCard` layout'una birebir aynalayan iskelet (domain+status pill · 2 başlık çizgisi · 3 description line · 3 tag pill · avatar+meta footer) → veri geldiğinde sıfır layout shift
- `<SkeletonGrid count={6}/>` — responsive grid wrapper
- **CSS:** `globals.css` içine `@keyframes skeletonShimmer` + `.skeleton-shimmer` utility (offwhite base + mint/55 gradient, 1.4 s ease-in-out); `@media (prefers-reduced-motion: reduce)` altında shimmer kapanır

**Seed data enrichment** (`mockMeetings.ts` 3 → 7 toplantı):
- `m4` — Elena → Marco · stroke FL · time_proposed · 3 slot (Berlin ↔ Barcelona)
- `m5` — Elena → Kenji · fall-detection pilot · **confirmed** · Berlin ward (cross-city)
- `m6` — Ingrid → Kenji · mental health NLP · **declined** (ethics review perspektifi) — `declined` status ilk kez seed'de
- `m7` — Marco → Ingrid · BMD regression · pending · 3 slot
- Artık Meetings sayfasında 4 farklı status (pending · time_proposed · confirmed · declined) ve her tab'da (All/Incoming/Outgoing/Confirmed) en az birkaç kart görünüyor
- Seed özeti: **5 user · 10 post · 7 meeting · 20 log** (roadmap NFR minimumları ≥ 5 / 10 / — / 20 karşılanıyor)

**`README.md` (yeni)** — 5 000+ karakter proje tanıtımı:
- Stack · fonts · palette · quick-start komutları
- **Demo accounts tablosu** (5 hesap · e-mail · rol · şehir · kullanılabilecek akış örnekleri)
- **6 demo senaryosu** → faz eşlemesi (Register/Login · Post mgmt · Search/Match · Meeting flow · Admin · Profile/GDPR)
- Klasör yapısı ağacı (`src/` + `.planning/` birebir)
- Feature surface · architectural notes (Zustand+localStorage contract, role guards, typography, responsive breakpoints, reduced-motion)
- Accessibility notları (landmarks · keyboard PostCard · ARIA · WCAG AA renk çiftleri)
- Planning artefakt linkleri (`roadmap.md` + `SNAPSHOT.md`)

**Responsive & a11y** (mevcut durum doğrulaması — yeni kod yok):
- Breakpoints: 1100 px (scroll-ind gizleniyor) · 880 px (hero-grid single-col, topbar-nav gizleniyor, foot-cols 2-col) · 760 px (sidebar stack, mobile-menu-btn flex, stats 2-col) · 480 px (tüm grid'ler 1-col)
- ARIA: SessionTimeoutModal `alertdialog` + progressbar · CookieConsentBanner `dialog` · ExpressInterestModal keyboard Escape · PostCard `role="link"` + Enter/Space handler
- Reduced-motion: `step-in-right/left` + `skeleton-shimmer` otomatik devre dışı

**Build:** temiz (1706 modül, 496 kB JS / 64 kB CSS gzip 132+12 kB, 2.5 sn, sıfır TS error / sıfır lint warning)

### 🔤 Font stack cleanup — 20·04·2026 (post-Faz 9)
Canlı kodda kalan tek "system monospace" ve stale Manrope/Space Grotesk izleri temizlendi. Hedef: uygulamada sadece iki gerçek font ailesi render edilsin (Plus Jakarta Sans + Source Sans 3) — `font-mono` pill/badge'ler dahil.

- **`tailwind.config.js`** — `fontFamily.mono` Tailwind default stack'inden (`ui-monospace`, `SFMono-Regular`, `Menlo`, `Consolas`…) Plus Jakarta Sans'a override'landı. Bu tek değişiklik, kod tabanındaki **50+ `font-mono` pill/label** kullanımını otomatik olarak brand tipografisine taşıdı (PostCard match chips, status badges, landing stepper, cookie banner, session modal, admin tabs, profil kartları, 404/403 Err pill'leri…)
- **`globals.css`** — `--ff-mono` CSS değişkeni `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` stack'inden Plus Jakarta Sans'a remap edildi (ilgili inline style'lar da aynı aileye düştü)
- **Stale yorum temizliği:**
  - `LandingPage.tsx` header comment → "Plus Jakarta Sans (display / pill caps) + Source Sans 3 (body) + Material Symbols"
  - `Navbar.tsx` JSDoc → "Plus Jakarta Sans (display / caps pills) + Source Sans 3 (body)"
  - `AppLayout.tsx` JSDoc → "hai-offwhite surface + Source Sans 3 body font"
  - `FormField.tsx` JSDoc → "hai-* palette + Plus Jakarta Sans / Source Sans 3 typography"
- **Doğrulama:** `src/**` içinde `Manrope|Space Grotesk|IBM Plex|Newsreader|Studio Feixen|ui-monospace|SFMono|Menlo|Consolas` regex'i sıfır eşleşme döndürüyor (kalan mention'lar sadece `.planning/SNAPSHOT.md` tarihsel log + `.instructions/UI_UX_SKILL.md` skill örneği)
- **Build:** temiz (1706 modül, 496 kB JS / 64 kB CSS gzip 132+12 kB, 2.5 sn)

### 🎛️ Navbar micro-interactions — 20·04·2026 (post font cleanup)
Navbar sistemi iki farklı hover davranışıyla iki katmanlı bir hiyerarşiye kavuştu: **sessiz center-nav wash** (bilişsel yük az, odaklanma yüksek) + **gösterişli CTA lift+shadow bloom** (dönüşüm butonları için).

#### 1) Center-nav premium hover — `Navbar.tsx` (authenticated) + `LandingPage.tsx · TopNav` (marketing)
Uygulanan spec, iki navbar'da birbiriyle bire bir aynı:
- `px-4 py-2` tap target (önceki `py-1.5`'ten daha cömert)
- `rounded-lg` (pill `rounded-full`'dan yumuşak square-ish forma — premium editorial his)
- `transition-colors duration-200 ease-in-out`
- Idle: `text-neutral-600`
- Hover: `text-neutral-900` + `bg-black/5` — **arka plan tonuyla çatışmayan** çok yumuşak koyulaşma + şeffaf gri wash
- Aktif route (sadece authenticated Navbar'da): `bg-hai-mint text-hai-plum` (korundu, sadece `rounded-full` → `rounded-lg` hizalandı)

#### 2) NavDivider helper — `LandingPage.tsx`
Landing TopNav'in merkez pill'inde 4 link arasında dikey ayraçlar var. Eski `border-r border-neutral-100` yaklaşımı `rounded-lg` hover wash ile çarpışıyordu. Çözüm:

```tsx
function NavDivider() {
  return <span aria-hidden className="mx-0.5 h-4 w-px self-center bg-neutral-200" />
}
```

Ayraç `<a>` hover kutusunun **dışında** yaşadığı için wash animasyonu hiç clip olmuyor. `h-4 w-px bg-neutral-200`, `self-center` + `mx-0.5` ritim için ince nefes.

#### 3) CTA hover recipe — lift + shadow bloom + eased color (Sign in / Sign up / Go to Dashboard / Request Access)
Hepsinde birebir aynı recipe (sadece shadow tonu buton renk ailesine göre farklı):

| Property            | Idle                                        | Hover                                        | Active                                     |
|---------------------|---------------------------------------------|----------------------------------------------|--------------------------------------------|
| `transform`         | `translate-y-0`                             | `-translate-y-0.5` (2 px yukarı lift)        | `translate-y-0` (baskı feedback)           |
| `shadow` (solid btn)| `0_6px_18px_-8px_rgba(0,0,0,0.4)`           | `0_16px_32px_-10px_rgba(0,0,0,0.45)` (bloom) | `0_4px_12px_-6px_rgba(0,0,0,0.35)`         |
| `shadow` (ghost btn)| `0_2px_8px_-4px_rgba(0,0,0,0.15)`           | `0_12px_26px_-10px_rgba(0,0,0,0.25)`         | idle'a geri döner                          |
| `shadow` (plum btn) | `0_4px_14px_-4px_rgba(54,33,62,0.35)` **plum-tinted** | `0_12px_26px_-8px_rgba(54,33,62,0.5)` | `0_3px_10px_-4px_rgba(54,33,62,0.3)`       |
| `bg`                | plum / black / transparent                  | black / neutral-800 / white/70               | —                                          |
| `border`            | (ghost) `neutral-900/30`                    | `neutral-900/50`                             | —                                          |
| `transition`        | `transition-all duration-[250ms] ease-out will-change-transform` (3 property senkron) |                                              |                                            |

**Tasarım kararları:**
- `ease-out` eğrisi: giriş hızlı → çıkış yumuşak (yay hissi, premium)
- `duration-[250ms]` — Tailwind default 200/300'ün arasında bilinçli sweet spot
- `will-change-transform` — GPU layer promotion, 60 fps pürüzsüz animasyon
- **Plum tinted shadow** (Request Access): `rgba(54,33,62,...)` = `hai-plum` rgb karşılığı. Düz siyah shadow beyaz pill içinde soğuk hissettiği için brand renkli drop tercih edildi. Buton rengi + shadow tonu "aynı hikâyeyi" anlatıyor.

#### Etkilenen dosyalar
- `src/components/layout/Navbar.tsx` — center nav hover recipe
- `src/pages/LandingPage.tsx` — center nav hover recipe + `NavDivider` helper + Sign in/up + Go to Dashboard + Request Access CTA recipe

**Build:** temiz (1706 modül · 497 kB JS / 68 kB CSS gzip 132+12 kB · 3.7 sn · sıfır warning)

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
