# HCI Review — HealthAI Co-Creation Platform

**Tarih:** 2026-05-09  
**Değerlendiren:** SevgiAI HCI Review Skill  
**Standart:** ISO 13407 User-Centered Design + Alan Dix Learnability / Flexibility / Robustness Çerçevesi

---

## 1. Bağlam

| Alan | Değer |
|------|-------|
| Platform | HealthAI Co-Creation Platform (React / TypeScript / Tailwind) |
| Değerlendirilen ekranlar | Landing · Login · Register (multi-step) · Dashboard · Post List (Directory) · Post Create · Navbar · Conversation / Messaging |
| Birincil görev | Hem işbirliği ilanı yayınlamak hem de ilan bulmak / bağlantı kurmak (eşit ağırlıklı) |
| Cihaz bağlamı | Desktop / Laptop öncelikli; ofis / klinik ortamı |
| Kullanıcı profili | **Karma** — klinisyenler (kısmi BT okuryazarlığı) + mühendisler (yeterli BT okuryazarlığı) |

---

## 2. Kullanıcı Modeli

### Klinisyen (Healthcare Professional)
- Bilişsel yük kapasitesi daha dar: sağlık pratiğinin bilişsel talebi yüksek
- Teknik terminolojiden kaçınır; jargon içermeyen, tanıdık UI metaforları bekler
- Hover etkileşimine değil, tıklamaya odaklanır
- Zaman baskısı yüksek — akışlar kısa ve hedef-odaklı olmalı

### Mühendis
- Teknik ayrıntıyı okur; AI skor / API etiketi gibi meta-bilgiye ilgi gösterir
- Klavye kısayollarına ve verimli iş akışlarına alışkındır
- Hata mesajlarını teknik ayrıntıyla tercih eder

### Ortak kısıt
- Kullanıcılar büyük olasılıkla kurumsal e-posta kısıtlamasını (`.edu`) ilk kez öğreniyor; kayıt sürecinde beklenti yönetimi gerekli

---

## 3. Sezgisel İnceleme (Alan Dix Çerçevesi)

### 3.1 Learnability

| Alt kriter | Gözlem |
|------------|--------|
| **Predictability** | Bildirim çanı hover ile açılıyor — tıklama ile farklı davranış, tahmin edilemez |
| **Familiarity** | "Request Access" kayıt için standart dışı etiket; yeni kullanıcı "neden erişim talep edeyim?" sorusu sorar |
| **Consistency** | Login & Landing sayfaları hardcoded hex renkler kullanıyor; diğer sayfalar CSS değişkenleri (`--hai-*`) kullanıyor — dark mode tutarsızlığı |
| **Generalizability** | Dashboard "Weekly overview" değişim etiketleri (`↗ Synced with backend`) statik ve anlamsız; grafiksiz metrik sayıları tek başına context-free |

### 3.2 Flexibility

| Alt kriter | Gözlem |
|------------|--------|
| **Dialog initiative** | Register multi-step formda geriye gitme (Back) kontrolü eksik — kullanıcı adım 2'de hata görürse adım 1'e dönemez |
| **Substitutivity** | Yalnızca `.edu` e-posta kabul ediliyor; UI'da "neden?" açıklanmıyor — klinisyen için engel |
| **Customizability** | Dark mode toggle mevcut fakat Login/Landing sayfaları buna cevap vermiyor |

### 3.3 Robustness

| Alt kriter | Gözlem |
|------------|--------|
| **Observability** | FilterSidebar'da aktif filtre sayısı gösterilmiyor; kullanıcı kaç filtrenin aktif olduğunu göremez |
| **Recoverability** | Post Create formunda otomatik kayıt yok; yanlışlıkla navigasyon tüm veriyi siliyor |
| **Responsiveness** | Mesajlaşma ekranı 8 saniyelik polling kullanıyor; mesaj gönderimi / alımı arasındaki gecikme görünür değil |
| **Task conformance** | Kaydedilen postlar localStorage'da tutuluyor — farklı cihaz/tarayıcıda kaybolur |

---

## 4. Bulgular Tablosu

| # | Bulgu | Etki | Öncelik | Önerilen Aksiyon | Referans |
|---|-------|------|---------|------------------|----------|
| **F1** | **"Forgot password?" bağlantısı `ROUTES.REGISTER`'a yönlendiriyor** — LoginPage.tsx:283; kullanıcı şifre sıfırlamak isterken kayıt formuna düşüyor | Kırık kritik akış | **Critical** | `to={ROUTES.FORGOT_PASSWORD}` olarak düzeltilmeli | Alan Dix — Recoverability |
| **F2** | **"Remember me" checkbox işlevselliği yok** — LoginPage.tsx:29-30; state UI'da gösteriliyor ama `login()` çağrısına geçilmiyor (satır 58) | Kullanıcı beklenti yanıltması | **High** | `rememberMe` değerini `login()` çağrısına parametre olarak geç; backend oturumu kalıcılaştır | ISO 13407 — Task conformance |
| **F3** | **Bildirim dropdown hover ile açılıyor, click ile değil** — Navbar.tsx:149-157 `onMouseEnter/onMouseLeave`; klinisyen kullanıcılar tıklamayı bekler; klavye ile erişilemez | Erişilebilirlik + klinisyen uyumu | **High** | `onClick` ile toggle moduna geç; dışarı tıklama ile kapat; ARIA `aria-expanded` ekle | Alan Dix — Predictability; WCAG 2.1 |
| **F4** | **Dev Quick-Login paneli (Doctor / Engineer / Admin) üretim arayüzünde görünür** — LoginPage.tsx:329-354; hardcoded kimlik bilgileri kullanıcıya sunuluyor | Güven kaybı + güvenlik riski | **High** | Yalnızca `VITE_ENV=development` ortamında render et; production build'de kaldır | Güvenlik / profesyonel güvenilirlik |
| **F5** | **FilterSidebar'da aktif filtre göstergesi yok** — PostListPage.tsx:279-365; kullanıcı kaç filtrenin aktif olduğunu göremez; "Clear filters" butonu her zaman görünür | Gizli sistem durumu | **Medium** | Filtre başlığına aktif sayı badge'i ekle: "FILTERS (3)"; aktif filtreler varsa "Clear" butonu vurgulanmalı | Alan Dix — Observability |
| **F6** | **Dashboard haftalık metrik değişim etiketleri anlamsız ve statik** — DashboardPage.tsx:220; "↗ Synced with backend" gibi metinler gerçek değişimi yansıtmıyor | Kullanıcıya yanlış izlenim | **Medium** | Geçen haftaya kıyasla gerçek delta değeri göster (`+3` gibi) ya da etiketi tamamen kaldır | Alan Dix — Synthesizability |
| **F7** | **Pagination tüm sayfa numaralarını sıralıyor** — PostListPage.tsx:735-748; 50 post = 10 sayfa = 10 buton; ekranda yer kaplıyor | Görsel yük / ölçeklenebilirlik | **Medium** | Elipsis tabanlı pagination: `1 … 4 [5] 6 … 10`; 5'ten fazla sayfa varsa kenar numaraları dışındakini gizle | Gestalt — Figure/Ground |
| **F8** | **Dark mode geçişi Login ve Landing sayfalarında çalışmıyor** — LoginPage.tsx:77 `bg-[#e8f0f7]` hardcoded; globals.css `.dark` token'ları bu sayfalara uygulanmıyor | Tutarsız deneyim | **Medium** | Hardcoded hex renkleri `bg-hai-offwhite` / CSS var token'larına çevir; Login sol panel ve Landing hero için dark mode override ekle | Alan Dix — Consistency |
| **F9** | **Kaydedilen postlar localStorage'da, sunucuda değil** — DashboardPage.tsx:301-320; farklı cihazda giriş yapınca kayıtlar kaybolur; browser data temizlenince de sıfırlanır | Görev bütünlüğü bozuluyor | **Medium** | Kaydedilen postları kullanıcı profiliyle backend'e taşı; localStorage'ı yalnızca geçici fallback olarak kullan | ISO 13407 — Task conformance |
| **F10** | **Register multi-step formda geri adım kontrolü yok** — RegisterPage.tsx; `nextStep` fonksiyonu var ama `prevStep` ve "Back" butonu eksik; adım 2'de yapılan hata adım 1'deki veriyle düzeltilemez | Hata düzeltilemezliği | **Medium** | Her adımın üstüne "Back" butonu ekle; adım validasyonu sadece ileri yönde çalışsın | Alan Dix — Recoverability |
| **F11** | **Post Create formunda autosave veya navigasyon uyarısı yok** — PostCreatePage.tsx; 8-10 alan dolduran kullanıcı yanlışlıkla tarayıcı geri tuşuna basarsa tüm veri kaybolur | Yüksek hata maliyeti | **Medium** | `useBeforeUnload` / React Router `blocker` ile "Değişiklikler kaydedilmedi, çıkmak istediğinize emin misiniz?" uyarısı göster | Alan Dix — Recoverability |
| **F12** | **Turnstile CAPTCHA form akışını kesiyor** — LoginPage.tsx:292-301; e-posta → şifre → CAPTCHA → giriş düğmesi sırası doğal değil; CAPTCHA yüklenmeden düğme pasif kalıyor; klinisyen kullanıcılar için engel yaratıyor | Görev akışı kesintisi | **Low** | CAPTCHA'yı formun en üstüne veya alt kısmında giriş düğmesine bitişik konumlandır; başarısız girişten sonra göster (ilk girişte zorunlu değil) | Alan Dix — Flexibility |

---

## 5. Olumlu Noktalar

1. **Login hata yönetimi kapsamlı** — Kalan deneme sayısı göstergesi + 60 saniyelik cooldown sayacı + görsel progress bar (LoginPage.tsx:166-189). Hem klinisyen hem mühendis kullanıcı için beklentileri net yönetiyor.

2. **AI eşleştirme görsel olarak iyi ifade edilmiş** — PostListPage.tsx:625-638; "AI match · 87%" rozeti ve AI'ın eşleşme gerekçesini metin olarak göstermesi (aiReason), mühendis kullanıcılar için güven artırıcı; klinisyen için ise anlamlı kategorik bir özet.

3. **Post list skeleton loading gerçek içerikle örtüşüyor** — PostListPage.tsx:547-583; iskelet bileşenleri (Skeleton, SkeletonLine, SkeletonPill) gerçek post satırının düzeniyle birebir örtüşüyor — layout shift yok.

4. **Mobil hover tespiti için useCanHover hook** — LandingPage.tsx:29-49; dokunmatik cihazlarda hover-bağımlı içerik otomatik olarak her zaman görünür hale geliyor; klinisyenlerin mobil kullanımı için öngörülü.

5. **Mesajlaşma + bildirim sayı rozetleri okunmamış sayıyla güncel** — Navbar.tsx:238-244, 258-264; her iki icon üzerinde `{msgUnread > 9 ? '9+' : msgUnread}` formatıyla bilgi yükü yönetimi yapılmış.

---

## 6. Sonraki Adım Önerileri

- **Kural düzeyinde detay denetimi:** `/sevgi-ai:heuristic-eval` — Nielsen 10 + Alan Dix tam checklist ile her ekranı alt ekrana kadar tara.
- **Renk erişilebilirliği:** `/sevgi-ai:color-audit` — Teal (#8AC6D0) ve Plum (#36213E) kombinasyonunun WCAG AA kontrast oranlarını ve dark mode uyumluluğunu doğrula.
- **Kullanıcı testi tasarımı:** `/sevgi-ai:usability-eval-plan` — Klinisyen ve mühendis profillerinden 5'er katılımcıyla "ilan yayınla → iş birliği bul" akışını test et.

---

## 7. Self-Check

- [x] Bulgu sayısı ≥ 8 (12 bulgu)
- [x] Her bulguda etki seviyesi (Critical / High / Medium / Low) var
- [x] Her bulguda somut aksiyon önerisi var
- [x] En az 3 olumlu nokta (5 nokta) var
- [x] Bulgular kullanıcı sınıfına özelleştirildi (klinisyen vs mühendis farklılaştırması)
- [x] Yasak terimler ("kullanıcı dostu", "modern", "temiz") kullanılmadı
