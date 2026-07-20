# Uygulama Durumu — Yamalar ve Ertelenen İşler

> **Tur 2 güncellemesi:** Push sonrası ikinci analiz/test turu yapıldı — 4 yeni düzeltme (CSS uyarısı kök nedeni, socket abonelik sızıntısı, API.md güncellemeleri, admin şifre script'i env desteği) ve i18n bulgusu için [ANALIZ-TUR-2.md](ANALIZ-TUR-2.md)'ye bakın.

**Tarih:** 17 Temmuz 2026
**Bağlam:** [ANALIZ-RAPORU.md](ANALIZ-RAPORU.md) bulgularından lokal testi etkilemeyen tüm yamalar uygulandı; tamamen deploy'a özgü işler bilinçli olarak ertelendi ve aşağıda listelendi.

**Doğrulama:** backend `tsc` temiz + **56/56 test** geçiyor (dist kopyaları artık koşulmuyor), backend prod build (`npm run build`) test/seed içermeden derleniyor, frontend `tsc` temiz + build başarılı + **20/20 test** geçiyor.

---

## ✅ Uygulanan Yamalar

### Güvenlik (kritik)
| Bulgu | Yapılan | Dosyalar |
|---|---|---|
| K1 | Register artık `admin` rolünü reddediyor (400) + regresyon testi | [authController.ts](../../backend/controllers/authController.ts), auth.test.ts |
| K3 (kod) | Quick-login bloğu ve DEV_ACCOUNTS yalnız `import.meta.env.DEV`'de — prod bundle'a girmiyor; README'den şifreler kaldırıldı | [LoginPage.tsx](../../frontend/src/pages/auth/LoginPage.tsx), README.md |
| K4 | `GET /api/meetings/:id` katılımcı/admin kontrolü + IDOR regresyon testleri | [meetingService.ts](../../backend/services/meetingService.ts), meetings.test.ts |
| K5 | `app.set('trust proxy', 1)` | [app.ts](../../backend/src/app.ts) |
| K6 (kod) | OAuth şifresi artık `crypto.randomBytes(32)` + bcrypt hash; `API_BASE_URL` tercihli callback base | [passport.ts](../../backend/src/passport.ts) |

### Güvenlik (yüksek/orta)
- **Y7:** Backend'de `.edu` e-posta zorunluluğu (frontend şemasıyla aynı regex) + test
- **Y8/O21:** `escapeRegExp` helper'ı; postService (domain/expertise/city/country), authService (admin arama), logService (action), weeklyDigest (expertise tag'leri) — tüm `$regex` girdileri escape'li
- **O5:** CORS reddi artık 403 (500 değil); origin listesi [config/origins.ts](../../backend/config/origins.ts)'te tekleşti
- **Y10:** Socket.io artık HTTP CORS ile aynı origin kurallarını (CLIENT_ORIGIN_EXTRA + Vercel preview regex) kullanıyor
- **O9:** E-posta şablonlarında (verify/reset/deleted/digest) kullanıcı verisi HTML-escape'li
- **O8 (hafif):** Profil güncellemede `avatarUrl` allowlist (`/uploads/...` veya https), name/bio uzunluk, expertiseTags ≤ 10×40 sınırları
- **O18:** Prod'da `TURNSTILE_SECRET_KEY` yoksa startup'ta uyarı loglanıyor

### Veri / GDPR
- **Y1:** Hesap silme kaskadı artık Conversation + Message + Comment + SavedSearch'ü de kapsıyor; `exportUserData` mesaj/yorum/kayıtlı arama/bildirimleri de içeriyor
- **Y2:** Transaction desteklenmeyen (standalone Mongo) ortamda otomatik transaction'sız silmeye düşüş
- **O6:** Post silinince aktif toplantılar iptal + bildirim, yorumlar temizleniyor
- **O7:** Yorum eklerken post varlığı ve `parentId`'nin aynı posta ait olduğu doğrulanıyor
- **Log TTL:** Audit loglara 24 ay TTL index (silme e-postasındaki taahhütle uyumlu)

### Bildirimler (Y4)
- Yeni `message_received` bildirim tipi (backend enum + frontend türleri/ikonları)
- `pushNotification` artık kullanıcının `notifPrefs` tercihlerini uyguluyor (kapalı kategoriye bildirim üretilmez; güvenlik bildirimleri `account_activity` her zaman gider)

### AI (Y6)
- `/api/ai/*` rotalarına 10 istek/dk rate limit
- `improvePost`'taki `JSON.parse` guard'landı (bozuk Gemini yanıtı artık 502, 500 değil)

### Dayanıklılık (O11/O12)
- Graceful shutdown (SIGTERM/SIGINT), `unhandledRejection` handler
- MongoDB bağlantısına 5 denemeli exponential backoff retry
- `lastActiveThrottle` Map'i periyodik temizleniyor (bellek sızıntısı önlendi)

### Build / Test / DX (O1, O13, O16)
- `tsconfig.build.json`: testler ve scriptler artık prod build'e derlenmiyor; vitest `dist/` hariç → sahte "4 failed test file" gürültüsü bitti
- Frontend: [lib/env.ts](../../frontend/src/lib/env.ts) tek kaynak — api/socket/Navbar/ProfilePage/PublicProfilePage'deki 5001/5000 port tutarsızlığı giderildi
- Axios 15 sn timeout; `deleteAccount` artık sessionStorage token'ını temizleyip socket'i kapatıyor
- Ölü kod temizliği: `src/data/mock*.ts` silindi, kullanılmayan `@google/generative-ai` bağımlılığı kaldırıldı
- Git hijyeni: `dev-server.*.log`, `backend/uploads/` (gerçek avatar PNG'leri) izlemeden çıkarıldı; bozuk `frontend/C:/Program Files/...` yolu silindi; `.gitignore`'a `*.log`, `backend/uploads/`, `.DS_Store` eklendi
- `index.html`: meta description, theme-color, favicon, OG etiketleri
- nginx'e `/uploads` proxy'si eklendi (docker prod senaryosunda avatar 404'ü çözer)
- Docs: README/DEPLOY.md'den `VITE_GEMINI_API_KEY` kaldırıldı; `API_BASE_URL` belgelendi (env.example + docker-compose.prod + DEPLOY.md)

### Lokal testte fark edeceğiniz davranış değişiklikleri
1. Kayıt artık yalnız `.edu` e-posta kabul ediyor (API dahil) ve `role: admin` reddediliyor.
2. Quick-login butonları yalnız `npm run dev`'de görünür; `vite preview`/prod build'de görünmez.
3. Bildirim tercihleri gerçekten çalışıyor — kapattığınız kategoriden bildirim gelmez.
4. Mesaj bildirimleri artık "toplantı isteği" değil, kendi tipiyle (mesaj ikonu) görünür.
5. AI özellikleri dakikada 10 istekle sınırlı.
6. Hesap silme; mesajları, yorumları ve kayıtlı aramaları da siler.

---

## ⏳ Ertelendi — Deploy Sırasında Yapılacaklar

| # | İş | Neden ertelendi | Nasıl yapılacak |
|---|---|---|---|
| D1 | **K2: Atlas şifresi + JWT secret rotasyonu ve git geçmişi temizliği** | Kullanıcı aksiyonu gerektirir (Atlas console + force push); lokal testte gerek yok | Atlas → Database Access → şifre yenile; `openssl rand -hex 64` ile yeni JWT_SECRET; `git filter-repo --path backend/.env.atlas --invert-paths` + `git push --force` (ekip bilgilendirilmeli) |
| D2 | **K3-prod: Prod DB'deki demo hesapların rotasyonu/silinmesi** | Prod DB'ye dokunur | Deploy öncesi `verify-seed-accounts.ts` ile kontrol; admin şifresini `reset-admin-password.ts` ile değiştir; demo hesapları prod'da tutma |
| D3 | **Y3: Kalıcı avatar depolama (S3/R2)** | Altyapı kararı + bucket/credential kurulumu | Railway+Vercel senaryosunda şart (konteyner FS ephemeral). Kısa vade: Railway Volume `uploads/` mount. Orta vade: Cloudflare R2 + imzalı URL |
| D4 | **Vercel güvenlik başlıkları + CSP** | Gerçek Railway URL'i gerekiyor; yanlış CSP prod'u kırar, lokal doğrulanamaz | Deploy sırasında [IYILESTIRMELER.md §2.4](IYILESTIRMELER.md)'teki `vercel.json` headers bloğunu gerçek URL'lerle uygula |
| D5 | **Railway env güncellemesi: `API_BASE_URL`** | Deploy ortamı değişkeni | Railway Variables'a `API_BASE_URL=https://<railway-url>` ekle (OAuth callback'leri için); `APP_BASE_URL` Vercel URL'i kalır |
| D6 | **Vercel'den `VITE_GEMINI_API_KEY` kaldırma (varsa)** | Deploy ortamı değişkeni | Vercel → Environment Variables → sil; anahtar yalnız Railway'de `GEMINI_API_KEY` |
| D7 | **GitHub OAuth callback URL güncellemesi** | Deploy URL'i gerekiyor | GitHub OAuth App → callback: `https://<railway-url>/api/auth/github/callback` |
| D8 | **Turnstile gerçek anahtarları** | Prod domain'e bağlı | Cloudflare Turnstile'da prod domain için site+secret key üret; Vercel + Railway'e ekle |
| D9 | **Atlas otomatik backup doğrulaması** | Atlas console işlemi | Cluster → Backup policy aktif mi kontrol et |
| D10 | **SMTP prod testi** | Gerçek SMTP hesabı | Deploy sonrası kayıt akışıyla uçtan uca doğrula |

## 📋 Ertelendi — Roadmap Fazlarında (deploy engeli değil)

- LinkedIn OAuth'un OIDC'ye taşınması veya kaldırılması (mevcut scope'lar LinkedIn'de deprecated) — Faz 3
- Refresh token + `passwordChangedAt` token iptali + hesap kilitleme — Faz 3
- OAuth redirect'inde one-time code (token'ın URL'de taşınmaması) — Faz 3
- Tam Zod validation middleware'i (şu an hedefli manuel kontroller var) — Faz 1/2
- ESLint + Prettier + GitHub Actions CI — Faz 2
- Sentry + pino-http + uptime izleme — Faz 2
- Bundle optimizasyonu (vendor chunk split, jspdf lazy import), font self-host — Faz 3
- Digest e-postasına tek tık unsubscribe — Faz 3
