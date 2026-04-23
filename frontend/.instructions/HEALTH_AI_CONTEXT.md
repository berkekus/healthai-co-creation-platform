# HEALTH AI CONTEXT SKILL — Domain Bilgisi & Platform Mantığı
> Projenin sağlık sektörüne özgü terminoloji sözlüğü ve iş mantığı referansı.
> UI metinleri, placeholder içerikleri ve seed data bu dosyadan türetilir.

---

## 1. Platform Kimliği

**Resmi Ad:** HEALTH AI Co-Creation Platform  
**Kısa Ad:** HEALTH AI  
**Hedef Kitle:** Avrupa merkezli sağlık teknolojisi ekosistemi  
**Temel Misyon:** Mühendisler ile sağlık profesyonelleri arasındaki yapılandırılmış, güvenli iş birliği köprüsü  
**Ders Bağlamı:** SENG 384 – Spring 2026 (Bilgisayar Mühendisliği, Kurumsal Proje)

---

## 2. Kullanıcı Rolleri

### 2.1 Engineer (Mühendis)
- Biyomedikal, yazılım, donanım, veri bilimi, AI/ML mühendisleri
- Teknik fikir sahibidir, klinik validasyon için sağlık uzmanına ihtiyaç duyar
- Platform'da: ilan oluşturur veya sağlık profesyonellerinin ilanlarına ilgi gösterir

### 2.2 Healthcare Professional (Sağlık Profesyoneli)
- Doktor, hemşire, klinisyen, sağlık yöneticisi, araştırmacı
- Klinik sorun tanımlar, mühendislik uygulaması için mühendise ihtiyaç duyar
- Platform'da: ilan oluşturur veya mühendislerin ilanlarına ilgi gösterir

### 2.3 Admin (Yönetici)
- Platform moderatörü
- İlan kaldırabilir, kullanıcı askıya alabilir, logları izleyebilir
- Doğrudan RBAC koruması altında

---

## 3. Tıbbi Domain Listesi (Filtre & Form Seçenekleri)

```typescript
export const MEDICAL_DOMAINS = [
  { value: 'cardiology',         label: 'Cardiology' },
  { value: 'oncology',           label: 'Oncology' },
  { value: 'radiology',          label: 'Radiology & Imaging' },
  { value: 'neurology',          label: 'Neurology' },
  { value: 'orthopedics',        label: 'Orthopedics' },
  { value: 'dermatology',        label: 'Dermatology' },
  { value: 'ophthalmology',      label: 'Ophthalmology' },
  { value: 'pediatrics',         label: 'Pediatrics' },
  { value: 'psychiatry',         label: 'Psychiatry & Mental Health' },
  { value: 'emergency',          label: 'Emergency Medicine' },
  { value: 'icu',                label: 'Intensive Care (ICU)' },
  { value: 'surgery',            label: 'Surgical Robotics' },
  { value: 'genomics',           label: 'Genomics & Precision Medicine' },
  { value: 'rehabilitation',     label: 'Rehabilitation & Physio' },
  { value: 'pharmacy',           label: 'Clinical Pharmacy' },
  { value: 'public_health',      label: 'Public Health & Epidemiology' },
  { value: 'pathology',          label: 'Pathology & Lab Diagnostics' },
  { value: 'endocrinology',      label: 'Endocrinology & Diabetes' },
  { value: 'remote_monitoring',  label: 'Remote Patient Monitoring' },
  { value: 'mental_health_ai',   label: 'Mental Health AI' },
] as const;
```

---

## 4. Mühendislik Uzmanlık Alanları

```typescript
export const ENGINEERING_DOMAINS = [
  { value: 'ml_ai',              label: 'Machine Learning / AI' },
  { value: 'computer_vision',    label: 'Computer Vision' },
  { value: 'nlp',                label: 'Natural Language Processing' },
  { value: 'embedded',           label: 'Embedded Systems / IoT' },
  { value: 'biomedical_eng',     label: 'Biomedical Engineering' },
  { value: 'software_backend',   label: 'Backend / Cloud Engineering' },
  { value: 'software_frontend',  label: 'Frontend / UX Engineering' },
  { value: 'data_engineering',   label: 'Data Engineering & Analytics' },
  { value: 'robotics',           label: 'Robotics & Mechatronics' },
  { value: 'signal_processing',  label: 'Signal Processing' },
  { value: 'cybersecurity',      label: 'Healthcare Cybersecurity' },
  { value: 'regulatory',         label: 'Regulatory Affairs (CE/FDA)' },
] as const;
```

---

## 5. Proje Aşamaları (Post Lifecycle — "Project Stage")

| Değer | Etiket | Açıklama |
|---|---|---|
| `idea` | Idea | Ham fikir, henüz yapılandırılmamış |
| `concept_validation` | Concept Validation | Literatür araştırması, fizibilite soruları |
| `prototype` | Prototype Developed | Çalışan prototip mevcut |
| `pilot` | Pilot Testing | Küçük ölçekli klinik pilot |
| `pre_deployment` | Pre-Deployment | Klinik entegrasyona hazırlık |

---

## 6. İşbirliği Türleri (Collaboration Type)

| Değer | Etiket | Anlamı |
|---|---|---|
| `advisor` | Advisor | Kısa süreli danışmanlık (birkaç saat/ay) |
| `co_founder` | Co-Founder | Uzun vadeli, hisseli ortaklık |
| `research_partner` | Research Partner | Akademik araştırma iş birliği |
| `contract` | Contract Work | Ücretli proje bazlı çalışma |

---

## 7. Gizlilik Seviyeleri (Confidentiality Level)

| Değer | Etiket | Platform Davranışı |
|---|---|---|
| `public_pitch` | Public Pitch | Kısa fikir özeti herkese görünür |
| `meeting_only` | Details in Meeting Only | Sadece başlık ve domain görünür; detaylar toplantıda paylaşılır |

**Önemli:** Platform dokümanı "dosya yükleme yasak" der. Gizlilik seviyesi ne olursa olsun IP, teknik doküman veya hasta verisi paylaşım alanı yoktur.

---

## 8. Post Yaşam Döngüsü (State Machine)

```
DRAFT ──publish──► ACTIVE ──interest+NDA──► MEETING_SCHEDULED
                                                    │
                              ┌─────────────────────┤
                              ▼                     ▼
                       PARTNER_FOUND           (devam eden)
                         (CLOSED)
ACTIVE / MEETING_SCHEDULED ──expiry date──► EXPIRED
```

**UI'da gösterilecek geçişler:**
- Taslaktan yayınla → "Publish Post" butonu
- İlgi → NDA → zaman dilimi → kabul → "Meeting Scheduled"
- "Mark as Partner Found" → kapatır, arşivlenir
- Expiry date geçince → otomatik EXPIRED badge

---

## 9. Toplantı İstek Akışı (Meeting Request Workflow)

```
1. İlgi Bildirme    → "Express Interest" butonu + kısa mesaj
2. NDA Onayı        → Modal: checkbox + "I Accept & Continue"
3. Zaman Dilimi     → Min 3 slot öner (tarih + saat)
4. İlan Sahibi      → Slot seçer veya reddeder
5. Onay             → Her iki taraf bildirim alır
6. Harici Toplantı  → Zoom/Teams (platform dışı)
7. Kapatma          → İlan sahibi "Partner Found" işaretler
```

**NDA Modal metni:**
> "By proceeding, you acknowledge that any information shared during this collaboration process is confidential. You agree not to disclose, reproduce, or use the information shared by the other party without explicit written consent."

---

## 10. Aktivite Log Olay Tipleri

```typescript
export const LOG_ACTIONS = [
  'USER_LOGIN',
  'USER_LOGOUT',
  'LOGIN_FAILED',
  'USER_REGISTERED',
  'POST_CREATED',
  'POST_EDITED',
  'POST_CLOSED',
  'POST_EXPIRED',
  'POST_REMOVED_BY_ADMIN',
  'MEETING_REQUEST_SENT',
  'MEETING_REQUEST_ACCEPTED',
  'MEETING_REQUEST_DECLINED',
  'MEETING_REQUEST_CANCELLED',
  'PARTNER_FOUND_MARKED',
  'USER_SUSPENDED',
  'USER_DEACTIVATED',
  'ACCOUNT_DELETED_REQUEST',
  'DATA_EXPORT_REQUESTED',
  'ADMIN_LOGIN',
  'SECURITY_RATE_LIMIT_HIT',
] as const;
```

**Log kaydı alanları:** `timestamp | userId | role | action | targetEntityId | result | ipAddress (opsiyonel)`  
**Saklama süresi:** 24 ay  
**Erişim:** Sadece Admin

---

## 11. Seed Data Şehirleri & Ülkeleri

```typescript
export const SEED_LOCATIONS = [
  { city: 'Berlin',     country: 'Germany' },
  { city: 'Amsterdam',  country: 'Netherlands' },
  { city: 'London',     country: 'United Kingdom' },
  { city: 'Paris',      country: 'France' },
  { city: 'Stockholm',  country: 'Sweden' },
  { city: 'Vienna',     country: 'Austria' },
  { city: 'Zurich',     country: 'Switzerland' },
  { city: 'Helsinki',   country: 'Finland' },
  { city: 'Copenhagen', country: 'Denmark' },
  { city: 'Barcelona',  country: 'Spain' },
  { city: 'Istanbul',   country: 'Turkey' },
  { city: 'Warsaw',     country: 'Poland' },
];
```

---

## 12. GDPR Gereksinimleri (UI Bağlamı)

| Gereksinim | UI Uygulaması |
|---|---|
| Veri minimizasyonu | Formda sadece zorunlu alanlar; isteğe bağlı olanlar açıkça etiketlenir |
| Hesap silme hakkı | Profile → "Delete Account" → uyarı modal → onay (demo'da gerçek silme yok) |
| Veri dışa aktarma | Profile → "Export My Data" → JSON indirme simülasyonu |
| Gizlilik politikası | Footer'da link, kayıt formunda onay checkbox'ı |
| Hasta verisi yasağı | Formda "patient data" alanı yok; helptext uyarı ekler |
| Oturum zaman aşımı | 30 dakika hareketsizlik → uyarı modal → otomatik çıkış |

---

## 13. Kesin Kısıtlamalar (Dokümandan Doğrudan)

Bunlar tasarım kararı değil, proje şartı olan kısıtlamalardır:

1. **Dosya yükleme yok** — teknik doküman, IP, hasta verisi, hiçbir şey
2. **Toplantı kaydı yok** — platform sadece eşleştirme yapar
3. **Kişisel e-posta yasak** — yalnızca `.edu` kurumsal
4. **Hasta verisi yasak** — formda, logda, profilde, hiçbir yerde
5. **Log manipülasyonu yasak** — loglar tamper-resistant olmalı (UI'da "sil" butonu yok)
6. **Admin dışı log erişimi yok** — kullanıcılar kendi log'larını göremez

---

## 14. UI Metin Rehberi (Tone of Voice)

- **Dil:** İngilizce (Avrupa hedef kitlesi)
- **Ton:** Profesyonel, net, teşvik edici — asla klinik soğukluğu değil
- **CTA örnekleri:**
  - "Post a Collaboration Opportunity" (ilan oluştur)
  - "Express Interest" (ilgi bildir)
  - "Schedule a Meeting" (toplantı planla)
  - "Mark as Partner Found" (eşleşme tamamlandı)
  - "Archive Post" (arşivle)
- **Hata mesajı tonu:** Açıklayıcı ve yönlendirici → "Only institutional .edu emails are accepted. Personal email addresses are not permitted."
- **Boş durum metni:** Motivasyonel → "No active posts in this area yet. Be the first to post a collaboration opportunity!"
