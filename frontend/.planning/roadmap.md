# HEALTH AI Co-Creation Platform — Frontend Roadmap

## Proje Özeti
Mühendisler ile sağlık profesyonellerini yapılandırılmış, GDPR uyumlu bir web platformunda buluşturan co-creation uygulaması.  
**Stack:** React + TypeScript (Vite), TailwindCSS, React Router, Zustand  
**Ders:** SENG 384 – Spring 2026 | Demo: max 5 dk video

---

## Fazlar

### Faz 1 — Proje Kurulumu & Temel Yapı
**Hedef:** Çalışan bir iskelet, routing, tema ve mock veri altyapısı.

- [ ] Vite + React + TypeScript projesi başlatma
- [ ] TailwindCSS kurulumu ve tema konfigürasyonu (renk paleti, font)
- [ ] React Router v6 kurulumu — tüm route'ların iskelet sayfaları
- [ ] Zustand global store kurulumu (auth, posts, notifications)
- [ ] Mock kullanıcı/post/log verisi (seed data) oluşturma
- [ ] Layout bileşenleri: `Navbar`, `Sidebar`, `Footer`, `PageWrapper`
- [ ] Responsive grid sistemi kurulumu

**Çıktı:** `http://localhost:5173` üzerinde gezinilebilir iskelet

---

### Faz 2 — Kimlik Doğrulama (Auth)
**Hedef:** Demo Senaryo 1 — Kayıt, doğrulama, giriş, oturum.

- [ ] `/register` sayfası
  - `.edu` e-posta validasyonu (non-.edu → hata mesajı)
  - Rol seçimi: Engineer / Healthcare Professional
  - Form validasyonu (tüm alanlar)
- [ ] E-posta doğrulama adımı (mock akış — UI gösterimi yeterli)
- [ ] `/login` sayfası
  - Hatalı giriş mesajları
  - Başarılı giriş → Dashboard yönlendirmesi
- [ ] RBAC altyapısı: rol bazlı route koruması (`ProtectedRoute` bileşeni)
- [ ] Otomatik oturum zaman aşımı (mock)
- [ ] `/dashboard` — rol bazlı karşılama ekranı

**Çıktı:** Senaryo 1 demo akışı tamamlanmış

---

### Faz 3 — Post Yönetimi
**Hedef:** Demo Senaryo 2 — İlan oluşturma, düzenleme, yaşam döngüsü.

- [ ] `/posts/new` — İlan oluşturma formu
  - Mühendis alanları: çalışma domaini, açıklama, ihtiyaç duyulan uzmanlık, fikir özeti (gizli detay yok), tahmini işbirliği türü, gizlilik seviyesi
  - Doktor alanları: tıbbi alan, açıklama, istenen teknik uzmanlık, taahhüt seviyesi
  - Ortak alanlar: başlık, proje aşaması, şehir, ülke, son kullanma tarihi, auto-close seçeneği
  - **Kısıtlama UI:** dosya yükleme butonu yok / devre dışı bırakıldı
- [ ] Draft olarak kaydetme → "Draft" statü badge'i
- [ ] Yayınlama → "Active" statü badge'i
- [ ] `/posts/:id/edit` — Düzenleme sayfası
- [ ] "Partner Found" işaretleme → durum "Closed" olur
- [ ] Post yaşam döngüsü state makinesi: `Draft → Active → Meeting Scheduled → Partner Found → Expired`
- [ ] `/posts` — İlan listesi (seed data ile dolu görünüm)
- [ ] `/posts/:id` — İlan detay sayfası

**Çıktı:** Senaryo 2 demo akışı tamamlanmış

---

### Faz 4 — Arama & Filtreleme
**Hedef:** Demo Senaryo 3 — Filtreler, sonuç güncelleme, temizleme.

- [ ] Arama çubuğu (başlık/açıklama içinde arama)
- [ ] Filtre paneli:
  - Domain (kardiyoloji, onkoloji, vb.)
  - Uzmanlık türü (mühendis / sağlık profesyoneli)
  - Şehir
  - Ülke
  - Proje aşaması
  - Durum (Active / Draft / Closed / Expired)
- [ ] Anlık filtre güncelleme (debounce)
- [ ] Şehir bazlı eşleşme vurgusu
- [ ] Eşleşme açıklaması etiketi (örn. "Shared: Cardiology + ML")
- [ ] Filtreleri temizle butonu
- [ ] Boş sonuç durumu UI'ı

**Çıktı:** Senaryo 3 demo akışı tamamlanmış

---

### Faz 5 — Toplantı İstek Akışı
**Hedef:** Demo Senaryo 4 — İlgi bildirme, NDA, zaman dilimi, kabul.

- [ ] "Express Interest" butonu (ilan sahibi dışındaki kullanıcılar görür)
- [ ] NDA onay modal'ı (checkbox + kabul butonu)
- [ ] Zaman dilimi önerme formu (en az 3 slot)
- [ ] Gelen toplantı istekleri listesi (`/meetings`)
- [ ] Kabul / Red aksiyon butonları
- [ ] Kabul sonrası post statüsü → "Meeting Scheduled"
- [ ] İptal etme akışı
- [ ] Bildirim tetiklemesi (toplantı isteği, kabul, red)

**Çıktı:** Senaryo 4 demo akışı tamamlanmış

---

### Faz 6 — Admin Paneli
**Hedef:** Demo Senaryo 5 — Kullanıcı yönetimi, ilan yönetimi, loglar, CSV.

- [ ] `/admin` — Admin dashboard (sadece Admin rolü erişebilir)
- [ ] Kullanıcı yönetimi tablosu
  - Listeye, role göre filtreleme
  - Profil doluluk göstergesi
  - Askıya alma / deaktif etme aksiyonu
  - Aktivite metriği sütunu
- [ ] İlan yönetimi tablosu
  - Şehir, domain, durum filtreleri
  - Uygunsuz ilanı kaldırma
  - Yaşam döngüsü geçmişi görünümü
- [ ] Aktivite log tablosu
  - Alanllar: timestamp, userID, rol, aksiyon, hedef, sonuç
  - Tarih ve aksiyon türüne göre filtreleme
  - CSV export butonu (indirme simülasyonu)
- [ ] Platform istatistikleri widget'ları (toplam kullanıcı, aktif ilan, tamamlanan eşleşme)

**Çıktı:** Senaryo 5 demo akışı tamamlanmış

---

### Faz 7 — Profil & GDPR
**Hedef:** Demo Senaryo 6 — Profil düzenleme, hesap silme, veri export, bildirimler.

- [ ] `/profile` — Profil düzenleme sayfası (ad, kurum, bio, uzmanlık alanları)
- [ ] Hesap silme akışı: navigate → uyarı modal'ı → onay (silme **gerçekleşmiyor**, sadece UI)
- [ ] Veri dışa aktarma butonu (JSON indirme simülasyonu)
- [ ] `/notifications` — Bildirim merkezi
  - Okunmamış badge (Navbar'da)
  - Bildirimleri okundu olarak işaretleme
  - Tipler: toplantı isteği, kabul, ret, ilan kapandı

**Çıktı:** Senaryo 6 demo akışı tamamlanmış

---

### Faz 8 — Güvenlik & Non-Functional Gereksinimler
**Hedef:** GDPR, güvenlik, performans gereksinimlerini UI düzeyinde karşılama.

- [ ] Rate limiting bildirimi UI'ı (çok fazla başarısız giriş → "Too many attempts")
- [ ] Oturum zaman aşımı uyarı modal'ı
- [ ] Gizlilik politikası sayfası (`/privacy`)
- [ ] Tüm formların input sanitization kontrolü (XSS önlemi)
- [ ] HTTPS yönlendirme notu (deploy konfigürasyonu)
- [ ] Yükleme sürelerini optimize etme (lazy loading, code splitting)
- [ ] 1000 eş zamanlı kullanıcı için UI-level önlemler (pagination, virtualization)

---

### Faz 9 — Polish, Seed Data & Demo Hazırlığı
**Hedef:** Demo videosuna hazır, profesyonel görünümlü uygulama.

- [ ] Tüm seed data'nın dolu ve gerçekçi görünmesi (en az 10 ilan, 5 kullanıcı, 20 log)
- [ ] Boş durum (empty state) ekranlarının tamamlanması
- [ ] Hata ekranları (404, yetkisiz erişim)
- [ ] Loading skeleton bileşenleri
- [ ] Responsive kontrol (mobil, tablet, masaüstü)
- [ ] Renk kontrastı ve erişilebilirlik kontrolleri
- [ ] Demo akışlarının uçtan uca test edilmesi (6 senaryo)
- [ ] README ve kısa kullanıcı kılavuzu

---

## Demo Senaryoları → Faz Eşlemesi

| Demo Senaryosu | İlgili Faz |
|---|---|
| S1: Registration & Login | Faz 2 |
| S2: Post Creation & Management | Faz 3 |
| S3: Search & Filtering | Faz 4 |
| S4: Meeting Request Workflow | Faz 5 |
| S5: Admin Panel | Faz 6 |
| S6: Profile & GDPR | Faz 7 |

---

## Teknik Kısıtlamalar (Dokümandan)

- Dosya yükleme **kesinlikle yok** (teknik doküman, hasta verisi, repo işlevi)
- Toplantılar harici gerçekleşir — platform sadece eşleştirme yapar
- Hasta verisi **hiçbir yerde** saklanmaz
- Log'larda hasta verisi **olamaz**
- Sadece `.edu` kurumsal e-posta ile kayıt
