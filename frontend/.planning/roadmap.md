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

## Faz 10 — Kritik Bug & Tutarlılık Düzeltmeleri ✅

**Hedef:** Brief vaadiyle koddaki gerçeklik arasındaki kopuklukları kapat.

- [x] **Bug:** `Notification.ts` enum'una eksik tipleri ekle: `meeting_completed`, `post_status_changed`, `account_activity`
- [x] **Email verification (B):** Nodemailer + `verifyToken` + `verifyTokenExpires` + `isVerified` default `false`. Endpoints: `POST /auth/verify-email`, `POST /auth/resend-verification`. Login engellendi (`!isVerified` → 403). SMTP yoksa konsola düşer (dev fallback)
- [x] **Account deletion (B):** Gerçek `DELETE /api/auth/me` — password confirm. Cascading: aktif meetingler cancel + karşı tarafa bildirim, kalan meetingler anonimleştirilir, postlar silinir, notification'lar silinir, avatar dosyası silinir, kullanıcı silinir, audit log korunur
- [x] **Tip hatası:** `services/meetingService.ts:182` — `meeting_completed` tipi eklenince temizlendi
- [ ] **Temizlik:** `requirments` → `requirements` klasör adı düzeltmesi (git mv)
- [ ] **Temizlik:** `frontend/C/Program Files` artık klasörünü sil

**Çıktı:** ✅ Email verify ve account delete artık gerçek. 37/37 backend test yeşil.

---

## Faz 11 — GDPR Tamlama ✅

**Hedef:** Brief 5.1'i ciddiye al — sadece UI değil, gerçek hak.

- [x] `DELETE /api/auth/me` endpoint (Faz 10'da tamamlandı)
- [x] **`GET /api/auth/me/export`** endpoint — profil + postlar + meetingler + audit loglar JSON olarak server'dan döndürülüyor
- [x] ProfilePage `handleExport` → gerçek API çağrısı, blob download
- [ ] Log retention job — 24 aydan eski logları silen scheduled task (demo için kapsam dışı)
- [ ] Privacy Policy sayfasında içerik doğrulaması

**Çıktı:** Sınav jürisi sorduğunda "GDPR uyumlu" iddiası kanıtlanabilir

---

## Faz 12 — Bildirim Sistemi Tamlama ✅

- [x] Enum'a `account_activity`, `post_status_changed`, `meeting_completed` eklendi
- [x] Parola değişiminde `account_activity` notification gönderiliyor
- [ ] Login'de User-Agent değişikliği tespiti (kapsam dışı — demo için yeterli değil)
- [ ] Notification preferences ekranı (kapsam dışı)

---

## Faz 13 — Admin Görünürlük & Audit Genişletme ✅

- [x] **Profile completeness** sütunu — bio, avatar, tags, city, institution → yüzde bar
- [ ] Per-user activity metrics detay sayfası (kapsam dışı)
- [ ] Post lifecycle history (kapsam dışı)
- [ ] Anomaly heuristics (kapsam dışı)

---

## Faz 14 — Güvenlik & Performans Sertleştirme ✅

- [x] **MongoDB text index** — `title + description + expertiseRequired` üzerinde
- [x] **React.lazy code split** — 12 sayfa ayrı chunk, build ✅
- [ ] Anti-bot/CAPTCHA — rate-limit yeterli sayılıyor (brief 5.2)
- [ ] k6 load test — demo için kapsam dışı

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
