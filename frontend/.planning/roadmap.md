# HEALTH AI Co-Creation Platform — Roadmap

## Proje Özeti
Mühendisler ile sağlık profesyonellerini yapılandırılmış, GDPR uyumlu bir web platformunda buluşturan co-creation uygulaması.

**Stack:** React + TypeScript (Vite), TailwindCSS, React Router, Zustand · Express + MongoDB + JWT
**Ders:** SENG 384 — Spring 2026 | Demo: max 5 dk video | Submission: 30/04/2026

---

## Mevcut Durum Özeti (29.04.2026)

| Faz | Konu | Durum |
|---|---|---|
| 1 | Proje kurulumu, theme, routing, store | ✅ Tamam |
| 2 | Auth — register/login/logout/RBAC | ✅ Tamam (⚠ email verification sahte) |
| 3 | Post yönetimi — CRUD, lifecycle, publish, partner-found | ✅ Tamam |
| 4 | Arama & filtreleme + city-match | ✅ Tamam |
| 5 | Toplantı akışı — request/accept/decline/cancel/complete + NDA | ✅ Tamam (⚠ `meeting_completed` notif bug'ı) |
| 6 | Admin paneli — users/posts/logs + CSV | ✅ Tamam |
| 7 | Profil & GDPR — profil edit + JSON export + delete UI | 🟡 Kısmen (delete sahte, export server'dan değil) |
| 8 | Güvenlik — helmet, cors, mongo-sanitize, rate-limit, session-timeout, cookie-consent | 🟡 Kısmen (anti-bot/captcha yok) |
| 9 | Polish — seed data, empty states, 404/unauthorized, privacy page | ✅ Tamam |
| **+** | **Avatar upload** (multer, 5MB, JPEG/PNG/WebP/GIF) | ✅ Yeni eklendi |

---

## Faz 10 — Kritik Bug & Tutarlılık Düzeltmeleri 🔴

**Hedef:** Brief vaadiyle koddaki gerçeklik arasındaki kopuklukları kapat.

- [ ] **Bug:** `Notification.ts` enum'una eksik tipleri ekle: `meeting_completed`, `post_status_changed`, `account_activity` — şu an `meetingService.completeMeeting` runtime'da Mongoose validation hatası alıyor
- [ ] **Tutarlılık:** Hesap silme — iki seçenek arasından seç:
  - **A (Hızlı):** ProfilePage'deki "GDPR Art. 17 · Demo only" notu kalsın, ama User Guide'da "permanently deleted" cümlesini "your session is cleared" olarak yumuşat
  - **B (Önerilen):** Gerçek `DELETE /api/auth/me` endpoint'i — postlar `authorId` korunur ama anonimleştirilir (`authorName: 'Deleted user'`), meetinglar cascade cancelled, sonra `User.deleteOne()`
- [ ] **Tutarlılık:** Email verification — iki seçenek:
  - **A (Hızlı):** UI'da "verification email" adımını kaldır veya "(skipped in demo)" notu ekle, brief'e açıklama
  - **B (Önerilen):** Nodemailer + `verifyToken` field, `POST /api/auth/verify` endpoint, `User.isVerified` default `false`
- [ ] **Temizlik:** `requirments` → `requirements` klasör adı düzeltmesi (git mv)
- [ ] **Temizlik:** `frontend/C/Program Files` artık klasörünü sil
- [ ] **Tip hatası:** `services/meetingService.ts:182` — `meeting_completed` tipini enum'a ekledikten sonra TS error temizlenir

**Çıktı:** Brief'in vaat ettikleri ile çalışan kod birebir uyumlu

---

## Faz 11 — GDPR Tamlama 🟡

**Hedef:** Brief 5.1'i ciddiye al — sadece UI değil, gerçek hak.

- [ ] **`DELETE /api/auth/me`** endpoint (Faz 10 B opsiyonu seçilirse buraya kayar)
- [ ] **`GET /api/auth/me/export`** endpoint — kullanıcının tüm verisini (profil + postlar + meetingler + ilgili loglar) JSON olarak server'dan döndür
- [ ] ProfilePage `handleExport` → API çağrısına geçir (şu an local store'dan üretiyor, log'lar eksik)
- [ ] Log retention job — 24 aydan eski logları silen scheduled task (`scripts/log-cleanup.ts` + cron veya `node-cron`)
- [ ] Privacy Policy sayfasında "data we collect / retention period / your rights" bölümlerini doğrula

**Çıktı:** Sınav jürisi sorduğunda "GDPR uyumlu" iddiası kanıtlanabilir

---

## Faz 12 — Bildirim Sistemi Tamlama 🟡

**Hedef:** User Guide bölüm 8'deki notification matrisini gerçekleştir.

- [ ] Notification enum'a yeni tipler ekle (Faz 10'da temel olanlar, burada genişlet):
  - `account_activity` — yeni cihazdan login, parola değişimi
  - `post_status_changed` — postunla ilgili herhangi bir status değişimi
- [ ] Login sırasında User-Agent değişikliği tespiti → `account_activity` notification
- [ ] Parola değişiminde otomatik notification
- [ ] **(Opsiyonel)** E-posta kanalı — Nodemailer + transactional email tetikleyicileri (en azından meeting_request ve meeting_confirmed için)
- [ ] Kullanıcı notification preferences ekranı (sadece in-app / email + in-app toggle)

**Çıktı:** "Channel: Email / In-App" iddiası en azından opsiyonel olarak desteklenir

---

## Faz 13 — Admin Görünürlük & Audit Genişletme 🟢

**Hedef:** Brief 4.5 ve 4.6'da listelenen ama eksik kalan admin özellikleri.

- [ ] **Profile completeness** sütunu — bio + avatarUrl + expertiseTags + city + institution dolu mu? Yüzde olarak göster
- [ ] **Per-user activity metrics** — kullanıcı detay sayfası: post sayısı, meeting sayısı, son login, başarısız login sayısı
- [ ] **Post lifecycle history** — `PostStatusEvent` collection veya `Log` üzerinden post bazlı status timeline
- [ ] Log eylem türlerini genişlet: `MEETING_COMPLETE` (LOG sabitlerinde var ama controller'da loglanıyor mu doğrula)
- [ ] **Anomaly heuristics** — basit kurallar:
  - Aynı IP'den 1 dk'da 5+ failed login → flag
  - Aynı kullanıcının 1 saatte 10+ post create → flag
  - Admin panelde "Suspicious activity" widget'ı

**Çıktı:** Admin paneli sadece görüntüleme değil, gerçek moderation aracı

---

## Faz 14 — Güvenlik & Performans Sertleştirme 🟢

**Hedef:** Brief 5.2 ve 5.3'ün ölçülebilir kısmı.

- [ ] **Anti-bot:** Register sayfasına hCaptcha veya Cloudflare Turnstile entegrasyonu (en az `.edu` regex'in üstüne)
- [ ] **Performans benchmark:** k6 veya autocannon ile basit yük testi — `/api/posts` endpoint'inde 100/500/1000 concurrent için p95 latency raporla
- [ ] **Search latency:** Mongo `text index` ekle (`title + description`) — şu an sadece regex ile arama yapıyor, 10k+ post'ta yavaşlar
- [ ] Pagination doğrulaması — frontend `PostListPage` paginasyon kullanıyor mu kontrol et (backend hazır)
- [ ] Lazy loading — `React.lazy` ile `AdminPage`, `PrivacyPage` gibi büyük sayfalar code-split

**Çıktı:** Brief'teki "<1.5s arama / <3s sayfa / 1000 user" hedefleri için somut sayılar

---

## Faz 15 — Erişilebilirlik & Mobil Polish 🟢

**Hedef:** Brief 5.4 — WCAG 2.1 AA seviyesi.

- [ ] **axe-core** veya Lighthouse a11y audit — 3 kritik sayfa (Landing, PostList, ProfilePage)
- [ ] Renk kontrastı kontrolü — özellikle `text-neutral-400` üzerinde küçük font'lar
- [ ] Klavye navigasyonu testi — modal'lar (DeleteModal, ExpressInterestModal, SessionTimeoutModal) için focus trap
- [ ] `aria-label` eksiklerini tespit et — her ikon-only buton için
- [ ] Mobile cihaz testi — 360px–414px breakpoint'lerde major sayfalar
- [ ] Tooltips: NDA ve "confidentiality level" alanları için açıklayıcı tooltip ekle (Brief 5.4)

**Çıktı:** Lighthouse a11y skoru ≥90, mobil deneyim sorunsuz

---

## Faz 16 — Demo Hazırlığı & Teslim 🚀

**Hedef:** 30/04/2026 teslim, max 5 dk demo videosu.

- [ ] **6 demo senaryosunu** end-to-end koş (S1: Register/Login → S6: Profil/GDPR), her birinde "happy path + 1 edge case"
- [ ] Demo için seed kullanıcılar (3 admin + 5 engineer + 5 healthcare professional + 15 post + 8 meeting + 30 log)
- [ ] User Guide template'ini doldur ve PDF olarak çıkar — screenshot'lar dahil
- [ ] README'yi son kontrol — kurulum, environment variables, mongo seed komutu
- [ ] Demo videosu için akış scripti — kim ne diyecek, hangi sayfayı gösterecek, hangi kullanıcıyla giriş yapacak
- [ ] Production build smoke test (`npm run build` + `vite preview` + backend prod modu)

**Çıktı:** Submission'a hazır paket

---

## Demo Senaryoları → Faz Eşleşmesi

| Senaryo | İlgili Fazlar |
|---|---|
| S1: Registration & Login | Faz 2 ✅ + Faz 10 (verification) |
| S2: Post Creation & Management | Faz 3 ✅ |
| S3: Search & Filtering | Faz 4 ✅ |
| S4: Meeting Request Workflow | Faz 5 ✅ + Faz 10 (notification bug) |
| S5: Admin Panel | Faz 6 ✅ + Faz 13 (genişletme) |
| S6: Profile & GDPR | Faz 7 🟡 + Faz 11 (gerçek delete/export) |

---

## Teknik Kısıtlamalar (Dokümandan)

- ❌ Hasta verisi **hiçbir yerde** saklanmaz — log'larda da yok ✅
- ❌ Teknik doküman / IP file upload **kesinlikle yok** — yalnızca avatar upload var, o da resim ve ≤5MB ✅
- ✅ Toplantılar **harici** gerçekleşir (Zoom/Teams) — platform sadece eşleştirir
- ✅ Sadece `.edu` kurumsal e-posta ile kayıt
- ✅ NDA acceptance ilk temasta zorunlu (`meetingService.requestMeeting` `ndaAccepted` kontrol ediyor)

---

## Açık Sorular (Karar bekleyen)

1. **Email verification** — gerçek SMTP entegrasyonu mu, demo notu mu? (Faz 10)
2. **Account deletion** — gerçek silme mi, demo notu mu? (Faz 10)
3. **Email notification kanalı** — kapsam dışı mı yoksa Faz 12'de mi? (User Guide vaat ediyor)
4. **CAPTCHA** — Brief "anti-bot" diyor ama "rate-limit" sayılır mı?
