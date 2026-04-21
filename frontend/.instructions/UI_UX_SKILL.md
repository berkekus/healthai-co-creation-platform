---
name: healthai-ui-ux
description: HEALTH AI Co-Creation Platform'un görsel dili, tipografi / renk / hareket sözleşmeleri ve mikro-etkileşim katalogu. Yeni bir sayfa, kart, buton veya modal tasarlarken bu dosyadaki kurallara uy.
---

# UI / UX SKILL — HEALTH AI Co-Creation Platform

Bu dosya projenin **marka görsel dilini** ve **mikro-etkileşim sözleşmesini** tanımlar. Yeni bir bileşen tasarlarken önce bu dosyayı oku; jenerik "AI slop" estetiği (Inter, mor gradient, ortalanmış hero + 3 özellik kartı) yasak. Her karar markalı, tutarlı ve ölçülmüş olmalı.

_Son güncelleme: 2026-04-20 — tipografi Plus Jakarta Sans + Source Sans 3; navbar premium micro-interaction sistemi yerleşti; 404/403 hata sayfaları redesign; Skeleton primitives eklendi._

---

## 1. Tasarım Kimliği

**Co-creation directory:** Mühendisler ile sağlık profesyonellerini yapılandırılmış bir platformda buluşturan ciddi ama sıcak, editöryal tonlu bir ürün. Hastane kliniği sterilliği yok — bir araştırma derleyicisinin editorial ferahlığı + bir Payard banking'in rounded yumuşaklığı.

**Üç kelime:** _structured, trust-first, quietly premium._

### Kaçınılan jenerik desenler
- ❌ Inter / Roboto / Arial / system-ui tek başına
- ❌ Mor gradient "SaaS" hero'ları
- ❌ `text-gray-500` + sharp corner + center-aligned her şey
- ❌ `text-4xl font-bold` "Welcome to [Product]" + 3 tile altında
- ❌ Stock icon + "Feature 1 / Feature 2 / Feature 3" grid

### Projemizde her zaman
- ✅ `hai-plum` ink + soft mint/lime/cream radial glow'lar
- ✅ Plus Jakarta Sans (display / caps / buton) + Source Sans 3 (body)
- ✅ Rounded-card mimarisi (1.5rem / 1.75rem / 2rem aile)
- ✅ Uppercase caps labels (10–11 px mono, 0.14–0.18em tracking) section-header'lar için
- ✅ Radial glow'lu header'lar (`#B8F3FF 0% → transparent 70%`)
- ✅ Pill-first CTA'lar (`rounded-full`)

---

## 2. Renk Paleti

`tailwind.config.js` içinde tanımlı. HEX değerleri ezberlenir çünkü `rgba` ihtiyacında (shadow / glow) manuel yazılır.

| Token           | HEX       | RGB              | Kullanım                                                         |
|-----------------|-----------|------------------|------------------------------------------------------------------|
| `hai-plum`      | `#36213E` | `54, 33, 62`     | Primary ink · CTA fill · başlık rengi · brand shadow             |
| `hai-teal`      | `#8AC6D0` | `138, 198, 208`  | Aktif ikon tonu · interactive accent · küçük dot vurguları       |
| `hai-mint`      | `#B8F3FF` | `184, 243, 255`  | Hover fill · radial glow · badge chip                            |
| `hai-lime`      | `#D2FF74` | `210, 255, 116`  | Enerjik aksan (featured match, near-me active, positive)         |
| `hai-cream`     | `#E3DCD2` | `227, 220, 210`  | Nötr/legal ton (privacy, disabled)                               |
| `hai-offwhite`  | `#F3F4F6` | `243, 244, 246`  | App surface bg · disabled field · pill nötr                      |

### Shadow rgba tercihleri

- **Siyah buton shadow**: `rgba(0, 0, 0, 0.35–0.50)`
- **Plum buton shadow (brand-tinted)**: `rgba(54, 33, 62, 0.35–0.50)` ← beyaz yüzey üzerinde **kesinlikle tercih edilir**
- **Ghost/outline shadow**: `rgba(0, 0, 0, 0.15–0.25)` — çok hafif, sadece hover'da görünür

Kural: **buton rengi ile shadow tonu aynı hikâyeyi anlatmalı.** Plum buton + siyah shadow = soğuk, yabancı. Plum buton + plum shadow = sıcak, markalı.

### Gradient & glow reçeteleri

```tsx
/* Mint radial glow — en yaygın */
<div className="absolute top-0 right-0 w-72 h-72 pointer-events-none opacity-60"
     style={{ background: 'radial-gradient(circle, #B8F3FF 0%, transparent 70%)' }} />

/* Lime glow (pozitif / CTA teşviki) */
<div className="absolute bottom-0 left-0 w-80 h-80 pointer-events-none opacity-50"
     style={{ background: 'radial-gradient(circle, #D2FF74 0%, transparent 70%)' }} />

/* Hero linear gradient — teal → offwhite geçişi */
<div style={{ background: 'linear-gradient(180deg, #8AC6D0 0%, #F3F4F6 52%, #F3F4F6 100%)' }}>
```

Glow'lar **her zaman** `absolute` + `pointer-events-none` + `opacity-*` olmalı ki iş mantığına karışmasın.

---

## 3. Tipografi

### 3.1 Aileler

| Rol                                          | Aile                | Tailwind class                |
|----------------------------------------------|---------------------|-------------------------------|
| Büyük başlıklar, logo, buton, pill/caps label | Plus Jakarta Sans   | `font-headline` · `font-feixen` (alias) · `font-mono` |
| Paragraf, uzun okuma metni, form input       | Source Sans 3       | `font-body`                   |

Google Fonts'tan `index.html`'de yüklenir. **Başka font eklenmez.**

> `font-mono` utility'si Tailwind default `ui-monospace` stack'inden Plus Jakarta Sans'a override'landı. Yüzlerce mevcut `font-mono` pill/badge kullanımı otomatik olarak brand tipografisine düştü — yeni bir caps label yazarken `font-mono` sınıfını güvenle kullanabilirsin.

### 3.2 Kullanım reçeteleri

| Eleman                                       | Stil                                                               |
|----------------------------------------------|--------------------------------------------------------------------|
| Hero başlık                                  | `font-headline font-bold text-[40px]–[56px] leading-[0.98]–[1.02] tracking-[-0.025em]–[-0.035em] text-hai-plum` |
| Section başlık                               | `font-headline font-bold text-[20px]–[26px] leading-tight tracking-[-0.02em] text-hai-plum` |
| Body paragraf                                | `text-[14.5px]–[15.5px] text-neutral-600 leading-relaxed` (font-body default) |
| Caps label / pill                            | `text-[10px]–[11px] font-mono tracking-[0.14em]–[0.18em] uppercase font-bold` |
| Button label (CTA)                           | `text-[13px]–[14px] font-bold` (Plus Jakarta Sans default)         |
| Mono-style metadata (email, .edu tag, URL)   | `font-mono bg-hai-offwhite rounded px-1–1.5 text-[11px]–[12px] text-hai-plum font-bold` |

### 3.3 Başlıklarda vurgu noktası

Başlık sonlarına `hai-teal` nokta koy — bu projenin imzası:

```tsx
<h1 className="font-headline font-bold text-[44px] text-hai-plum">
  Still there<span className="text-hai-teal">?</span>
</h1>
```

Kırmızı alarm durumlarında (403, kritik uyarı) bu noktayı `text-red-500` yap.

---

## 4. Kompozisyon & Layout

### 4.1 Radius ailesi

- `rounded-[1.5rem]` — Post card, section card, küçük orta-boy
- `rounded-[1.75rem]` — Sidebar filter card, admin stat card, mid-size modal
- `rounded-[2rem]` — Hero header card, dashboard header, profil kartı, modal shell
- `rounded-full` — pill, badge, CTA, disc (numaralı/avatar)
- `rounded-lg` — **sadece** center-nav hover chamber'ları (8 px mikro rounded)
- `rounded-2xl` — mini iç kart (data retention 3-grid, skeleton iç eleman)

### 4.2 Shadow ölçek

| Amaç                                | rgba                                    |
|-------------------------------------|-----------------------------------------|
| Hero header card (geniş, yumuşak)   | `0_30px_80px_-30px_rgba(54,33,62,0.12)` |
| Modal shell                         | `0_40px_120px_-20px_rgba(54,33,62,0.5)` |
| CTA buton idle (solid)              | `0_6px_18px_-8px_rgba(0,0,0,0.4)`       |
| CTA buton hover (solid, bloom)      | `0_16px_32px_-10px_rgba(0,0,0,0.45)`    |
| CTA buton idle (plum-tinted)        | `0_4px_14px_-4px_rgba(54,33,62,0.35)`   |
| CTA buton hover (plum-tinted bloom) | `0_12px_26px_-8px_rgba(54,33,62,0.5)`   |
| Ghost/outline hover                 | `0_12px_26px_-10px_rgba(0,0,0,0.25)`    |

**Kural:** Shadow offset hover'da en az **2.5×**'ye çıkmalı; blur en az **2×** — küçük fark "blom" hissetmez, taze kalır.

### 4.3 Card anatomisi

```
┌──────────────────────────────────────────────┐
│ [radial glow mint/lime — opacity 60 absolute] │
│                                                │
│  [pill badge · icon + caps label]             │
│                                                │
│  Big Headline.                                │  ← font-headline 44 px
│  Short supporting copy…                       │  ← font-body 15 px
│                                                │
│  [stat / meta row — pill chips]               │
│                                                │
│  ─── border-t border-neutral-100 ───          │
│  [CTA row — 2–3 pill buton]                   │
└──────────────────────────────────────────────┘
```

### 4.4 Numaralı section disc'leri

Privacy, Profile, PostFormFields gibi uzun formlar `01`, `02`, `03` disc'li section header'larla bölünür:

```tsx
<div className="w-9 h-9 rounded-full bg-hai-mint text-hai-plum
                flex items-center justify-center font-mono font-bold text-[11px] tracking-[0.08em]">
  01
</div>
```

Tone rotasyonu: `mint · lime · cream · mint · lime · cream · mint` — ardışık aynı ton tekrar etmez.

---

## 5. Micro-interaction Katalogu

### 5.1 Hiyerarşi

**Sessiz wash** (sık tıklanan linkler, navigasyon) → **lift + shadow bloom** (dönüşüm butonları, prime CTA).

### 5.2 Center-nav hover (`Navbar.tsx` + `LandingPage · TopNav`)

```tsx
className="px-4 py-2 rounded-lg text-sm font-semibold
           transition-colors duration-200 ease-in-out
           text-neutral-600
           hover:text-neutral-900 hover:bg-black/5"
```

**Neden `bg-black/5`?** Markayı bozmayan, her zemin rengi üzerinde çalışan, göze girmeyen şeffaf gri wash. `bg-hai-mint/40` gibi brand rengi navigasyonda çok "bağırır"; CTA'yı öne çıkarmak için sessiz kalmalı.

**Aktif state (sadece authenticated Navbar):** `bg-hai-mint text-hai-plum rounded-lg` — hover'dan farklı, "nerede olduğunu" net söyler.

### 5.3 NavDivider pattern

Center-nav'de dikey ayraç istiyorsan `border-r` **yasak** (hover wash'unu clipler). Span olarak render et:

```tsx
function NavDivider() {
  return <span aria-hidden className="mx-0.5 h-4 w-px self-center bg-neutral-200" />
}
```

### 5.4 CTA lift + shadow bloom (prime action'lar)

Sign in / Sign up / Request Access / Go to Dashboard / Delete account gibi yüksek-değerli butonlarda:

```tsx
className="shadow-[0_6px_18px_-8px_rgba(0,0,0,0.4)]
           hover:-translate-y-0.5
           hover:bg-neutral-800
           hover:shadow-[0_16px_32px_-10px_rgba(0,0,0,0.45)]
           active:translate-y-0
           active:shadow-[0_4px_12px_-6px_rgba(0,0,0,0.35)]
           transition-all duration-[250ms] ease-out will-change-transform"
```

**Spec detayı:**
- Lift: `-translate-y-0.5` (= 2 px). Daha fazla "zıplar", daha az "hissetmez".
- Shadow: offset 6→16 px, blur 18→32 px (2–3× bloom).
- Duration: **250 ms** (Tailwind 200 & 300 arası sweet spot).
- Ease: `ease-out` (giriş hızlı → çıkış yumuşak = yay hissi).
- `will-change-transform` — 60 fps için GPU layer; memory maliyeti var, sadece CTA'larda kullan.

Plum-tinted buton ise shadow rgba'sını `(54, 33, 62)` yap (brand shadow).

### 5.5 PostCard hover

```tsx
className="transition-all hover:-translate-y-0.5
           hover:shadow-[0_20px_50px_-20px_rgba(54,33,62,0.2)]
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hai-teal focus-visible:ring-offset-2"
```

Featured kart ise shadow daha dramatik: `0_20px_60px_-25px_rgba(54,33,62,0.35)` → hover `0_30px_80px_-25px_rgba(54,33,62,0.45)`.

### 5.6 Modal açılışı

Plum/70 overlay + backdrop-blur-sm + scale/opacity in. Escape keyboard dinleyicisi zorunlu. Örnek: `ExpressInterestModal`, `SessionTimeoutModal`.

### 5.7 Stepper / step slide

Landing "How it works" step'leri için globals.css'te tanımlı `.step-in-right` / `.step-in-left` (0.38 s cubic-bezier). Reduced-motion altında kapanır.

### 5.8 Skeleton shimmer

`.skeleton-shimmer` utility (`globals.css`): offwhite base + mint/55 gradient, 1.4 s ease-in-out infinite. `prefers-reduced-motion` altında animasyon kapanır, sadece base color kalır.

---

## 6. Pill / Badge Katalogu

### 6.1 Durum (status) pill'leri

`PostStatusBadge.tsx` referans. Kalıp:
```tsx
<span className="inline-flex items-center gap-1.5
                 rounded-full px-2.5 py-1
                 text-[10px] font-mono tracking-[0.14em] uppercase font-bold
                 {bg} {text}">
  {label}
</span>
```

| Durum                 | Renkler                          |
|-----------------------|----------------------------------|
| `draft`               | `bg-neutral-100 text-neutral-600` |
| `active`              | `bg-hai-mint text-hai-plum`       |
| `meeting_scheduled`   | `bg-hai-lime text-hai-plum`       |
| `partner_found`       | `bg-hai-plum text-hai-mint`       |
| `closed`              | `bg-hai-cream text-hai-plum`      |
| `expired`             | `bg-red-50 text-red-600`          |
| Rate-limit / alarm    | `bg-red-50 text-red-600`          |

### 6.2 Match reason chip'leri

`PostCard`'ta "Best matches for you" için `MATCH_TONE_STYLE`:

| Tone        | Renk                                  |
|-------------|---------------------------------------|
| `city`      | `bg-hai-lime text-hai-plum`           |
| `country`   | `bg-hai-mint text-hai-plum`           |
| `role`      | `bg-hai-plum text-hai-mint`           |
| `expertise` | `bg-hai-cream text-hai-plum border border-hai-plum/15` |
| `domain`    | `bg-hai-offwhite text-hai-plum border border-hai-teal/40` |

### 6.3 Section header badge

Hero/header card'ların en üstünde, başlığın hemen üstünde:
```tsx
<div className="inline-flex items-center gap-2 bg-hai-offwhite border border-hai-teal/30
                rounded-full px-4 py-1.5 mb-5
                text-[11px] font-mono tracking-[0.18em] uppercase text-hai-plum font-bold">
  <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: '"FILL" 1' }}>
    shield_lock
  </span>
  <span className="text-hai-plum/70">19</span>
  <span>Privacy policy</span>
</div>
```

Section numarası (19, 03, vb.) hep `text-hai-plum/70` ile solgunlaştırılır — asıl label tam satürasyon.

---

## 7. İkon Sistemi

- **Material Symbols Outlined** (ana) — `material-symbols-outlined` class + `fontVariationSettings: '"FILL" 1'` opsiyonel solid versiyon için
- **lucide-react** — sadece authenticated Navbar'daki küçük aksiyon ikonları (Bell, LogOut, User, Settings, Menu, X)

### Material Symbols tercih nedeni
Tek font dosyası ile 2000+ ikon, variable axes (FILL / wght / opsz / GRAD) ile inline kontrol. Figma ile birebir aynı setten çizilmiş. `<span className="material-symbols-outlined text-[18px]">cookie</span>` kadar basit.

### Filled vs outline
- Hover/active state → `fontVariationSettings: '"FILL" 1'`
- Idle/default → outline (değer yok)

---

## 8. Formlar

`FormField.tsx`'te `inputStyle(error?)` helper ortak input görünümünü sağlar. Direkt `<input className="...">` yazma — helper kullan:

```tsx
import { inputStyle } from '../components/ui/FormField'

<input type="email" style={inputStyle(errors.email?.message)} />
```

**Input spec:**
- Background: `#FFFFFF`
- Border: `1.5px solid #E5E5E5` · error: `#DC2626`
- `rounded-[12px]` · `padding: 12px 16px`
- `fontSize: 15` · `fontFamily: Source Sans 3` · `fontWeight: 500`
- `color: #36213E` (hai-plum)
- Focus: border `#36213E` + hafif outer ring

Pill-style select (AdminPage tabs) → `fontFamily: Plus Jakarta Sans` + `rounded-full` + custom chevron SVG.

---

## 9. Accessibility Sözleşmesi

- **Landmark'lar:** `<header>`, `<nav>`, `<main>`, `<footer>` her layout shell'de
- **Focus ring:** `focus-visible:ring-2 focus-visible:ring-hai-teal focus-visible:ring-offset-2` — marka rengi
- **Card-as-link:** `role="link"` + `tabIndex={0}` + `onKeyDown` (Enter/Space) — `PostCard` referans
- **Modal:** `role="dialog"` (info) veya `role="alertdialog"` (blok) + `aria-labelledby` + `aria-describedby` + Escape listener
- **Progressbar:** SessionTimeout gibi countdown'larda `role="progressbar"` + `aria-valuemin/max/now`
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` altında shimmer + stepper slide + lift animasyonları kapanır
- **Kontrast:** `hai-plum` on `hai-offwhite`, `hai-plum` on `hai-mint/hai-lime` → WCAG AA geçer; açık gri zemin üzerinde `text-neutral-500` altına inme

---

## 10. Do / Don't Özet

### ✅ DO
- Header'lara mint / lime radial glow ekle (marka imzası)
- Pill/caps label'larda `font-mono` + `tracking-[0.14em]–[0.18em]` + `uppercase` + `font-bold`
- CTA butonlarında lift + shadow bloom + eased color — üçü bir arada
- Plum buton için plum-tinted shadow
- Başlık sonlarına `text-hai-teal` nokta (veya `text-red-500` alarm için)
- Numaralı section disc'lerini tone-rotate et (mint → lime → cream → …)
- Card-as-link için `role="link"` + keyboard handler
- Border-r ayraç yerine bağımsız `<NavDivider/>` span
- Form input'larında `inputStyle()` helper

### ❌ DON'T
- Tailwind default `font-mono` stack'ini kullanma (Plus Jakarta Sans'a override'lı zaten)
- Center-nav'de `bg-hai-mint/40` hover yapma — bu CTA'ya ait; nav için `bg-black/5`
- Hard `border-r` ayraç koyma (hover wash'unu kırıyor)
- `text-gray-*` kullanma — `text-neutral-*` üzerinden devam et
- 150 ms altında animasyon — cheap hissediyor
- Siyah shadow'u plum buton altına koy — brand uyumsuz
- Yeni font ekleme — Plus Jakarta Sans + Source Sans 3 + Material Symbols = 3 font, yeter
- Jenerik "Welcome to [Product] · 3 feature card" layout üretme

---

## 11. Referans Bileşenler (kopya-yapıştır için)

Yeni bir şey tasarlamaya başlarken şu dosyalara bak:

| Ne yapacaksın?          | Referans                                              |
|-------------------------|-------------------------------------------------------|
| Hero header card        | `src/pages/errors/PrivacyPage.tsx`                    |
| Data list + filter      | `src/pages/posts/PostListPage.tsx`                    |
| Tabbed inbox            | `src/pages/meetings/MeetingsPage.tsx`                 |
| Admin table + CSV       | `src/pages/admin/AdminPage.tsx`                       |
| Numaralı form sections  | `src/components/posts/PostFormFields.tsx`             |
| Modal (3-step wizard)   | `src/components/meetings/ExpressInterestModal.tsx`    |
| Alert dialog + progress | `src/components/ui/SessionTimeoutModal.tsx`           |
| Pill status badge       | `src/components/posts/PostStatusBadge.tsx`            |
| Match reason chips      | `src/components/posts/PostCard.tsx`                   |
| Skeleton primitive      | `src/components/ui/Skeleton.tsx`                      |
| Error page recipe       | `src/pages/errors/NotFoundPage.tsx`                   |
| CTA lift+shadow         | `src/pages/LandingPage.tsx` — TopNav Sign in / up     |
| Center-nav wash         | `src/components/layout/Navbar.tsx` — Center nav block |

---

## 12. Mantra

> **Quiet hierarchy, loud moments.**
> 
> Nav sessiz, CTA konuşur. Kart sakin, başlık düşer. Glow var ama fark etmez. Shadow bloom hover'da, idle'da yok. Her şey marka renk ailesinden çıksın; shadow'un bile plum tonu olsun.
