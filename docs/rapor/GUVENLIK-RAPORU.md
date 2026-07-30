# Güvenlik Denetim Raporu

**Tarih:** 30 Temmuz 2026 (branch `deploy-review`, HEAD `457553d`)
**Kapsam:** Canlıya çıkış öncesi tüm proje güvenlik denetimi — kimlik doğrulama zinciri, yetkilendirme (route + servis katmanı), enjeksiyon yüzeyleri, veri sızıntısı, sır yönetimi, dosya yükleme, OAuth akışı, socket katmanı, taşıma güvenliği ve GDPR uyumu. Sadece son commit'lerin diff'i değil, tüm kod tabanı okundu.
**Yöntem:** Route koruma matrisi taraması + auth/authz kod yolu okuması + veri akışı izleme + `npm audit`. Tüm bulgular kod okunarak doğrulandı; spekülatif bulgular rapora alınmadı.
**Önceki raporlar:** [ANALIZ-RAPORU.md](ANALIZ-RAPORU.md) · [ANALIZ-TUR-2.md](ANALIZ-TUR-2.md) · [IYILESTIRMELER.md](IYILESTIRMELER.md) · [UYGULAMA-DURUMU.md](UYGULAMA-DURUMU.md)

---

## 1. Yönetici Özeti

**Soru:** Bu proje canlıya alındığında kullanıcılar gözü kapalı güvenerek kaydolabilir, veri paylaşabilir mi?

**Cevap: Şu hâliyle hayır — ama sorun yaygın bir zafiyet dağılımı değil, 3 noktada yoğunlaşmış.**

Kod tabanının güvenlik zemini beklenenden iyi. Temel savunmaların büyük kısmı doğru kurulmuş ve `ROADMAP.md`'de P0 olarak işaretlenmiş iki eski açık (meeting listesi yetkisi, draft listeleme) gerçekten kapatılmış. Ancak platformun **kimlik güveni** — yani "buradaki insanlar gerçekten doğrulanmış kurumsal profesyonel mi" iddiası — OAuth akışında tamamen çökmüş durumda, ve yayınlanmamış gizli içerik doğrudan ID ile okunabiliyor.

| Severity | Adet | Durum |
|---|---|---|
| 🔴 HIGH | 3 | Canlıya çıkış engeli |
| 🟠 MEDIUM | 3 | Aynı sprint içinde kapatılmalı |
| 🟡 LOW | 4 | Sıkılaştırma, engel değil |
| 🔵 Gizlilik/GDPR | 2 | Hukuki risk — kod hatası değil |

---

## 2. Doğru Yapılmış Olanlar

Bu bölüm bilerek raporun başına konuldu: aşağıdaki bulgular "her yeri delik bir proje" tablosu değil, sağlam bir zeminde belirli boşluklar olarak okunmalı.

| Alan | Durum | Kanıt |
|---|---|---|
| Şifre saklama | bcrypt, 12 round | [authService.ts:20](../../backend/services/authService.ts#L20) |
| Token üretimi | 32 byte `crypto.randomBytes` | [authService.ts:23-25](../../backend/services/authService.ts#L23-L25) |
| Token saklama | DB'ye SHA-256 **hash'lenerek** yazılıyor | [authService.ts:27-29](../../backend/services/authService.ts#L27-L29) |
| Kullanıcı sayımı (enumeration) | `forgot-password` / `resend-verification` generic mesaj dönüyor | [authService.ts:392-395](../../backend/services/authService.ts#L392-L395) |
| Şifre alanı | `select: false` — kazara serialize edilemez | [User.ts:67](../../backend/models/User.ts#L67) |
| Rol kaynağı | `protect` rolü token'dan değil **her istekte DB'den** okuyor | [authMiddleware.ts:50-61](../../backend/middleware/authMiddleware.ts#L50-L61) |
| Süspansiyon | Her istekte DB'den kontrol — anında etkili | [authMiddleware.ts:55-58](../../backend/middleware/authMiddleware.ts#L55-L58) |
| Admin route'ları | Tamamı `protect, adminOnly` ile kapalı | [authRoutes.ts:36-46](../../backend/routes/authRoutes.ts#L36-L46), [logRoutes.ts:7](../../backend/routes/logRoutes.ts#L7), [notificationRoutes.ts:12](../../backend/routes/notificationRoutes.ts#L12) |
| PII ayrımı | `getAllUsers` (e-posta dahil) admin-only; public profil `publicSanitize` ile e-postasız | [authService.ts:59-73](../../backend/services/authService.ts#L59-L73) |
| Mesaj gizliliği | **Her** okuma/yazma yolunda `isParticipant` kontrolü | [conversationService.ts:43-63](../../backend/services/conversationService.ts#L43-L63) |
| Route kapsamı | Korumasız route yok; `conversationRoutes` `router.use(protect)` ile kapalı | [conversationRoutes.ts:16](../../backend/routes/conversationRoutes.ts#L16) |
| Socket | JWT doğrulanıyor, yalnızca `user:<kendi-id>` odasına katılıyor — client-controlled join yok | [socket.ts:23-37](../../backend/src/socket.ts#L23-L37) |
| Sahiplik kontrolleri | Post/meeting/comment mutasyonlarında tutarlı `403` | [postService.ts:91,130,141](../../backend/services/postService.ts#L91), [meetingService.ts:62-63,87](../../backend/services/meetingService.ts#L62-L63) |
| NoSQL enjeksiyon | `express-mongo-sanitize` + regex girdilerinde `escapeRegExp` | [app.ts:41](../../backend/src/app.ts#L41), [authService.ts:210](../../backend/services/authService.ts#L210) |
| XSS | Frontend'de `dangerouslySetInnerHTML`/`innerHTML`/`eval` **hiç yok**; e-posta şablonlarında `escapeHtml` | [emailService.ts:54,74,94](../../backend/services/emailService.ts#L54) |
| Hata yönetimi | 500'lerde stack/iç detay sızmıyor | [errorHandler.ts:57-60](../../backend/middleware/errorHandler.ts#L57-L60) |
| Path traversal | `deleteAvatarFile` `path.basename` ile doğru şekilde sınırlandırılmış | [uploadMiddleware.ts:41-42](../../backend/middleware/uploadMiddleware.ts#L41-L42) |
| Upload kontrolü | MIME + uzantı allowlist, 5 MB limit, dosya adı sunucuda üretiliyor | [uploadMiddleware.ts:12-36](../../backend/middleware/uploadMiddleware.ts#L12-L36) |
| Yetkisiz admin kaydı | `VALID_ROLES` whitelist — self-register ile `admin` alınamaz | [authController.ts:14,37](../../backend/controllers/authController.ts#L14) |
| Sır yönetimi | `.env` git'te takipte **değil**; Gemini anahtarı yalnızca backend'de | `git ls-files` doğrulandı |
| Diğer | `helmet`, 10kb JSON limiti, `trust proxy` doğru ayarlı, GDPR export/cascade delete transaction'lı | [app.ts:27-40](../../backend/src/app.ts#L27-L40) |

### 2.1 Kapatıldığı doğrulanan eski açıklar

| ROADMAP maddesi | Durum | Kanıt |
|---|---|---|
| #5 — `GET /meetings?postId=X` yetkisiz erişim | ✅ Kapatılmış | [meetingController.ts:73-82](../../backend/controllers/meetingController.ts#L73-L82) post sahipliği kontrolü |
| #4 — `GET /posts` draft'ları herkese açıyor | ✅ Kapatılmış (listelemede) | [postController.ts:57](../../backend/controllers/postController.ts#L57) `forceScopeToOwn` |
| #3 — Login/register failure log'u atılmıyor | ✅ Kapatılmış | [authController.ts:65-74,101-110](../../backend/controllers/authController.ts#L65-L74) |

> ⚠️ #4'ün listeleme yolu kapatılmış ama **tek-kayıt yolu açık kalmış** — bkz. G-3.

---

## 3. 🔴 HIGH — Canlıya Çıkış Engeli

### G-1 — OAuth, `.edu` kurumsal doğrulama kapısını tamamen atlıyor

**Nerede:** [passport.ts:41-52](../../backend/src/passport.ts#L41-L52) (GitHub), [passport.ts:83-94](../../backend/src/passport.ts#L83-L94) (LinkedIn)
**Kategori:** `authorization_bypass` / güven modeli ihlali
**Güven:** Yüksek (kod yolu kesin)

**Sorun:** Normal kayıt akışı kurumsal e-posta zorunlu tutuyor:

```ts
// authController.ts:33
if (!EDU_EMAIL_RE.test(email)) {
  res.status(400).json({ success: false, message: 'Only institutional .edu email addresses are accepted' })
```

OAuth akışında ise **hiçbir `.edu` kontrolü yok**. Kullanıcı doğrudan `isVerified: true` olarak yaratılıyor ve rol provider'a göre otomatik atanıyor:

| Giriş yolu | Atanan rol | `.edu` kontrolü | E-posta doğrulaması |
|---|---|---|---|
| `POST /api/auth/register` | Kullanıcı seçer (`engineer` \| `healthcare_professional`) | ✅ Zorunlu | ✅ Zorunlu |
| `GET /api/auth/github` | `engineer` | ❌ Yok | ❌ Atlanıyor (`isVerified: true`) |
| `GET /api/auth/linkedin` | `healthcare_professional` | ❌ Yok | ❌ Atlanıyor (`isVerified: true`) |

**Sömürü senaryosu:** Saldırgan gmail adresli bir LinkedIn hesabıyla `/api/auth/linkedin`'e gider. Sistem ona doğrulanmış bir hesap ve platformun klinik güvenilirlik sinyali olan **`healthcare_professional`** rolünü hiçbir kontrol olmadan verir. Bu rolle sağlık profesyonellerine toplantı talebi gönderir, NDA akışına girer ve gizli iş birliği içeriğine erişir. Projenin bütün değer önerisi "doğrulanmış kurumsal profesyoneller" olduğu için bu tek başına güven modelini geçersiz kılar.

**Fix:**
1. OAuth callback'inde de `EDU_EMAIL_RE` uygula. Geçmiyorsa hesabı `isVerified: false` + rolsüz "pending" durumda bırak ve kurumsal e-posta doğrulaması iste.
2. Rolü provider'dan türetmeyi tamamen bırak — rol kullanıcıya sorulmalı.
3. Alternatif ve en basit çözüm: **OAuth'u kapat.** `.edu` zorunluluğu olan bir platformda GitHub/LinkedIn girişi kavramsal olarak çelişkili; `GITHUB_CLIENT_ID`/`LINKEDIN_CLIENT_ID` env'lerini boş bırakmak stratejileri hiç kaydetmez ([passport.ts:20,62](../../backend/src/passport.ts#L20)).

---

### G-2 — OAuth hesap eşleştirmesi doğrulanmamış e-postayla hesap devralmaya açık

**Nerede:** [passport.ts:31](../../backend/src/passport.ts#L31) (GitHub), [passport.ts:73](../../backend/src/passport.ts#L73) (LinkedIn)
**Kategori:** `authentication_bypass`
**Güven:** Orta-yüksek — sömürü provider davranışına bağlı, ama **kontrolün tamamen yokluğu** kesin

**Sorun:**

```ts
const email = (profile.emails?.[0]?.value ?? '').toLowerCase()
let user = await User.findOne({ $or: [{ githubId: profile.id }, ...(email ? [{ email }] : [])] })

if (user) {
  if (!user.githubId) {
    user.githubId = profile.id       // sessizce link'lenir
    await user.save()
  }
}
return done(null, user)              // → bu kullanıcı olarak oturum açılır
```

Provider'dan gelen e-posta mevcut yerel hesapla eşleştirilip sessizce link'leniyor ve **o kullanıcı olarak JWT veriliyor**. GitHub'ın `/user/emails` yanıtındaki `verified` bayrağı hiç kontrol edilmiyor; ayrıca `[0]` indeksi ile listedeki ilk adres körlemesine alınıyor.

**Sömürü senaryosu:** Saldırgan kendi GitHub hesabına kurbanın `elif.kaya@istanbul.edu.tr` adresini ekler (GitHub doğrulanmamış adres eklemeye izin verir). Bu adres `profile.emails` listesinde ilk sırada döndüğü anda GitHub ile giriş kurbanın mevcut hesabıyla eşleşir ve saldırgana o hesap için geçerli **7 günlük JWT** verilir — şifreyi hiç bilmeden, e-posta doğrulamasını atlayarak.

**Dürüst sınır:** Sömürünün pratikte çalışması, `passport-github2`'nin doğrulanmamış adresleri listeye koymasına ve sıralamaya bağlıdır; bu yüzden güven derecesi G-1 ve G-3'ten bir tık düşük. LinkedIn varyantı daha zayıf risk (LinkedIn e-postaları provider tarafından doğrulanmış gelir). Ancak kontrolün **hiç yazılmamış** olması, provider davranışına bel bağlamak anlamına geliyor — bu kabul edilemez bir varsayım.

**Fix:**
1. `profile.emails.find(e => e.verified)?.value` kullan; doğrulanmış e-posta yoksa `done(null, false)` ile reddet.
2. Daha güvenlisi: e-posta eşleşmesiyle **otomatik link kurmayı bırak**. OAuth'u mevcut hesaba bağlamak, kullanıcı zaten şifreyle giriş yapmışken profil ayarlarından yapılan bilinçli bir eylem olmalı. Eşleşme bulunduğunda oturum açmak yerine "bu e-posta zaten kayıtlı, şifrenizle giriş yapıp ayarlardan bağlayın" de.

---

### G-3 — IDOR: her giriş yapmış kullanıcı başkasının draft ilanını okuyabilir

**Nerede:** [postController.ts:45-48](../../backend/controllers/postController.ts#L45-L48) → [postService.ts:43-47](../../backend/services/postService.ts#L43-L47)
**Kategori:** `idor` / `data_exposure`
**Güven:** Yüksek (kod yolu kesin)

**Sorun:**

```ts
// postController.ts:45-48
export const getPost = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const post = await postService.getPostById(req.params.id)   // sahiplik/status kontrolü YOK
  res.json({ success: true, data: post })
})

// postService.ts:43-47
export async function getPostById(id: string) {
  const post = await Post.findById(id)
  if (!post) throw makeError('Post not found', 404)
  return post                                                 // draft dahil her şey
}
```

Listeleme tarafında draft koruması **özenle** yapılmış — [postController.ts:57](../../backend/controllers/postController.ts#L57) `forceScopeToOwn` ile non-admin bir kullanıcı `?status=draft` derse sorgu zorla kendi `authorId`'sine daraltılıyor. Ancak `GET /api/posts/:id` bu korumanın tamamen dışında kalmış.

**Neden ciddi:** Draft'lar yayınlanmamış iş birliği önerileri. Ürünün kendisi bu içeriği hassas kabul ediyor — `Post` modelinde `confidentiality` alanı var ve toplantı akışında NDA kapısı ([meetingService.ts:33](../../backend/services/meetingService.ts#L33) `ndaAccepted`) bulunuyor. Yani henüz yayınlanmamış proje fikirleri / fikri mülkiyet.

**"ID'yi bilemez" savunması geçersiz:** MongoDB ObjectId = 4 byte timestamp + 5 byte process-random + 3 byte artan sayaç. Process-random kısmı sunucu ömrü boyunca **sabittir**; saldırgan kendi bir post'unun ID'sini alıp sayacı ve timestamp'i yürüterek aynı süreçte yaratılmış diğer post ID'lerini üretebilir.

**Fix:** `getPostById`'a `requesterId` + `isAdmin` parametreleri geçir ve `status === 'draft'` ise yalnızca sahibine/admin'e döndür — [postService.ts:91](../../backend/services/postService.ts#L91)'deki `updatePost` deseninin aynısı:

```ts
export async function getPostById(id: string, requesterId: string, isAdmin = false) {
  const post = await Post.findById(id)
  if (!post) throw makeError('Post not found', 404)
  if (post.status === 'draft' && !isAdmin && post.authorId.toString() !== requesterId) {
    throw makeError('Post not found', 404)   // 403 değil 404 — varlık sızdırmamak için
  }
  return post
}
```

---

## 4. 🟠 MEDIUM

### G-4 — Oturum iptali yok; `logout` kozmetik

**Nerede:** [authController.ts:213-223](../../backend/controllers/authController.ts#L213-L223), [authService.ts:232](../../backend/services/authService.ts#L232), [authService.ts:407](../../backend/services/authService.ts#L407)
**Kategori:** `session_management`
**Güven:** Yüksek

`logout` yalnızca audit log yazıyor; JWT tam ömrü boyunca (varsayılan **7 gün**) geçerli kalmaya devam ediyor. Dahası `changePassword` ve `resetPassword` da mevcut oturumları geçersizleştirmiyor.

**Somut sonuç:** Kullanıcı "hesabıma giren oldu, şifremi değiştirdim" dediğinde saldırgan **7 güne kadar içeride kalır**. Bu, kullanıcının kendini koruma refleksinin işe yaramaması demek — güven açısından en rahatsız edici madde.

**Kısmi hafifletici:** `protect` her istekte `isSuspended`'ı DB'den okuduğu için admin süspansiyonu anında etkili ([authMiddleware.ts:55-58](../../backend/middleware/authMiddleware.ts#L55-L58)).

**Fix:** `User`'a `tokenVersion: { type: Number, default: 0 }` ekle, JWT payload'ına koy, `protect`'te DB değeriyle karşılaştır; `changePassword` / `resetPassword` / `logout`'ta `$inc: { tokenVersion: 1 }`. `protect` zaten kullanıcıyı DB'den çekiyor, ek sorgu maliyeti yok.

---

### G-5 — CAPTCHA production'da sessizce fail-open

**Nerede:** [verifyTurnstile.ts:4](../../backend/utils/verifyTurnstile.ts#L4)
**Kategori:** `security_control_bypass`
**Güven:** Yüksek

```ts
const secret = process.env.TURNSTILE_SECRET_KEY
if (!secret || process.env.NODE_ENV !== 'production') return true   // ← GEÇİRİR
```

`TURNSTILE_SECRET_KEY` production'da tanımsızsa fonksiyon `false` değil **`true`** döner — yani register, login ve forgot-password'daki bot koruması tamamen devre dışı kalır. Tek sinyal [index.ts:25-27](../../backend/src/index.ts#L25-L27)'deki bir uyarı log satırı; süreç yine de ayağa kalkar.

**Sömürü senaryosu:** Railway panelinde bu tek env var'ı atlamak (veya bir yeniden yapılandırmada düşürmek) yeterli. Sonuç: otomatik kredensiyal doldurma ve sınırsız sahte hesap üretimi. `authLimiter`'ın 15 dakikada 20 istek limiti IP başına olduğundan dağıtık bir bot bunu kolayca aşar.

**Fix:** Fail-closed yap. Production'da secret yoksa ya `return false` ver ya da boot'ta reddet:

```ts
// index.ts — REQUIRED_ENV'e ekle
const REQUIRED_ENV = ['JWT_SECRET', 'MONGO_URI'] as const
// →
const REQUIRED_ENV = process.env.NODE_ENV === 'production'
  ? ['JWT_SECRET', 'MONGO_URI', 'TURNSTILE_SECRET_KEY'] as const
  : ['JWT_SECRET', 'MONGO_URI'] as const
```

---

### G-6 — 7 günlük JWT, OAuth callback'inde URL query string'inde taşınıyor

**Nerede:** [authRoutes.ts:50](../../backend/routes/authRoutes.ts#L50), kullanım [:58](../../backend/routes/authRoutes.ts#L58) ve [:69](../../backend/routes/authRoutes.ts#L69)
**Kategori:** `sensitive_data_exposure`
**Güven:** Yüksek

```ts
const oauthRedirect = (token: string) => `${CLIENT_ORIGIN}/oauth-callback?token=${token}`
```

Tam yetkili, 7 gün ömürlü JWT URL'de taşınıyor. Bu token şu üç yere düşer:

1. **Tarayıcı geçmişi** — paylaşılan/kurumsal makinelerde kalıcı.
2. **`Referer` başlığı** — `/oauth-callback` sayfası herhangi bir dış kaynak (font, analytics, görsel) yüklerse token üçüncü tarafa gider.
3. **Erişim logları** — Vercel/proxy katmanı tam URL'i loglar.

**Fix:** Token'ı fragment'ta gönder (`#token=...`) — fragment ne sunucuya ne `Referer`'a gider; frontend `location.hash`'ten okur ve hemen `history.replaceState` ile temizler. Daha sağlamı: callback'te tek kullanımlık, 30 saniye ömürlü bir kod ver, frontend `POST /api/auth/oauth-exchange` ile JWT'ye çevirsin.

---

## 5. 🟡 LOW / Sıkılaştırma

### G-7 — Başkasının avatar dosyasını silme

**Nerede:** [authController.ts:138-142](../../backend/controllers/authController.ts#L138-L142) + [uploadMiddleware.ts:38-47](../../backend/middleware/uploadMiddleware.ts#L38-L47)

`updateProfile` `avatarUrl`'de yalnızca prefix (`/uploads/avatars/`) ve uzunluk doğruluyor. Kullanıcı bunu `/uploads/avatars/<başkasının-dosyası>.png` yapıp ardından yeni avatar yükleyince [authController.ts:351-353](../../backend/controllers/authController.ts#L351-L353) `deleteAvatarFile`'ı çağırır ve o dosya silinir.

**Sınır:** Path traversal `path.basename` sayesinde **doğru şekilde engellenmiş** — `../../etc/passwd` denemesi `passwd`'a indirgenir ve `AVATAR_DIR` içinde kalır. Etki yalnızca başka bir kullanıcının avatarının kaybolması; kozmetik.

**Fix:** Dosya adının `<kendi-userId>-` ile başladığını doğrula (dosya adı zaten [uploadMiddleware.ts:21](../../backend/middleware/uploadMiddleware.ts#L21)'de bu şablonla üretiliyor).

### G-8 — CORS preview regex'i geniş

**Nerede:** [origins.ts:14](../../backend/config/origins.ts#L14)

```ts
export const vercelPreviewRe = /^https:\/\/healthai-co-creation-platform(-[a-z0-9]+)?(-[a-z0-9]+-[a-z0-9]+-projects)?\.vercel\.app$/
```

`healthai-co-creation-platform-<herhangi-alfanumerik>.vercel.app` kabul ediliyor. Ayrıca [app.ts:34](../../backend/src/app.ts#L34) `if (!origin) return cb(null, true)` ile origin'siz istekleri geçiriyor.

**Neden LOW:** Kimlik doğrulama localStorage'daki Bearer token ile yapılıyor, cookie ile değil. CORS yalnızca cookie'li isteklerde ayrıcalık taşır; sahte bir origin kurbanın token'ını okuyamaz. Yine de prod ortamında preview regex'ini devre dışı bırakmak doğru olur.

### G-9 — SPA'da güvenlik başlığı yok

**Nerede:** [nginx.conf](../../frontend/nginx.conf)

CSP, HSTS, X-Frame-Options, Referrer-Policy gönderilmiyor. `helmet` yalnızca API yanıtlarını kapsıyor ([app.ts:29](../../backend/src/app.ts#L29)). Not: bu yalnızca docker-compose yolunu etkiler; Vercel deploy'u bu nginx'i kullanmaz — Vercel için `vercel.json` `headers` bloğu gerekir.

Özellikle `Referrer-Policy: no-referrer` eklenmesi G-6'nın etkisini de azaltır.

### G-10 — `npm audit`: 11 açık (5 high)

```
ws     8.0.0 - 8.20.1    high      Memory exhaustion DoS (engine.io, socket.io-adapter üzerinden)
qs     6.11.1 - 6.15.1   moderate  stringify crash (express üzerinden)
```

Tamamı **DoS sınıfı**; uygulamanın kendi kodunda karşılığı olan bir zafiyet değil. `npm audit fix` çözüyor.

---

## 6. 🔵 Gizlilik / GDPR

Bu iki madde kod hatası değil ama "kullanıcı veri paylaşabilir mi" sorusunun asıl cevabı — ve hukuki risk taşıyor.

### G-11 — Özel 1:1 mesaj dökümleri Google'a gönderiliyor, onay alınmıyor

**Nerede:** [aiMeetingSummaryService.ts:66-99](../../backend/services/aiMeetingSummaryService.ts#L66-L99)

Toplantı transkripti (3000 karaktere kadar, gönderen adlarıyla birlikte) Gemini API'ye gönderiliyor:

```ts
const transcript = messages.map(m => `${m.senderName}: ${m.content}`).join('\n')
// ...
Conversation transcript:
${transcript.slice(0, 3000)}
```

**Yetkilendirme tarafı doğru** — yalnızca toplantı katılımcısı ve yalnızca `completed` durumda çağırabiliyor ([aiMeetingSummaryService.ts:41-43](../../backend/services/aiMeetingSummaryService.ts#L41-L43)). Sorun bu değil.

**Sorun:** Kullanıcıdan **onay alınmıyor** ve bunu bildiren bir gizlilik metni yok. AB'li kullanıcılar için bu, özel konuşma içeriğinin üçüncü ülkeye aktarımı (GDPR Bölüm V); hukuki dayanak + açık bilgilendirme gerekir. Bir sağlık iş birliği platformunda "mesajlarım Google'a mı gidiyor?" sorusunun cevabı yazılı olmak zorunda.

**Fix:** (a) Özet üretmeden önce açık onay al ("Bu özet Google Gemini ile üretilecek — konuşma içeriği işlenmek üzere Google'a gönderilir"), (b) gizlilik politikasına alt-işleyici olarak Google'ı ekle, (c) onay vermeyen kullanıcı için özelliği devre dışı bırak.

### G-12 — Tutulmayan saklama sözü

**Nerede:** [emailService.ts:96](../../backend/services/emailService.ts#L96) ↔ [models/Log.ts](../../backend/models/Log.ts)

Hesap silme e-postası kullanıcıya şunu söylüyor:

> "Audit logs related to your account are retained for 24 months as required by our security policy."

Kod tabanında **hiçbir purge job'ı veya TTL index'i yok** (`retention|purge|expireAfterSeconds` taraması boş). `Log` kayıtları e-posta ve IP adresi ile süresiz birikiyor. Yani kullanıcıya verilen yazılı taahhüt tutulmuyor — GDPR Art. 5(1)(e) saklama sınırlaması ilkesine aykırı.

**Fix:** `Log` şemasına TTL index ekle:

```ts
LogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 }) // 24 ay
```

Alternatif: e-postadaki ifadeyi gerçeğe uydur.

---

## 7. Güvenlik Dışı: Son Commit'te Sessiz Bug

Denetim sırasında fark edildi, güvenlik bulgusu değil ama fonksiyonel kırılma.

**Nerede:** [nginx.conf:33](../../frontend/nginx.conf#L33)

`76b7bf2` commit'inde eklenen [`location /uploads`](../../frontend/nginx.conf#L19) avatar proxy'si **çalışmıyor**. Nginx'te regex location'lar (`~*`) prefix location'lardan önceliklidir; dolayısıyla `/uploads/avatars/foo.png` isteği `location ~* \.(js|css|png|jpg|...)$` bloğuna düşer ve backend'e proxy'lenmek yerine `root /usr/share/nginx/html` altında aranıp 404 döner.

**Fix:** Prefix bloğunu regex'ten öncelikli hâle getir:

```nginx
location ^~ /uploads {
```

---

## 8. Canlıya Çıkış Kontrol Listesi

### Blocker — bunlar kapatılmadan yayına alınmamalı

- [ ] **G-1** OAuth `.edu` bypass'ı — OAuth'a `EDU_EMAIL_RE` uygula veya OAuth'u kapat
- [ ] **G-2** OAuth doğrulanmamış e-posta ile hesap link'leme — `verified` kontrolü + otomatik link'lemeyi kaldır
- [ ] **G-3** Draft IDOR — `getPostById`'a sahiplik kontrolü

### Aynı sprint

- [ ] **G-4** `tokenVersion` ile oturum iptali
- [ ] **G-5** CAPTCHA fail-closed
- [ ] **G-6** OAuth token'ını fragment'a veya exchange-code akışına taşı
- [ ] **G-11** Gemini için onay akışı + gizlilik politikası güncellemesi

### Sonrası

- [ ] **G-7** Avatar dosya adı sahiplik kontrolü
- [ ] **G-8** Prod'da Vercel preview regex'ini kapat
- [ ] **G-9** SPA güvenlik başlıkları (`vercel.json` / nginx)
- [ ] **G-10** `npm audit fix`
- [ ] **G-12** Log TTL index'i
- [ ] Bonus: `nginx.conf` `location ^~ /uploads` düzeltmesi

---

## 9. Kapsam ve Sınırlar

**İncelenen:** Tüm backend route/controller/service/middleware/model katmanları, `src/app.ts`, `src/index.ts`, `src/passport.ts`, `src/socket.ts`, `config/*`, `utils/verifyTurnstile.ts`, `middleware/uploadMiddleware.ts`, frontend `authStore` + XSS yüzey taraması, `nginx.conf`, `docker-compose.prod.yml`, git-tracked sır taraması, `npm audit`.

**İncelenmeyen / bu raporun dışında:**
- Çalışan sistemde dinamik test (DAST) yapılmadı — bulgular statik kod okumasına dayanıyor.
- MongoDB Atlas tarafı yapılandırması (IP allowlist, DB user yetkileri, encryption-at-rest) denetlenmedi. **Not:** Denetim sırasında Atlas cluster'ının uzun süreli inaktivite nedeniyle otomatik duraklatıldığı ve IP allowlist'in prod erişimi için `0.0.0.0/0` gerektirdiği tespit edildi; allowlist'in gereğinden geniş olması ayrı bir risktir ancak Railway'in dinamik egress IP'leri nedeniyle alternatifi VPC peering'dir.
- Railway/Vercel platform yapılandırması, secret rotasyon durumu, admin hesabının mevcut şifre gücü.
- Bağımlılık zinciri tedarik güvenliği (supply chain) denetimi.
