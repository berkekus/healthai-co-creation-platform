# HealthAI güvenlik ve kullanılabilirlik denetimi

**Tarih:** 19 Eylül 2026 · **Kapsam:** mevcut çalışma ağacı, backend API, frontend, bağımlılıklar, yerel production build.

**Sonuç:** Yayın öncesinde özellikle **S10 (başkasının taslaklarını okuma), S02 (başkasının avatarını silme), S01/S07 (oturum iptali)** giderilmeli. Hesap silme ve veri dışa aktarma kapsamı da tamamlanmalı. Mevcut testlerin geçmesi bu açıkların bulunmadığı anlamına gelmiyor: denetim için eklenen testler açıkları ayrıca yeniden üretti.

## 1. Yöntem ve kapsam sınırları

- Kaynak kodunda kimlik doğrulama, rol/nesne yetkilendirmesi, kayıt, parola, avatar, mesajlaşma, kişisel veri silme/dışa aktarma, AI uçları ve dağıtım ayarları incelendi.
- API kontrolleri `supertest` ve **geçici MongoDB replica set** üzerinde yapıldı. Gerçek hesaplara, canlı veritabanına ve gerçek kullanıcı dosyalarına müdahale edilmedi. Dosya silme kanıtı yalnızca testin oluşturduğu iki hesaba ve dosyalara uygulandı; dosyalar temizlendi.
- Frontend bileşen testleri, TypeScript/build kontrolleri ve `npm audit` çalıştırıldı.
- Tarayıcı becerisinin gerektirdiği çalıştırma aracı bu oturumda bulunmadığından, alternatif olarak yerel **headless Chrome 153.0.8010.48 + Playwright + axe-core** kullanıldı. Araçlar geçici dizine kuruldu; uygulama bağımlılıkları güncellenmedi.
- Son tarayıcı turu Vite **production build/preview** üzerinde, `1440×900` ve `375×900` boyutlarında yapıldı. Backend adresi test için `127.0.0.1:5999/api` olarak derlendi ve tarayıcı API istekleri taklit edildi. Gerçek e-posta/CAPTCHA/OAuth/AI servislerine işlem gönderilmedi.
- `/`, `/login`, `/register`, `/forgot-password`, `/privacy`, `/about` sayfaları tarandı. Oturum açık menü ve kayıt yönlendirmesi örnek kullanıcı cevabıyla kontrol edildi. Bu, gerçek hesapla uçtan uca giriş/toplantı akışının doğrulandığı anlamına gelmez.
- Canlı TLS/HTTP başlıkları, CDN/WAF, gerçek production ortam değişkenleri, yedekler, altyapı izinleri ve Git geçmişindeki sırlar kapsamlı biçimde denetlenmedi. Yük/DoS saldırısı yapılmadı.
- Bu çalışma teknik kullanılabilirlik ve erişilebilirlik incelemesidir; gerçek kullanıcılarla görev tamamlama araştırması veya WCAG uygunluk sertifikası değildir. Safari/Firefox, ekran okuyucu, gerçek telefon, %200–400 zoom, tüm diller ve tüm oturum açık ekranlar ayrıca test edilmelidir.
- İnceleme sırasında frontend dosyalarında eşzamanlı değişiklikler gözlendi; bunlara müdahale edilmedi. Referans commit `092e389ec7d417244d69d2b40ba06b4c432a9751`; çalışma ağacı hash kaydı [source-snapshot.json](audit-2026-09-19/source-snapshot.json). Tarayıcı bulguları denetim sırasında oluşturulan build'e aittir.

### Kanıt türleri

**Dinamik:** izole API veya tarayıcıda yeniden üretildi. **Statik:** kodda doğrulandı, canlı istismar gösterilmedi. **Koşullu:** ortam/dağıtım ayarına bağlı. Önem dereceleri bu projedeki beklenen etkiye göre değerlendirmedir; CVSS puanı değildir.

## 2. Çalıştırılan kontroller

| Kontrol | Sonuç | Kanıt |
|---|---|---|
| Frontend mevcut testleri, son tekrar | 28 dosya / **178 geçti** | [frontend-tests-final.txt](audit-2026-09-19/frontend-tests-final.txt) |
| Backend mevcut testleri | 8 dosya / **136 geçti** | [backend-tests-retry.txt](audit-2026-09-19/backend-tests-retry.txt) |
| Ek güvenlik kontrolleri | **13 geçti:** 8 açık üretme senaryosu, 5 koruma senaryosu | [security-probes.txt](audit-2026-09-19/security-probes.txt) |
| Backend TypeScript build | Başarılı | [backend-build.txt](audit-2026-09-19/backend-build.txt) |
| Frontend production build | Başarılı; CSS sözdizimi ve büyük chunk uyarıları var | [frontend-build.txt](audit-2026-09-19/frontend-build.txt) |
| Chrome/axe, 6 sayfa × 2 genişlik | 12 tarama; 10'unda kontrast bulgusu; sayfa JS hatası yok | [browser-results.json](audit-2026-09-19/browser-results.json) |
| Oturum açık landing navigasyonu | Üç doğru bağlantı; kayıt bağlantısı sayısı 0; `/register` → `/dashboard` | Aynı tarayıcı sonuç dosyası |
| Ek kullanılabilirlik senaryoları | Mobil adım kırpılması, 503 sonrası kilit ve Escape davranışı kaydedildi | [usability-probes.json](audit-2026-09-19/usability-probes.json) |

İlk backend çalıştırması MongoDB indirmesi sırasında setup zaman aşımına uğradı; 136 test atlandı. Ayrı indirme denemesinde checksum hatası görüldü; checksum kontrolü kapatılmadı. Depoda önceden bulunan MongoDB test binary'si açıkça seçilerek yeniden çalıştırıldığında 136 test geçti. İlk hata uygulama güvenlik açığı sayılmadı. Kanıtlar: [ilk çalışma](audit-2026-09-19/backend-tests.txt), [bootstrap](audit-2026-09-19/mongo-bootstrap.txt).

**Önemli:** [securityAudit.test.ts](../backend/tests/securityAudit.test.ts) içindeki ilk grup mevcut açığı gösteren davranışı bekler. Bu testlerin yeşil olması güvenli davranış anlamına **gelmez**. Düzeltme yapılınca beklentiler güvenli sonucu doğrulayacak şekilde tersine çevrilmelidir.

## 3. Güvenlik bulguları

| ID | Önem | Bulgu | Kanıt türü |
|---|---|---|---|
| S10 | Yüksek | Dizi tipindeki `status` sorgusuyla başka kullanıcının taslağı okunuyor | Dinamik |
| S02 | Yüksek | Değiştirilebilir `avatarUrl` üzerinden başka kullanıcının avatarı silinebiliyor | Dinamik |
| S01 | Yüksek | Logout sunucudaki token'ı geçersizleştirmiyor | Dinamik |
| S07 | Yüksek | Askıya alınan kullanıcının açık WebSocket'i veri almaya devam ediyor | Dinamik |
| S04 | Yüksek | Hesap silme sonrası mesaj/yorum/konuşmalarda kimlik bilgileri kalıyor | Dinamik |
| S11 | Yüksek öncelik | Production bağımlılık ağacında güvenlik duyuruları var | Bağımlılık taraması |
| S03 | Orta | Görsel olmayan içerik PNG olarak kabul ediliyor | Dinamik |
| S05 | Orta | Veri dışa aktarma mesaj, yorum, kayıtlı arama ve tüm logları kapsamıyor | Dinamik + statik |
| S06 | Orta | CAPTCHA production'da anahtar yoksa açık geçiyor | Dinamik, koşullu |
| S12 | Orta | AI/mesaj/yorum işlemlerinde uygulama düzeyinde kota eksik | Statik |
| S13 | Orta | Frontend dağıtım tanımlarında belge güvenlik başlıkları yok | Statik, koşullu |
| S08 | Düşük | Doğrulama e-postası endpoint'i kayıtlı adresleri ayırt ettiriyor | Dinamik |
| S09 | Düşük | Kayıtta hatalı parola tipi 400 yerine 500 üretiyor | Dinamik |

### S10 — Taslak projelerde sorgu tipi üzerinden yetkilendirme atlatma

**Kaynak:** [postController.ts](../backend/controllers/postController.ts), `listPosts`, yaklaşık satır 52–76; [postService.ts](../backend/services/postService.ts), `listPosts`.

Kontrol `status === 'draft'` için kullanıcıya kapsam daraltıyor. Ancak `as string` çalışma zamanında doğrulama yapmıyor. Express `status[]=draft` değerini dizi olarak ayrıştırınca bu kontrol atlanıyor; Mongoose dizi değerini filtre olarak kabul ediyor.

**Yeniden üretim:** A kullanıcısı taslak oluşturur. B kullanıcısıyla `GET /api/posts/<taslak-id>` → **403**. Aynı B token'ıyla `GET /api/posts?status%5B%5D=draft` → **200**, cevapta A'nın taslağı bulunur. Test: `S10`.

**Etki:** Yayınlanmamış proje içeriğinin başka üyelere ifşası. Kimliği doğrulanmış normal kullanıcı yeterli.

**Çözüm:** Query parametrelerini çalışma zamanında şemayla doğrula; dizi/nesne/tekrarlı değerleri reddet. Taslak görünürlüğünü sorgu filtresinden bağımsız bir erişim koşulu olarak uygula: normal kullanıcı için `status != draft OR authorId == currentUser`. **Kabul testi:** string, dizi, tekrarlı ve nesne biçimleri başka kullanıcının taslağını asla döndürmemeli; admin ve kendi taslakları çalışmalı.

### S02 — Başka kullanıcının avatar dosyasını silme

**Kaynak:** [authController.ts](../backend/controllers/authController.ts), `updateProfile` ve `uploadAvatar`; [uploadMiddleware.ts](../backend/middleware/uploadMiddleware.ts), `deleteAvatarFile`.

Profil güncellemesi istemciden gelen `avatarUrl` alanını kabul ediyor. Sonraki avatar yükleme işlemi bu adresi önceki kullanıcı dosyası varsayıp siliyor. `path.basename` dizin kaçışını azaltıyor, **dosya sahipliğini doğrulamıyor**.

**Yeniden üretim:** A test avatarı yükler. B kendi profilindeki `avatarUrl` değerini A'nın `/uploads/avatars/...png` adresine ayarlar. B yeni avatar yükler. İki istek de **200** döner; A'nın dosyası diskte artık yoktur. Test: `S02/S03`.

**Etki:** Başka hesabın dosyasını silme/bütünlük kaybı. Rastgele sistem dosyası silme veya kod çalıştırma kanıtlanmadı.

**Çözüm:** `avatarUrl` normal profil güncellemesinin izinli alanlarından çıkarılmalı; dosya kaydı sunucu tarafından ve sahip kimliğiyle yönetilmeli. Silme yalnızca o kullanıcıya ait doğrulanmış dosya için yapılmalı. **Kabul testi:** A'nın URL'sini kullanan B'nin profil isteği reddedilmeli veya alan yok sayılmalı; A'nın dosyası korunmalı.

### S01 — Logout sonrası token tekrar kullanılabiliyor

**Kaynak:** [authController.ts](../backend/controllers/authController.ts), `logout`, yaklaşık satır 205; [authService.ts](../backend/services/authService.ts), `signToken`; [authMiddleware.ts](../backend/middleware/authMiddleware.ts).

Logout yalnızca log kaydı ve başarılı cevap üretiyor. İstemci token'ı siliyor fakat sunucu oturumu iptal etmiyor.

**Kanıt:** `POST /api/auth/logout` → **200**, aynı bearer token ile `GET /api/auth/me` → **200**. Test: `S01`. Varsayılan JWT ömrü kodda **7 gün**; production override değeri denetlenmedi. Frontend'in 30 dakikalık idle süresi sunucu tarafında oturum zaman aşımı sağlamıyor.

**Etki:** Kopyalanmış token logout sonrası da kullanılabilir. Bu bulgu token hırsızlığını kendi başına kanıtlamaz.

**Çözüm:** Oturum kimliğiyle sunucu tarafı iptal/denylist veya kısa ömürlü access token ve iptal edilebilir refresh session. Mevcut `tokenVersion` ile tüm oturumları iptal etmek mümkün; cihaz bazlı logout beklentisi ayrıca belirlenmeli. **Kabul testi:** logout sonrası aynı token → 401; diğer cihaz oturumları seçilen politikaya uygun davranmalı. [OWASP oturum yönetimi](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).

### S07 — Açık WebSocket'te yetki iptali uygulanmıyor

**Kaynak:** [socket.ts](../backend/src/socket.ts), `io.use`, `connection`, `emitToUser`.

Token, askıya alma ve `tokenVersion` kontrolü yalnızca bağlantı kurulurken yapılıyor. Açık bağlantılar için iptal/yeniden doğrulama yok.

**Kanıt:** Test kullanıcısı socket açtıktan sonra askıya alındı. HTTP `/auth/me` isteği **403** verirken aynı socket hedef kullanıcı odasına gönderilen test olayını aldı. Test: `S07`. Gerçek mesaj içeriği kullanılmadı; üretimde `new_message` yolu aynı `emitToUser` mekanizmasını kullanıyor.

**Çözüm:** Logout, parola değişimi, askıya alma ve hesap silmede kullanıcının/oturumun socket'lerini kapat; token süresi dolduğunda bağlantıyı sonlandır. **Kabul testi:** iptal edilen bağlantı mesaj/bildirim alamamalı; yeniden bağlantı reddedilmeli. [OWASP WebSocket rehberi](https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html).

### S04 — Hesap silmenin veri kapsamı eksik

**Kaynak:** [authService.ts](../backend/services/authService.ts), `cascadeDeleteUser`; `Message`, `Conversation`, `Comment`, `SavedSearch` modelleri.

**Kanıt:** Kullanıcının silinmesi başarılı; `User` kaydı yok. Buna rağmen `Message.senderName`, `Comment.authorName`, `Conversation.participantDetails.name` ve kullanıcıya bağlı `SavedSearch` kaldı. Test: `S04/S05`.

**Etki:** Silindiği düşünülen kişisel bilgiler diğer üyelerin erişebildiği içeriklerde kalabilir. Saklanması gereken denetim kayıtlarının ayrı tutulması bu tablolar için açık bir saklama politikası yerine geçmez. Bu teknik tespit hukuki uygunluk kararı değildir.

**Çözüm:** Her model için silme/anonimleştirme/saklama matrisi oluştur; karşı tarafın konuşma geçmişini koruyacaksa isim ve kullanıcı ilişkisini anonimleştir. Aynı kapsamı admin silmesine uygula. **Kabul testi:** tüm ilgili koleksiyonlarda eski isim ve doğrudan kimlik ilişkilerinin beklenen şekilde kaldırıldığını doğrula.

### S05 — Veri dışa aktarma eksik

**Kaynak:** [authService.ts](../backend/services/authService.ts), `exportUserData`, yaklaşık satır 286; [logService.ts](../backend/services/logService.ts).

**Kanıt:** Mesaj, yorum ve kayıtlı arama fixture'ları varken export bunları içermedi (`S04/S05`). Kod logları `limit: 200` ile alıp yalnızca ilk sayfayı dışarı veriyor. 200 üzeri log senaryosu dinamik olarak denenmedi.

**Çözüm:** Export sözleşmesini tüm kişisel veri türleri için tanımla; logları sayfalayarak tamamla. Export'ta `resetToken`, `resetTokenExpires`, `tokenVersion` gibi iç güvenlik alanlarını da açık allowlist dışında bırak; mevcut yaklaşım profil belgesinin çoğunu doğrudan yayıyor. **Kabul testi:** bilinen fixture sayıları ve 200 üzeri log eksiksiz gelmeli, güvenlik token alanları gelmemeli.

### S03 — Dosya içeriği doğrulanmadan görsel kabul ediliyor

**Kaynak:** [uploadMiddleware.ts](../backend/middleware/uploadMiddleware.ts), `fileFilter`.

**Kanıt:** `AUDIT NOT AN IMAGE` metni, `.png` dosya adı ve `image/png` başlığıyla yüklenince **200** döndü ve diske yazıldı. Boyut sınırı var; MIME/uzantı kontrolü istemcinin beyanına dayanıyor.

**Çözüm:** Gerçek görüntü decode/re-encode, desteklenen format allowlist'i ve piksel/boyut sınırı uygula. SVG/HTML çalıştırılabildiği veya RCE elde edildiği **iddia edilmiyor**. **Kabul testi:** sahte PNG, bozuk görsel ve aşırı piksel boyutlu dosya 4xx ile reddedilmeli. [OWASP dosya yükleme rehberi](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).

### S06 — Eksik CAPTCHA anahtarı güvenliği sessizce kapatıyor

**Kaynak:** [verifyTurnstile.ts](../backend/utils/verifyTurnstile.ts), satır 4–5; [index.ts](../backend/src/index.ts), gerekli ortam değişkenleri.

**Kanıt:** `NODE_ENV=production`, boş `TURNSTILE_SECRET_KEY`, token yok → `verifyTurnstile` **true**. Test: `S06`. Canlı anahtarın eksik olduğu iddia edilmiyor.

**Çözüm:** Production başlangıcında gerekli CAPTCHA konfigürasyonunu doğrula; kontrollü kapatma gerekiyorsa ayrı, açık ve izlenebilir bir seçenek kullan. Eksiklikte sessiz bypass yerine yapılandırma hatası ver. **Kabul testi:** secret yokken uygulama güvenli şekilde başlamamalı veya ilgili işlem kontrollü 503 vermeli.

### S08 — E-posta adresi enumeration

**Kaynak:** [authService.ts](../backend/services/authService.ts), `resendVerification`.

**Kanıt:** Doğrulanmış adres → **400**, bulunmayan adres → **200** (`S08`). Kayıtta kullanılan 409 cevabı da hesap varlığını açıklıyor; bunun ürün tercihi olup olmadığı netleştirilmeli.

**Çözüm:** Yeniden gönderme için aynı durum kodu ve genel mesaj; IP yanında hesap bazlı kötüye kullanım limiti. **Kabul testi:** var/yok/doğrulanmış adreslere dışarıdan ayırt edilemeyen cevaplar.

### S09 — Kayıt alanlarında tip doğrulaması eksik

**Kaynak:** [authController.ts](../backend/controllers/authController.ts), `register`.

**Kanıt:** Diğer alanlar geçerliyken `password: {}` gönderilince bcrypt'e kadar ulaşıp **500** döndü (`S09`). İstemciye stack trace verilmedi; iç hata loglandı.

**Çözüm:** Alanları kullanmadan önce string/enum/uzunluk doğrulaması yap; ortak şema kullan. **Kabul testi:** nesne, dizi, sayı, null ve sınır uzunlukları kontrollü 400 üretmeli.

### S11 — Bağımlılık güvenlik taraması

`npm audit` sorguları denetim tarihinde alındı. Aşağıdaki sayılar **etkilenen paket kayıtlarıdır**; benzersiz açık veya projede istismar edilmiş endpoint sayısı değildir. Frontend/backend arasında örtüşen transitif paketler vardır.

| Ağaç | Kritik | Yüksek | Orta | Düşük | Toplam |
|---|---:|---:|---:|---:|---:|
| Backend, tüm bağımlılıklar | 0 | 12 | 6 | 2 | 20 |
| Backend, `--omit=dev` | 0 | 7 | 3 | 1 | 11 |
| Frontend, tüm bağımlılıklar | 0 | 10 | 8 | 2 | 20 |
| Frontend, `--omit=dev` | 0 | 5 | 4 | 0 | 9 |

Backend'de öncelikli inceleme: `multer`, `socket.io-parser`, `ws`, `nodemailer`, `mongoose`, `express-rate-limit`. Örnek duyurular: [Multer multipart DoS](https://github.com/advisories/GHSA-72gw-mp4g-v24j), [Socket.IO bellek tüketimi](https://github.com/advisories/GHSA-2m8v-j782-fhvr), [ws bellek tüketimi](https://github.com/advisories/GHSA-96hv-2xvq-fx4p).

Frontend'de `axios`, router ve socket ağacı raporlanıyor. **Node adapter, SMTP seçeneği veya dev server gerektiren bir duyuru, tarayıcı production bundle'ında otomatik olarak istismar edilebilir değildir.** Her duyuru kullanılan kod yoluyla eşleştirilmeli. `--omit=dev` de tarayıcı bundle erişilebilirlik analizi yerine geçmez.

**Çözüm:** Önce erişilebilir backend runtime paketleri; ardından tarayıcı runtime ve geliştirme araçları. Lockfile güncellemelerinden sonra test/build/audit tekrarlanmalı. Bazı düzeltmeler major yükseltme gerektiriyor; bu denetimde otomatik `audit fix --force` uygulanmadı.

Ham kanıt: [backend tümü](audit-2026-09-19/backend-audit.json), [backend runtime](audit-2026-09-19/backend-runtime-audit.json), [frontend tümü](audit-2026-09-19/frontend-audit.json), [frontend runtime](audit-2026-09-19/frontend-runtime-audit.json).

### S12 — Kaynak tüketimi ve kötüye kullanım limitleri

**Kaynak:** [aiRoutes.ts](../backend/routes/aiRoutes.ts), [conversationRoutes.ts](../backend/routes/conversationRoutes.ts), [commentRoutes.ts](../backend/routes/commentRoutes.ts), [conversationService.ts](../backend/services/conversationService.ts).

AI çağrıları yalnızca `protect` arkasında; kullanıcı bazlı bütçe/eşzamanlılık kotası görülmedi. Mesaj/yorum oluşturma da ilgili rate limiter olmadan çalışıyor. `getMessages` tüm geçmişi tek cevapta getiriyor. Gemini çağrılarında timeout ve retry mevcut; bunlar toplam kullanıcı bütçesi sağlamaz.

**Etki:** Doğrulanmış hesapla ücretli AI tüketimi, spam ve uzun konuşmalarda büyük cevaplar. Yük testi veya gerçek ücretli AI tüketimi yapılmadı; altyapı seviyesindeki ilave limitler bilinmiyor.

**Çözüm:** Kullanıcı + IP bazlı limit, günlük AI bütçesi, eşzamanlı çağrı sınırı, mesajlarda cursor pagination. Çoklu instance ortamında ortak sayaç kullan. **Kabul testi:** kontrollü eşik aşımı 429 vermeli; uzun geçmişte sabit sayfalı cevap alınmalı. [OWASP API4](https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/).

### S13 — Frontend belge başlıkları dağıtımda doğrulanmalı

**Kaynak:** [vercel.json](../frontend/vercel.json), [nginx.conf](../frontend/nginx.conf), [api.ts](../frontend/src/lib/api.ts).

Backend Helmet başlıkları dinamik testte mevcut. Ancak frontend HTML'ini sunan Vercel/Nginx tanımlarında CSP/`frame-ancestors` gibi belge politikaları tanımlı değil. Backend CSP'si ayrı origin'deki frontend belgesini korumaz. JWT local/sessionStorage'da tutulduğu için olası bir XSS'nin etkisi ayrıca önemlidir; bu denetimde çalışan XSS zinciri bulunmadı.

**Çözüm:** Önce production HTML cevabındaki gerçek başlıkları ölç; uygun CSP'yi report-only ile dene, sonra uygula. Turnstile, font ve API kaynaklarını kontrollü allowlist'e al. **Kabul testi:** gerçek deployment HTML cevabında politika görülmeli; giriş/CAPTCHA/fontlar çalışmalı. Canlı başlıkların kesinlikle eksik olduğu iddia edilmiyor.

## 4. Kullanılabilirlik ve erişilebilirlik bulguları

### U01 — Metin kontrastı düşük — Orta

**Dinamik:** axe taramasında `/`, `/login`, `/register`, `/forgot-password`, `/privacy` için iki genişlikte de `color-contrast` bulguları var. `/about` bu taramada ihlal üretmedi; bu tüm erişilebilirlik ölçütlerini geçtiği anlamına gelmez.

Production taramasındaki örnekler: login yardımcı metni **2,53:1**; kayıt açıklaması **3,79:1**; landing adım etiketleri **2,31–2,52:1**. Küçük normal metin için hedef **4,5:1**. [W3C kontrast açıklaması](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum).

**Öneri:** Yardımcı metin ve aktif olmayan fakat okunması gereken adım etiketlerinde daha koyu renk token'ları kullan. Gerçekten disabled kontrollerin istisnalarını ayrı değerlendir. **Kabul:** aynı sayfa/genişlik/tema kombinasyonlarında ilgili ihlaller kalkmalı. Selector ve ölçümler [browser-results.json](audit-2026-09-19/browser-results.json) içinde.

### U02 — Mobil kayıt adımı kırpılıyor — Orta

**Kaynak:** [RegisterPage.tsx](../frontend/src/pages/auth/RegisterPage.tsx), adım göstergesi, yaklaşık satır 184.

**Dinamik:** 375 px ekranda `Institution` metninin sağ kenarı **392,17 px**, kırpan kartın sağ kenarı **359 px**. `whitespace-nowrap`, üç adımın toplam genişliği ve `overflow-hidden` nedeniyle metin kesiliyor. Sayfanın yatay scroll üretmemesi sorunu gizliyor.

**Öneri:** Mobilde kısa etiket, yalnızca aktif adımın açıklaması veya sığan esnek adım düzeni. **Kabul:** 320/375/390 px ve Türkçe uzun etiketlerde bütün adımlar okunabilmeli. Kanıt: [mobil kayıt görüntüsü](audit-2026-09-19/ui-375-register.png), [DOM ölçümü](audit-2026-09-19/usability-probes.json).

### U03 — Sunucu kesintisi yanlış parola denemesi sayılıyor — Orta

**Kaynak:** [LoginPage.tsx](../frontend/src/pages/auth/LoginPage.tsx), `onSubmit`, yaklaşık satır 71.

**Dinamik:** Üç kontrollü **503** cevabı sonrası “Too many failed attempts / Please wait 60s” gösterildi ve submit devre dışı kaldı. Parola yanlışlığı kanıtlanmadan kullanıcı cezalandırılıyor; kesintinin gerçek nedeni de kayboluyor.

**Öneri:** Hataları sınıflandır: 401 için yanlış kimlik bilgisi; 429 için sunucunun `Retry-After` süresi; 5xx/ağ hatası için tekrar deneme mesajı. Sayaç yalnızca uygun kimlik doğrulama hatalarında artsın. **Kabul:** ardışık 503 cevapları yerel 60 saniye kilidi oluşturmamalı.

### U04 — Mobil menü Escape ile kapanmıyor — Düşük

**Kaynak:** [LandingPage.tsx](../frontend/src/pages/LandingPage.tsx), `TopNav`.

**Dinamik:** Menü açılıp Escape basıldıktan sonra `aria-expanded` **true** kaldı. Bu tek başına tüm menünün erişilemez olduğu anlamına gelmez; klavye davranışı beklentisi eksik.

**Öneri:** Escape ile kapat, odağı açan düğmeye döndür; `aria-controls` ile paneli ilişkilendir. **Kabul:** klavye ve dokunmatik akışlarında menü güvenilir kapanmalı, odak kaybolmamalı.

### U05 — Etkileşim izlenimi veren işlevsiz örnekler — Orta, statik

**Kaynak:** [LandingPage.tsx](../frontend/src/pages/LandingPage.tsx), “Match” örnek düğmesi (~1077) ve “Structured collaboration” bölümündeki `cursor-pointer` kartlar (~1339).

“Match” gerçek bir `<button>` fakat işlem bağlı değil. Bazı artı işaretli kartlar tıklanabilir görünürken link/düğme/handler taşımıyor. Kullanıcı işlev veya açılır açıklama bekleyebilir. Kod incelemesiyle doğrulandı; tarayıcıda içerik değişimi karşılaştırması tamamlanamadığından davranış kanıtı olarak sunulmuyor.

**Öneri:** Örnek çizimse dekoratif semantik ve “örnek” açıklaması; işlevse gerçek yönlendirme/accordion ve klavye desteği. **Kabul:** odaklanan her eylem kontrolü anlamlı sonuç üretmeli.

### U06 — Uzun mesaj geçmişinde performans riski — Orta, statik

[conversationService.ts](../backend/services/conversationService.ts) `getMessages` bütün mesajları getiriyor. Mobilde büyük görüşmeler için ağ/DOM yükü büyür. Bu risk S12 ile aynı teknik nedene dayanır; iki bağımsız güvenlik açığı gibi sayılmamalı.

**Öneri:** Cursor pagination ve eski mesajları isteğe bağlı yükleme. **Kabul:** büyük fixture konuşmasında ilk açılış sınırlı kayıt getirmeli, önceki mesajlar konum sıçramadan yüklenmeli. Bu veri hacmiyle tarayıcı testi henüz yapılmadı.

### Olumlu kullanılabilirlik sonuçları

- İki genişlikte altı sayfada belge düzeyinde yatay taşma tespit edilmedi; U02 gibi içerik kırpılmaları ayrıca kontrol edildi.
- Test edilen sayfalarda yakalanmamış JavaScript sayfa hatası yok.
- Oturum açık landing menüsü **Dashboard / Find Projects / My Meeting Requests**; kayıt bağlantısı yok. Doğrudan kayıt adresi dashboard'a yönlendi. API bu senaryoda taklit edildi.
- Mevcut bileşen testleri kayıt, e-posta doğrulama, form etiketleri, profil, toplantı, yorum ve yerelleştirme akışlarının bir bölümünü kapsıyor.
- Genel onay diyaloglarında odak tuzağı, Escape ve işlem sırasında tekrar gönderimi engelleme mevcut; bütün modal kombinasyonları tarayıcıda test edilmedi.
- Türkçe kontrolünde HTML dili `tr` olarak değişti. İki seçili eski İngilizce başlık bulunmadı; bundan bütün landing içeriğinin eksiksiz çevrildiği sonucu çıkarılmadı.

## 5. Çalıştığı doğrulanan güvenlik kontrolleri

- Tokensız, bozuk ve `alg:none` biçimindeki örnek token'lar `/auth/me` için 401 aldı.
- Nesne tipindeki NoSQL login girdileri 400 aldı.
- Normal kullanıcı profil güncellemesiyle kendini admin yapamadı veya suspension alanını değiştiremedi.
- API cevaplarında Helmet CSP ve `nosniff` mevcut; 10 KB üzeri JSON 413 aldı.
- Rate limiter production modunda devreye alındığında 21. geçersiz login isteği 429 aldı. Normal test ortamında limiter bilinçli olarak atlandığından bu ayrıca denendi.
- Mevcut testlerde başkasının post'unu silme/yayınlama, admin olmayan bildirim oluşturma ve public profilde özel alanları görme kontrolleri geçti.
- Parolalarda bcrypt, e-posta/reset token'larında rastgele üretim + hash, parola değişiminde `tokenVersion` artırma kodda mevcut. Bunlar logout/socket eksiklerini ortadan kaldırmıyor.

## 6. Düzeltme sırası ve yeniden test planı

1. **İlk düzeltme paketi:** S10 query şeması ve bağımsız görünürlük filtresi; S02 avatar sahipliği; S01 token iptali; S07 socket iptali. İlgili açık üretme testlerini güvenli davranış regresyonlarına dönüştür.
2. **Veri yaşam döngüsü:** S04/S05 için bütün modelleri kapsayan silme ve export sözleşmesi; karşı taraf verisi ve saklama politikasını açıklaştır.
3. **Production sertleştirme:** S11 runtime bağımlılıkları, S06 fail-closed yapılandırma, S12 kota/pagination, S13 gerçek deployment başlık ölçümü. Aktif entegrasyonlarla staging doğrulaması yap.
4. **Arayüz paketi:** U01 kontrast, U02 mobil kayıt, U03 hata ayrımı, U04 klavye menüsü, U05 örnek kontrol semantiği.
5. **Staging görev testi:** klinisyen ve mühendis için kayıt → e-posta → post → eşleşme → NDA/toplantı → mesaj → export/silme akışını gerçek entegrasyonlarla tamamla. Başarı oranı, süre, hata ve yardım ihtiyacını kaydet. En az bir mobil cihaz ve ekran okuyucuyla tekrar et.

## 7. Yeniden çalıştırma ve dosyalar

```powershell
npm test --prefix frontend
# İlk MongoDB indirmesinin test timeout'una takılmasını önlemek için mevcut test binary'si:
$env:MONGOMS_SYSTEM_BINARY = (Resolve-Path backend/node_modules/.cache/mongodb-memory-server/mongod-x64-win32-8.2.1.exe).Path
npm test --prefix backend -- --maxWorkers=2
npm test --prefix backend -- tests/securityAudit.test.ts
npm run build --prefix backend
npm audit --prefix backend --omit=dev
npm audit --prefix frontend --omit=dev
```

Binary yolu bu makineye özeldir. Başka sistemde uygun MongoDB binary'si edinilmeli; checksum doğrulaması atlanmamalıdır. Audit komutları bulgu olduğunda sıfırdan farklı çıkış kodu verebilir.

Tarayıcı tekrarında geçici araç dizinine `playwright` ve `axe-core` kurulmalı; betiklerdeki Chrome yolu ortama uyarlanmalıdır. Audit build'inde `VITE_API_URL=http://127.0.0.1:5999/api` kullanılıp preview `127.0.0.1:4179` üzerinde başlatılmalıdır. **Bu API adresi test içindir; canlıya bu build gönderilmemelidir.** API cevapları betiklerde taklit edilir.

- [Tarayıcı tarama betiği](audit-2026-09-19/browser-audit.cjs)
- [Kullanılabilirlik senaryoları](audit-2026-09-19/usability-probes.cjs)
- [Production tarayıcı çıktısı](audit-2026-09-19/browser-production.txt)
- [Kullanılabilirlik çıktısı](audit-2026-09-19/usability-production-final.txt)
- [Masaüstü landing](audit-2026-09-19/ui-1440-landing.png), [mobil landing](audit-2026-09-19/ui-375-landing.png)
- [Masaüstü kayıt](audit-2026-09-19/ui-1440-register.png), [mobil kayıt](audit-2026-09-19/ui-375-register.png)

Bu çalışma uygulama açıklarını düzeltmedi veya canlıya yayın yapmadı; rapor, kanıt dosyaları ve ek güvenlik testleri oluşturuldu. Test loglarındaki geçici e-posta token'ları paylaşım öncesi maskelendi. Test sunucuları kapatıldı ve test API adresini build çıktısında bırakmamak için normal frontend build'i yeniden üretildi: [başarılı son build](audit-2026-09-19/frontend-build-restored.txt).
