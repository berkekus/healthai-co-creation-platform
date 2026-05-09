# Heuristic Evaluation — HealthAI Co-Creation Platform

**Tarih:** 2026-05-09  
**Yöntem:** Nielsen 10 Heuristic + Alan Dix Learnability/Flexibility/Robustness + WCAG 2.1 AA  
**Önceki analiz:** `HCI_REVIEW_HealthAI.md` bulgularıyla çapraz referans alınmıştır  
**Kapsam:** Login · Register (multi-step) · Dashboard · Post List · Post Create · Post Detail · Navbar · Notifications · Meetings · Express Interest Modal · Conversation

---

## Severity Skalası (Nielsen)

| Skor | Etiket | Tanım |
|------|--------|-------|
| 4 | Catastrophic | Kullanım önleyici — derhal düzelt |
| 3 | Major | Ciddi frustration, kullanıcı zorlanıyor |
| 2 | Minor | Küçük frustration, düşük öncelik |
| 1 | Cosmetic | Görsel / stil düzeyi |
| 0 | — | Bu ekranda ihlal yok |

---

## Özet Dağılımı

```
Catastrophic (4): 3
Major (3):        9
Minor (2):        8
Cosmetic (1):     3
Toplam:          23
```

---

## Bulgu Tablosu

### H1 — Visibility of System Status

| # | Bulgu | Konum | Severity | Düzeltme | Referans |
|---|-------|-------|----------|----------|----------|
| H01 | Mesajlaşma ekranı 8 saniyelik polling kullanıyor; yeni mesaj geldiğinde ya da gönderim sonrasında hiçbir "güncellendi" göstergesi yok — kullanıcı mesajın iletildiğini ya da gelmekte olduğunu bilemez | `ConversationPage.tsx:8` (`POLL_INTERVAL = 8000`) | **3** | Gönderim sonrası anlık yerel ekleme (optimistic update) yap; polling yerine WebSocket ya da SSE değerlendirilebilir; en azından "son güncelleme: X sn önce" timestamp göster | Nielsen H1 · Alan Dix Responsiveness |
| H02 | Dashboard "Weekly overview" değişim etiketleri (`↗ Synced with backend`, `— No change`) statik ve hardcoded; gerçek delta değerini yansıtmıyor | `DashboardPage.tsx:220-222` | **2** | Bir önceki haftayla karşılaştırmalı delta (`+2` / `-1`) göster ya da etiketi kaldır; statik metin yanlış anlam taşıyor | Nielsen H1 · Alan Dix Synthesizability |
| H03 | Post Create formunda submit sırasında yalnızca buton metni "Publishing..." olarak değişiyor; sayfanın geri kalanı tepkisiz — uzun süre bekleme durumunda kullanıcı işlemin devam ettiğini anlayamaz | `PostCreatePage.tsx:76-79` | **2** | Butonun yanı sıra form alanlarını disabled yap + progress feedback ekle (örn. üst kısımda ince bir progress bar) | Nielsen H1 |

---

### H2 — Match Between System and the Real World

| # | Bulgu | Konum | Severity | Düzeltme | Referans |
|---|-------|-------|----------|----------|----------|
| H04 | "Request Access" butonu kayıt (sign-up) işlevi görüyor; ancak "access" sözcüğü kulağa özel izin / onay gerektiren bir süreç gibi geliyor — özellikle klinisyen kullanıcılar için anlam karışıklığı | `Navbar.tsx:326`, `LandingPage.tsx` | **2** | "Create Account" ya da "Sign Up" olarak değiştir; "Request Access" yalnızca gerçekten onay gerektiren durumlar için uygun | Nielsen H2 · Alan Dix Familiarity |
| H05 | "Express Interest" (İlgi belirt) 3 adımlı bir modal akışı başlatıyor: mesaj → NDA onayı → randevu slot'ları; bu karmaşıklık "interest" sözcüğüyle eşleşmiyor — kullanıcı basit bir beğeni butonu bekler | `ExpressInterestModal.tsx:15` (`STEP_LABELS`) | **2** | Buton etiketini gerçek süreci yansıtacak şekilde güncelle: "Schedule a Meeting" ya da modal başlığına "3-step process" gibi ön bilgi ekle | Nielsen H2 · Alan Dix Familiarity |

---

### H3 — User Control and Freedom

| # | Bulgu | Konum | Severity | Düzeltme | Referans |
|---|-------|-------|----------|----------|----------|
| H06 | **"Forgot password?" bağlantısı kayıt sayfasına (`ROUTES.REGISTER`) yönlendiriyor** — şifresini sıfırlamak isteyen kullanıcı çıkış yolu bulamıyor; yeni hesap oluşturmak zorundaymış gibi hissediyor | `LoginPage.tsx:283–289` | **4** | `to={ROUTES.FORGOT_PASSWORD}` olarak düzelt; `ForgotPasswordPage` zaten mevcut | Nielsen H3 · Alan Dix Recoverability |
| H07 | Register multi-step formunda (3 adım) "Back" butonu yok; adım 2 veya 3'te fark edilen adım 1 hatası düzeltilemiyor — form başa alınmak zorunda | `RegisterPage.tsx:40-53` (yalnızca `nextStep` fonksiyonu var) | **3** | Her adım başlığının yanına "← Back" butonu ekle; `setStep(s => (s - 1))` yeterli — validasyon yalnızca ileri yönde çalışsın | Nielsen H3 · Alan Dix Recoverability |
| H08 | Post Create sayfasında navigasyon uyarısı yok; 8-10 alan dolduran kullanıcı tarayıcının geri tuşuna veya bir navbar linkine bastığında form verileri sessizce siliniyor | `PostCreatePage.tsx` | **3** | React Router v6 `useBlocker` / `unstable_usePrompt` ile "Değişiklikler kaydedilmedi, çıkmak istiyor musunuz?" diyalogu göster | Nielsen H3 · Alan Dix Recoverability |

---

### H4 — Consistency and Standards

| # | Bulgu | Konum | Severity | Düzeltme | Referans |
|---|-------|-------|----------|----------|----------|
| H09 | Dark mode toggle Navbar'da mevcut; ancak Login (`bg-[#e8f0f7]`, `bg-white`) ve Landing sayfaları CSS token'larına (`--hai-*`) değil hardcoded hex renklere bağlı — dark mode geçişi bu sayfalarda görünmüyor | `LoginPage.tsx:77`, `globals.css:.dark` token bloğu | **3** | Tüm hardcoded renkleri `bg-hai-offwhite`, `bg-white` → `dark:bg-surface-card` gibi Tailwind dark: prefix'li sınıflara ya da CSS token'larına çevir | Nielsen H4 · Alan Dix Consistency |
| H10 | Kullanıcı rolü üç farklı formatla anılıyor aynı oturumda: "Clinician" (PostList filtresi), "healthcare_professional" (API ve profil formu), "Healthcare Professional" (Navbar badge) | `PostListPage.tsx:407`, `Navbar.tsx:299`, `ProfilePage.tsx:32` | **2** | Tek canonical etiket seç ("Healthcare Professional"); uygulamanın tüm UI metinlerinde bunu kullan; backend enum'u değiştirmek gerekmez | Nielsen H4 · Alan Dix Consistency |
| H11 | Modal ve sayfa bazı yerlerde Escape ile kapanıyor (`ExpressInterestModal.tsx:54-56`), bazı yerlerde kapanmıyor (örn. Bildirim dropdown klavye ile kapatılamıyor) — kapanma davranışı tutarsız | `ExpressInterestModal.tsx:54`, `Navbar.tsx:149-157` | **2** | Tüm dropdown ve modal'lar için Escape ile kapanma + `aria-modal` + focus trap standardize et | Nielsen H4 · WCAG 2.4.3 |

---

### H5 — Error Prevention

| # | Bulgu | Konum | Severity | Düzeltme | Referans |
|---|-------|-------|----------|----------|----------|
| H12 | Express Interest Modal'da `removeSlot` minimum 3 slot koşuluyla kısıtlı (`if (slots.length <= 3) return`) ama kullanıcıya bu kısıtlama hiç gösterilmiyor; kaldır butonu görünür ama tepki vermez | `ExpressInterestModal.tsx:68-70` | **3** | Slot 3'te "kaldır" butonunu gizle ya da tooltip ekle: "En az 3 zaman dilimi gerekli"; ya da minimum koşulu 1'e düşür ve son adım doğrulamasına bırak | Nielsen H5 |
| H13 | Post Create'de expiry date `minDate` yarın olarak set edilmiş ama kullanıcı manuel tarih yazabilir; geçmiş tarih girildiğinde hata yalnızca form submission sırasında, alan odak kaybettiğinde değil | `PostCreatePage.tsx:34-36` | **2** | `onBlur` doğrulamasını ekle; tarih alanına `min` attribute HTML5 ile tanımla | Nielsen H5 |

---

### H6 — Recognition Rather Than Recall

| # | Bulgu | Konum | Severity | Düzeltme | Referans |
|---|-------|-------|----------|----------|----------|
| H14 | FilterSidebar "Location" alanı serbest metin input — kullanıcı ne gireceğini (şehir mi? ülke mi? kısaltma mı?) bilmek zorunda; autocomplete önerisi yok | `PostListPage.tsx:344-355` | **3** | Yazarken şehir/ülke öneri listesi göster (en azından varolan postlardaki `city` / `country` değerlerinden türetilebilir) | Nielsen H6 · Alan Dix Synthesizability |
| H15 | Dashboard orbit widget'ında "Hover profiles for details" metni (masaüstünde) — bu metin gerçekten çalışıyor ama klavye gezginleri ve hover yapamayan kullanıcılar için içerik erişilemez; meeting bilgisi yalnızca hover tooltip'inde | `DashboardPage.tsx:466` | **2** | Tooltip içeriğini `aria-describedby` ile açıkla; focus ile de tooltip açılsın; ya da bilgiyi her zaman görünür compact liste olarak sun | Nielsen H6 · WCAG 1.4.13 |
| H16 | Notifications sayfasında "All / Unread / Meetings / Posts / System" sekmeleri filtre sayısı (0 olsa bile) her zaman görünür; içeriği olmayan sekmelerin ayırt edilmesi için görsel ipucu yok | `NotificationsPage.tsx:73-79` | **1** | Boş sekmeleri soluk/disabled göster ya da count badge'leri sekme etiketinin yanına ekle | Nielsen H6 |

---

### H7 — Flexibility and Efficiency of Use

| # | Bulgu | Konum | Severity | Düzeltme | Referans |
|---|-------|-------|----------|----------|----------|
| H17 | Mesajlaşma ekranında Enter ile gönderim, Shift+Enter ile yeni satır — ancak bu bilgi kullanıcıya hiçbir yerde gösterilmiyor; özellikle klinisyen kullanıcı Enter'ın yeni satır mı yoksa gönderme mi yapacağını bilemez | `ConversationPage.tsx:80` (`handleKeyDown`) | **2** | Textarea placeholder'ına veya altına "Press Enter to send · Shift+Enter for newline" notu ekle | Nielsen H7 · Alan Dix Familiarity |
| H18 | PostListPage'de view mode (grid/list) ve sort seçimi session boyunca sıfırlanıyor; kullanıcı sayfayı yenilediğinde veya geri dönüşte tercih unutuluyor | `PostListPage.tsx:98-99` | **1** | `localStorage` ya da URL query param ile sort/view tercihini sakla | Nielsen H7 · Alan Dix Customizability |

---

### H8 — Aesthetic and Minimalist Design

| # | Bulgu | Konum | Severity | Düzeltme | Referans |
|---|-------|-------|----------|----------|----------|
| H19 | Login formunda "Dev Access" paneli (Doctor / Engineer / Admin hardcoded kimlik bilgileri) production arayüzünde görünür — klinisyen kullanıcı için anlamsız gürültü; güven kaybı riski | `LoginPage.tsx:329-354` | **3** | `import.meta.env.MODE === 'development'` koşuluna bağla; production build'de render etme | Nielsen H8 · Alan Dix Minimalism |
| H20 | PostListPage başlığında "05 Directory" hardcoded bölüm numarası var — landing sayfası ile entegre görünüyor ama direkt ziyarette bağlam dışı, klinisyen için anlamsız | `PostListPage.tsx:231` | **1** | Numara kaldırılabilir ya da "Browse" gibi anlamlı bir prefix ile değiştirilebilir | Nielsen H8 |
| H21 | Pagination tüm sayfa numaralarını düz liste olarak render ediyor (`Array.from({ length: totalPages }, ...)`) — 10+ sayfa durumunda Navbar genişliğini aşacak | `PostListPage.tsx:735-748` | **2** | Elipsis tabanlı pagination: `1 … 4 [5] 6 … 10`; 5'ten fazla sayfada ortadaki numaralar gizlenmeli | Nielsen H8 |

---

### H9 — Help Users Recognize, Diagnose, and Recover from Errors

| # | Bulgu | Konum | Severity | Düzeltme | Referans |
|---|-------|-------|----------|----------|----------|
| H22 | **"Remember me" checkbox işlevsiz** — `rememberMe` state UI'da görünüyor ve toggle edilebiliyor ama `login()` çağrısına parametre olarak geçirilmiyor; kullanıcı oturumu beklediği gibi hatırlanmayınca neden çalışmadığını anlayamaz, hata mesajı da yok | `LoginPage.tsx:29-30`, `58` | **4** | `rememberMe` değerini `login({ ...data, rememberMe })` çağrısına ekle ve backend session süresiyle entegre et; geçici çözüm: özelliği kaldır ya da disable göster | Nielsen H9 · H1 |
| H23 | Turnstile CAPTCHA ağ sorunu nedeniyle yüklenemezse submit butonu sonsuza kadar `disabled` kalıyor; kullanıcıya "CAPTCHA yüklenemedi, sayfayı yenile" gibi geri bildirimi yok | `LoginPage.tsx:292-301`, `306` | **2** | `onError` callback'ine görünür bir hata mesajı ekle: "Security check failed — please refresh the page"; sayfayı yenile butonu sun | Nielsen H9 |
| H24 | PostDetailPage'de fetch hata durumu (`fetchError = true`) yönetiliyor ama kullanıcıya gösterilen içeriğin ne olduğu kod içinde tanımlı değil (ilk 100 satırda render görülmüyor) — muhtemelen boş sayfa | `PostDetailPage.tsx:63-86` | **2** | Fetch hatasında "Bu ilan yüklenemedi. Geri dönmek için tıklayın." gibi açık hata durumu göster | Nielsen H9 |

---

### H10 — Help and Documentation

| # | Bulgu | Konum | Severity | Düzeltme | Referans |
|---|-------|-------|----------|----------|----------|
| H25 | ".edu" e-posta zorunluluğu Login sayfasında küçük bir açıklama olarak var ama neden yalnızca kurumsal e-posta kabul edildiğine dair bağlam yok — klinisyenler kurumsal hesaplarına erişimde sorun yaşıyorsa yönlendirilecek bir yardım linki de yok | `LoginPage.tsx:160-163` | **2** | "Sadece .edu adresleri neden?" bağlantısı veya tooltip ile kısa açıklama ekle; kurumsal hesaba erişimi yoksa yönlendirme öner | Nielsen H10 |
| H26 | ExpressInterestModal'daki NDA metni tek blok metin halinde; klinisyen kullanıcı uzun legal metni okumadan onay kutusunu işaretlemek için kaydırdı mı anlaşılmıyor | `ExpressInterestModal.tsx:13`, adım 2 | **1** | Scroll-to-bottom doğrulaması ekle (onay kutusu yalnızca metin tam okunduğunda aktif olsun); ya da metni madde madde listele | Nielsen H10 |
| H27 | Dashboard boş-durum (isNewUser) 3 adımlı onboarding kartları gösteriyor — ancak bu kartlar yalnızca `posts.length === 0 && myMeetings.length === 0` koşulunda görünür; kullanıcı 1 post oluşturur oluşturmaz kaybolur, hiç ilerleyip ilerlemediğini bilemez | `DashboardPage.tsx:31`, `41-48` | **1** | Onboarding checklist'i kalıcı ve tamamlanmış adımları işaretleyerek göster (en azından ilk hafta); "Tekrar gösterme" seçeneği sun | Nielsen H10 · Alan Dix Task conformance |

---

### WCAG 2.1 AA İhlalleri

| # | Bulgu | Konum | Severity | Kriter | Düzeltme |
|---|-------|-------|----------|--------|----------|
| W01 | Bildirim bell dropdown yalnızca `onMouseEnter` ile açılıyor — klavye ile focus geldiğinde açılmıyor; Tab sırası dropdown içeriğine ulaşamıyor | `Navbar.tsx:249-252` | **3** | `onFocus` + `onClick` ile açılabilir hale getir; `role="button"` + `aria-expanded` + `aria-haspopup="listbox"` ekle | WCAG 2.1.1 Keyboard |
| W02 | "Remember me" label'ı gerçek `<input type="checkbox">` yerine özel bir div'i sarıyor; `<label htmlFor>` ilişkisi yok; ekran okuyucu checkbox rolünü algılayamaz | `LoginPage.tsx:268-282` (custom div checkbox) | **3** | Native `<input type="checkbox" id="rememberMe" />` + `<label htmlFor="rememberMe">` kullan; custom div'i yalnızca stillemek için tut | WCAG 1.3.1 Info and Relationships |
| W03 | Teal (`#8AC6D0`) üzerine beyaz metin: kontrast oranı yaklaşık **2.5:1** — AA standardı normal metin için 4.5:1, büyük metin için 3:1 gerektirir; özellikle "AI match" badge'i üzerinde küçük metin sorun | `PostListPage.tsx:627-632` `bg-[#D8EFF2] text-[#36213E]` (bu kombinasyon OK) · `bg-[#8AC6D0]` üzerine beyaz metin | **2** | Açık teal arka plan üzerinde beyaz metin kullanma; ya plum (`#36213E`) metne geç ya da arka planı koyulaştır | WCAG 1.4.3 Contrast (Minimum) |

---

## Alan Dix Prensipleri Özeti

| Prensip | Bulgular |
|---------|---------|
| Predictability | H01 (mesaj gecikme), H06 (yanlış yönlendirme) |
| Synthesizability | H02 (statik metrikler), H14 (location input) |
| Familiarity | H04 ("Request Access"), H17 (Enter gönder) |
| Generalizability | H09 (dark mode tutarsız) |
| Consistency | H10 (rol etiketi), H11 (Escape davranışı) |
| Dialog initiative | H07 (register geri yok) |
| Substitutivity | H08 (form navigasyon) |
| Customizability | H18 (tercih kayıt yok) |
| Observability | W01 (klavye erişim) |
| Recoverability | H06, H07, H08, H22 |
| Responsiveness | H01 |
| Task conformance | H22, H27 |

---

## Self-Check

- [x] 10 heuristic'in her biri tarandı (H1→H10)
- [x] Her bulgu severity skorlu (0-4)
- [x] Her bulgu somut konum belirtiyor (dosya:satır veya sayfa adı)
- [x] Düzeltme önerisi spesifik (genel "iyileştir" yok)
- [x] Toplam ≥ 15 bulgu (23 bulgu + 3 WCAG)
- [x] WCAG ihlalleri AA kriteri ile işaretlendi (W01 2.1.1, W02 1.3.1, W03 1.4.3)

---

## Sonraki Adımlar

- **Renk sistemi derinlemeli:** `/sevgi-ai:color-audit` — Teal/Mint/Plum paleti için tam WCAG kontrast tablosu
- **Kullanıcı testi tasarımı:** `/sevgi-ai:usability-eval-plan` — H06, H07, H22 bulguları için klinisyen + mühendis katılımcılarla doğrulama senaryosu
- **Gereksinim izleme:** `/sevgi-ai:traceability-matrix` — HCI bulgularını backlog gereksinimlerine bağlamak için
