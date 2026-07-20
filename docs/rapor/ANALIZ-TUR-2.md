# İkinci Tur Analiz Raporu

**Tarih:** 17 Temmuz 2026 (push `76b7bf2` sonrası)
**Kapsam:** Birinci tur yamalarının doğrulanması + ilk turda derinlemesine incelenmeyen alanlar: store'lar, i18n anahtar eşliği, kalan bileşenler (FloatingChat, SessionTimeoutModal, OAuthCallbackPage), kalan backend util/controller'ları, seed script'leri, API.md doğruluğu, build uyarıları.
**Önceki raporlar:** [ANALIZ-RAPORU.md](ANALIZ-RAPORU.md) · [UYGULAMA-DURUMU.md](UYGULAMA-DURUMU.md)

---

## 1. Doğrulama Sonuçları (push sonrası)

| Kontrol | Sonuç |
|---|---|
| Backend `tsc --noEmit` | ✅ Temiz |
| Backend test (Vitest + Supertest, replica-set memory Mongo) | ✅ 56/56 |
| Frontend `tsc -b` | ✅ Temiz |
| Frontend prod build | ✅ Başarılı, **CSS uyarısı bu turda giderildi** |
| Frontend test | ✅ 20/20 |
| Working tree | Push `76b7bf2` her şeyi içeriyordu; D1–D10 ertelenen işler [UYGULAMA-DURUMU.md](UYGULAMA-DURUMU.md)'de kayıtlı ve repoda |

---

## 2. Bu Turda Bulunan ve DÜZELTİLEN Sorunlar

### T2-1 — Vite build'de `css-syntax-error` uyarısı (kök neden bulundu)
Build her seferinde `▲ [WARNING] Expected identifier but found "-"` üretiyordu. Kök neden: [calendarExport.ts](../../frontend/src/utils/calendarExport.ts)'teki `replace(/[-:.]/g, '')` regex'i. Tailwind'in içerik tarayıcısı `.ts` dosyalarındaki **her metni** (yorumlar dahil) sınıf adayı olarak tarar; `[-:.]` metnini arbitrary-property sınıfı sanıp CSS'e geçersiz `-: .;` kuralı basıyordu. Regex `\W` ile yeniden yazıldı — davranış birebir aynı, uyarı sıfırlandı. (İlginç not: düzeltme yorumuna aynı literal yazılınca uyarı geri geldi; yorum da parantezsiz yazıldı.)

### T2-2 — App.tsx socket aboneliği sızıntısı
[App.tsx](../../frontend/src/App.tsx)'te `subscribeToSocketMessages()`'ın döndürdüğü `unsubscribe`, `setTimeout` callback'inden return ediliyordu — yani **hiç çağrılmıyordu**. Logout→login döngüsünde `new_message` listener'ları birikiyordu (mesaj dedup guard'ı sayesinde veri bozulmuyordu ama listener sızıntısıydı). Cleanup artık hem timeout'u temizliyor hem aboneliği kapatıyor.

### T2-3 — API.md güncel değildi
- Register açıklaması "returns token immediately (no email verification)" diyordu — e-posta doğrulama akışı var; düzeltildi.
- Rol listesi `admin`'i içeriyordu — K1 yamasıyla artık geçersiz; düzeltildi ve `.edu` kuralı belgelendi.
- `GET /api/meetings/:id` yeni 403 davranışı (K4) belgelendi.

### T2-4 — reset-admin-password.ts sabit şifre
Script `Admin1234!` şifresini hardcode ediyordu. Artık `ADMIN_NEW_PASSWORD` / `ADMIN_EMAIL` env değişkenlerini okuyor (D2 rotasyon adımı için gerekli araç hazır).

---

## 3. Bu Turda Bulunan, NOT EDİLEN (düzeltilmeyen) Bulgular

### T2-5 — i18n: es / nl / pt çevirileri büyük ölçüde eksik 🔶
Anahtar eşliği ölçümü (en.json referans):

| Dil | Eksik anahtar | Durum |
|---|---|---|
| tr | 0 | ✅ Tam |
| es | **528** | 🔶 Çoğu ekran İngilizce'ye düşer |
| nl | **528** | 🔶 Çoğu ekran İngilizce'ye düşer |
| pt | **528** | 🔶 Çoğu ekran İngilizce'ye düşer |

Eksik anahtarlar `fallbackLng: 'en'` sayesinde kırılmıyor ama dil seçicide **ES/NL/PT tam dil olarak sunuluyor** — kullanıcı beklentisiyle çelişir. Öneri (Faz 3'e eklendi): ya çevirileri tamamlayın ya da tamamlanana kadar bu üç dili [LanguageToggle](../../frontend/src/components/ui/LanguageToggle.tsx)'dan gizleyin. CI'da anahtar-eşliği kontrolü (bu ölçümde kullanılan script) eklenebilir.

### T2-6 — Küçük gözlemler (düşük öncelik)
- `notificationStore.push` başarısız olursa (403 vb.) optimistic yerel bildirim gösteriyor — yalnız AdminPage kullandığı için bugün zararsız; ileride yanıltıcı olabilir.
- Okunmamış sayaçları iki kaynaktan besleniyor (30 sn polling + socket increment) — nadiren geçici tutarsızlık gösterebilir, polling düzeltiyor.
- `weeklyDigest`'te tag yokken `expertiseRequired: undefined` filtrede kalıyor — Mongoose undefined'ı sorgudan düşürdüğü için davranış doğru; yine de okunabilirlik için koşullu spread önerilir.
- OAuthCallbackPage `replace: true` ile token'lı URL'i history'den siliyor (iyi); token'ın URL'de hiç taşınmaması (one-time code) Faz 3'te.

### 3.1 Temiz çıkan incelemeler
FloatingChat (dahili mesajlaşma; dış servis çağrısı yok), SessionTimeoutModal (timer/cleanup doğru), conversationStore (dedup + yetkiler doğru), meetingStore/postStore kullanım yolları, logController, asyncHandler/AppError/controllerLog, tests/setup (MongoMemoryReplSet → transaction'lı silme testleri gerçekçi), seed script'leri (admin'i DB'ye doğrudan yazıyor — K1 yamasından etkilenmez), Turnstile siteKey kullanımları.

---

## 4. Ertelenen Deploy İşleri — Durum Teyidi

[UYGULAMA-DURUMU.md](UYGULAMA-DURUMU.md) D1–D10 listesi push'ta repoya girdi, güncel ve geçerli. Bu turda eklenen tek ilgili not: **D2 artık kolaylaştı** — `reset-admin-password.ts` şifreyi `ADMIN_NEW_PASSWORD` env'inden alıyor (T2-4).

Roadmap tarafına bu turdan eklenen madde: **i18n tamamlama/daraltma kararı (T2-5)** — [YOL-HARITASI.md](YOL-HARITASI.md) Faz 3b'deki "i18n tamamlama" başlığının kapsamı netleşti: 3 dilde 528'er eksik anahtar.
