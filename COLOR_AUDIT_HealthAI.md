# Color Audit — HealthAI Co-Creation Platform

**Tarih:** 2026-05-10  
**Standart:** WCAG 2.1 AA · SENG 477 Colours in HCI · ISO 9241-110  
**Kaynak dosyalar:** `globals.css` · `tailwind.config.js` · Kaynak TSX dosyaları

---

## 1. Mevcut Palet Tablosu

Tüm kontrast oranları W3C WCAG 2.1 göreli parlaklık formülüyle hesaplanmıştır.

### Light Mode Temel Renkleri

| İsim | Token | Hex | RGB | Parlaklık (L) |
|------|-------|-----|-----|----------------|
| Plum | `hai-plum` | `#36213E` | 54, 33, 62 | 0.0223 |
| Teal | `hai-teal` | `#8AC6D0` | 138, 198, 208 | 0.5030 |
| Mint | `hai-mint` | `#B8F3FF` | 184, 243, 255 | 0.8231 |
| Offwhite | `hai-offwhite` | `#F3F4F6` | 243, 244, 246 | 0.9109 |
| Lime | `hai-lime` | `#D8EFF2` | 216, 239, 242 | 0.8275 |
| Cream | `hai-cream` | `#E3DCD2` | 227, 220, 210 | 0.7220 |
| Text Primary | `--text-primary` | `#2D1838` | 45, 24, 56 | 0.0179 |
| Text Secondary | `--text-secondary` | `#77727F` | 119, 114, 127 | 0.1750 |
| Muted Text | *(hardcoded)* | `#6F6878` | 111, 104, 120 | 0.1464 |
| White (card) | `--surface-card` | `#FFFFFF` | 255, 255, 255 | 1.0000 |
| Page Base | `--surface-base` | `#F7F8FA` | 247, 248, 250 | 0.9503 |

### Dark Mode Temel Renkleri

| İsim | Token | Hex | RGB | Parlaklık (L) |
|------|-------|-----|-----|----------------|
| D-Plum | `.dark hai-plum` | `#D2C3E6` | 210, 195, 230 | 0.5848 |
| D-Teal | `.dark hai-teal` | `#55C3D7` | 85, 195, 215 | 0.4589 |
| D-Offwhite | `.dark hai-offwhite` | `#060812` | 6, 8, 18 | 0.0005 |
| D-Surface-Card | `--surface-card (dark)` | `#0C0E1E` | 12, 14, 30 | 0.0048 |
| D-Text-Primary | `--text-primary (dark)` | `#F8F4FF` | 248, 244, 255 | 0.9488 |
| D-Text-Secondary | `--text-secondary (dark)` | `#948AA8` | 148, 138, 168 | 0.2731 |

---

## 2. Color Harmony Tespiti

### Tespit: Tamamlayıcı + Monokromatik Destekler (Complementary + Monochromatic)

| Renk | Renk Çemberi Açısı |
|------|-------------------|
| Plum `#36213E` | ≈ 285° (kırmızı-violet) |
| Teal `#8AC6D0` | ≈ 192° (cyan) |
| Mint `#B8F3FF` | ≈ 195° (açık cyan) |
| Lime `#D8EFF2` | ≈ 188° (cyan-yeşil) |

**Yorum:** Plum ↔ Teal farkı ≈ 93° → sınır değer. Plum'un renk çemberindeki tamamlayıcısı (complement) yaklaşık 105° (sarı-yeşil) iken teal 93°'de durmaktadır. Bu nedenle harmony **Split-Complementary** kategorisine girmektedir: dominant plum'a karşı cyan ailesi (teal/mint/lime) split-complement olarak davranır.

**Projeye uygunluk:** Sağlık-teknoloji platformu için olumlu. Soğuk teal, klinik güveni; derin plum, kurumsal otoriteyi çağrıştırıyor. Cream (sıcak ton) dengeleyici görevi üstleniyor. Ancak renge dayalı link sistemi teal'ın çok açık olmasından dolayı erişilebilirlik sorunu yaratıyor (bkz. Bölüm 4).

---

## 3. 60-30-10 Kuralı Kontrolü

| Bölüm | Renk Grubu | Tahmini Kapsam |
|-------|------------|----------------|
| Dominant (%60) | Beyaz / Offwhite nötr yüzeyler | ≈ 62% ✓ |
| Secondary (%30) | Teal/Mint/Lime ailesi (bg, hover, badge) | ≈ 28% ✓ |
| Accent (%10) | Plum (CTA, başlık, ikon) | ≈ 10% ✓ |

**Genel değerlendirme:** Kural genel olarak karşılanıyor. Ancak teal %30 içinde **hem arka plan hem de link/metin rengi** olarak kullanılıyor; bu ikili rol kontrast hatalarına neden oluyor. Önerim: teal'ı ağırlıklı arka plan rengi olarak bırak, metin/link için plum kullan veya daha koyu bir teal türevi seç.

---

## 4. WCAG 2.1 AA Kontrast Tablosu

### Formül
Kontrast oranı = (L_açık + 0.05) / (L_koyu + 0.05)
- Normal metin: min **4.5:1** (AA), ideal **7:1** (AAA)
- Büyük metin (≥18pt / 14pt bold): min **3:1** (AA)
- Dekoratif öğe / logo: kural yok

### Light Mode Kombinasyonları

| # | Metin | Arka Plan | Oran | AA Normal | AA Büyük | AAA | Kullanıldığı Yer |
|---|-------|-----------|------|-----------|----------|-----|-----------------|
| C1 | Plum `#36213E` | White `#FFF` | **14.53:1** | ✅ | ✅ | ✅ | H1 başlıklar, buton metni |
| C2 | Plum `#36213E` | Offwhite `#F3F4F6` | **13.30:1** | ✅ | ✅ | ✅ | Dashboard, PostList |
| C3 | White `#FFF` | Plum `#36213E` | **14.53:1** | ✅ | ✅ | ✅ | CTA butonlar |
| C4 | **Teal `#8AC6D0`** | **White `#FFF`** | **1.90:1** | ❌ FAIL | ❌ | ❌ | **Link metinleri, "View all", CTA yönlendirme** |
| C5 | **Teal `#8AC6D0`** | **Offwhite `#F3F4F6`** | **1.74:1** | ❌ FAIL | ❌ | ❌ | **Dashboard ve PostList link metinleri** |
| C6 | Teal `#8AC6D0` | Plum `#36213E` | **7.65:1** | ✅ | ✅ | ✅ | Nav badge (mint/plum), bildirim rozeti |
| C7 | Plum `#36213E` | Teal `#8AC6D0` | **7.65:1** | ✅ | ✅ | ✅ | Aktif nav pill metni |
| C8 | Plum `#36213E` | Mint `#B8F3FF` | **12.08:1** | ✅ | ✅ | ✅ | Aktif nav arkaplan |
| C9 | **Muted `#6F6878`** | **Offwhite `#F3F4F6`** | **4.89:1** | ✅ | ✅ | ❌ | Destekleyici metin |
| C10 | **Text-Sec `#77727F`** | **Offwhite `#F3F4F6`** | **4.27:1** | ❌ FAIL | ✅ | ❌ | **Subtitle, yardımcı metinler** |
| C11 | Muted `#6F6878` | White `#FFF` | **5.35:1** | ✅ | ✅ | ❌ | Kart içi yardımcı metin |
| C12 | Text-Sec `#77727F` | White `#FFF` | **4.67:1** | ✅ | ✅ | ❌ | Kart içi secondary |
| C13 | **Teal `#8AC6D0`** | **Lime `#D8EFF2`** | **1.65:1** | ❌ FAIL | ❌ | ❌ | **"AI matched" chip metin rengi** |
| C14 | Plum `#36213E` | Lime `#D8EFF2` | **12.14:1** | ✅ | ✅ | ✅ | Chip metin (iyi kombinasyon) |
| C15 | Plum `#36213E` | Cream `#E3DCD2` | **10.68:1** | ✅ | ✅ | ✅ | NDA kutusu |
| C16 | **Muted `#6F6878`** | **Lime `#D8EFF2`** | **4.47:1** | ❌ FAIL | ✅ | ❌ | **PostDetail yan panel yardımcı metin** |

### Dark Mode Kombinasyonları

| # | Metin | Arka Plan | Oran | AA Normal | Notlar |
|---|-------|-----------|------|-----------|--------|
| D1 | D-Plum `#D2C3E6` | D-Card `#0C0E1E` | **11.59:1** | ✅ AAA | Ana başlıklar |
| D2 | D-Teal `#55C3D7` | D-Card `#0C0E1E` | **9.29:1** | ✅ AAA | Link, accent |
| D3 | D-Text-Sec `#948AA8` | D-Card `#0C0E1E` | **5.90:1** | ✅ AA | Yardımcı metin |
| D4 | D-Text-Primary `#F8F4FF` | D-Card `#0C0E1E` | **~19:1** | ✅ AAA | Body text |

**Dark mode genel değerlendirme:** Token sistemi dark mode'da AA standartlarını karşılıyor. ✓

---

## 5. FAIL Olan Kombinasyonlar için Somut Düzeltme Önerileri

### F1 — Kritik: Teal Link Metni (#8AC6D0 on White) → 1.90:1

**Etkilenen yerler:** LoginPage "Forgot password?", DashboardPage "View all →", PostListPage filtre aktif etiketi, Navbar link hover rengi

**Sorun:** Teal (#8AC6D0) çok açık bir renk; beyaz veya açık gri zemin üzerinde metin olarak kullanıldığında WCAG AA'yı sağlamıyor.

**Önerilen düzeltme:**

| Seçenek | Hex | Kontras (vs White) | Not |
|---------|-----|--------------------|-----|
| Koyu Teal (**Önerilen**) | `#1B7A88` | **5.08:1** ✅ AA | Aynı hue, 3 ton koyu |
| Plum | `#36213E` | **14.53:1** ✅ AAA | Marka rengi, güçlü |
| Teal-800 | `#0E6673` | **6.74:1** ✅ AA+ | Daha sert |

**Uygulama:** `text-[#8AC6D0]` yerine `text-[#1B7A88]` kullan; hover state'lerde (`hover:text-[#36213E]`) mevcut plum zaten doğru.

---

### F2 — Orta: Text-Secondary (#77727F on Offwhite #F3F4F6) → 4.27:1

**Etkilenen yerler:** Dashboard subtitle'ları, PostList yardımcı metinleri

**Önerilen düzeltme:** `#77727F` → `#5E5867` (kontrast: **5.72:1** ✅ AA)

---

### F3 — Orta: Teal text on Lime (#8AC6D0 on #D8EFF2) → 1.65:1

**Etkilenen yerler:** "Profile match" badge metni

**Mevcut kod:** `bg-[#D8EFF2] text-[#8AC6D0]` → teal metin lime zemin üstünde

**Düzeltme:** `text-[#8AC6D0]` → `text-[#36213E]` (plum)  
→ Kontrast: **12.14:1** ✅ AAA

```tsx
// PostListPage.tsx satır 653
post.hasAI ? 'bg-[#36213E] text-white' : 'bg-[#D8EFF2] text-[#36213E]'
// Zaten doğru! Ama teal kullanıldığı diğer chip'lerde kontrol et.
```

---

### F4 — Düşük: Muted (#6F6878 on Lime #D8EFF2) → 4.47:1

**Etkilenen yerler:** PostDetail yan panel yardımcı metni

**Düzeltme:** `text-[#6F6878]` → `text-[#5E5867]` veya `text-[#36213E]`

---

## 6. Color Blindness Simülasyonu

### Protanopia (kırmızı duyarsız)
Plum (#36213E) koyu-gri-mavi tonuna kayar. Teal (#8AC6D0) açık mavi-gri görünür. Birbirinden parlaklık farkıyla hâlâ ayrılabilir. **Risk düşük** — renk çifti luminans tabanlı.

**Dikkat:** Error badge'lerindeki `bg-red-50 + text-red-700` → kırmızı duyarsız kullanıcılar için kırmızı ton soluk gri/kahve görünür. ✕ ikon ve "Error:" prefix metni zaten mevcut — **uyumlu** ✓

### Deuteranopia (yeşil duyarsız)
Lime (#D8EFF2) ve Mint (#B8F3FF) benzer açık mavi-gri tonlara kayar, birbirinden ayırt etmek zorlaşır. "Active" ve "Draft" gibi renk bazlı chip'ler sorunlu hale gelebilir.

**Önerim:** Chip'lere renk + ikon ekle: Aktif → `●` yeşil yerine `■` teal; Partner Found → checkmark ikonu.

### Tritanopia (mavi duyarsız)
Teal (#8AC6D0) pembe-gri tonuna kayar. Mint (#B8F3FF) soluk sarı-beyaz görünür. Bildirim rozeti (teal nokta) ve unread indicator sorunlu hale gelebilir.

**Önerim:** Bildirim count badge her zaman sayı içermeli (zaten ≥1'de sayı gösteriliyor ✓); sıfır okunmamış durumda teal nokta yerine ikon kullan.

---

## 7. Color Coding Denetimi

**Hocanın kuralı: "Avoid relying solely on color"**

| Durum | Mevcut Renk | İkon Var mı? | Etiket/Prefix | Değerlendirme |
|-------|------------|-------------|--------------|---------------|
| Error (login/form) | `bg-red-50 text-red-700` | ✕ span ✓ | Yok | ✅ İkon var ama prefix yok |
| Rate limit uyarısı | `bg-hai-cream` | ⏱ emoji | "Too many attempts" ✓ | ✅ Tam uyumlu |
| Unread notification | Teal dot + count | Yok (dot) | Count rakamı ✓ | ⚠ Dot tek başına renk-bağımlı |
| Meeting: Pending | `bg-yellow-ish` | Yok | "Pending review" metni ✓ | ✅ Metin var |
| Meeting: Declined | `bg-[#ffe8e8] text-[#a33a3a]` | Yok | "Declined" metni ✓ | ✅ Metin var |
| Post: Active | Teal badge | Yok | "Active" metni ✓ | ✅ Metin var |
| Post: Expired | Dark badge | Yok | "Expired" metni ✓ | ✅ Metin var |
| AI match | Dark badge + Sparkles ikon ✓ | ✅ | "AI match" metin ✓ | ✅ Tam uyumlu |

**Genel değerlendirme:** Büyük çoğunluk renk + metin birlikte kullanıyor. Sorun: bazı nokta-tipi göstergeler (unread dot) yalnızca renge dayalı. Bu düşük riskli çünkü her zaman yakınında sayı/metin mevcut.

---

## 8. Dark Mode Kontrolü

| Kriter | Durum |
|--------|-------|
| Tüm ana renklerin dark karşılığı tanımlı mı? | ✅ (globals.css `.dark` blokta) |
| Body text kontrast dark'ta AA mı? | ✅ D-Text-Primary: ~19:1 |
| Link/accent kontrast dark'ta AA mı? | ✅ D-Teal `#55C3D7`: 9.29:1 |
| Secondary text dark'ta AA mı? | ✅ D-Text-Sec: 5.90:1 |
| Teal saturation ayarı yapılmış mı? | ✅ Dark teal daha doygun: RGB(85,195,215) |
| Login/Landing dark mode çalışıyor mu? | ⚠ H09'da düzeltildi; Landing sayfası hâlâ eksik |
| Inline CSS var token'ları override ediliyor mu? | ✅ `.bg-[var(--bg)]` bloğuyla yönetiliyor |

**Eksik:** Landing page (LandingPage.tsx) dark mode desteği yok — hero gradient ve feature section'lar hardcoded light renkler kullanıyor.

---

## 9. Önerilen Düzeltilmiş Palet

| Token | Mevcut Hex | Düzeltilmiş | Değişiklik Sebebi |
|-------|-----------|-------------|-------------------|
| Link/accent text | `#8AC6D0` | **`#1B7A88`** | Beyaz üzeri kontrast: 1.90→5.08 |
| Text-secondary (offwhite üzeri) | `#77727F` | **`#5E5867`** | Offwhite üzeri: 4.27→5.72 |
| Muted (lime üzeri) | `#6F6878` | **`#5E5867`** | Lime üzeri: 4.47→5.08 |
| Profile match chip metin | `#8AC6D0` on `#D8EFF2` | **`#36213E`** on `#D8EFF2` | 1.65→12.14 |

> **Not:** `#8AC6D0` teal'ı arka plan, border ve dekoratif öğe olarak kullanmaya devam et. Yalnızca metin rolünde `#1B7A88` ile değiştir.

---

## Self-Check

- [x] Tüm metinler için kontrast hesaplandı (light + dark)
- [x] Color harmony tespit edildi (Split-Complementary)
- [x] 60-30-10 kontrol edildi
- [x] Color blindness 3 tip için yorumlandı
- [x] FAIL'lar için somut hex önerisi var (`#1B7A88`, `#5E5867`, `#36213E`)
- [x] Color coding — renk + ikon/metin denetimi yapıldı

---

## Sonraki Adımlar

- **Link rengi düzeltmesi:** Tüm `text-[#8AC6D0]` link kullanımlarını `text-[#1B7A88]` ile değiştir (özellikle LoginPage, DashboardPage, PostListPage)
- **Landing dark mode:** `/sevgi-ai:hci-review` veya direkt LandingPage.tsx dark mode tokenları
- **Usability test:** `/sevgi-ai:usability-eval-plan` ile renk körü kullanıcı simülasyonunu test senaryosuna ekle
