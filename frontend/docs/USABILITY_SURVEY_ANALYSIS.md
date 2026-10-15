# Kullanılabilirlik Anketi Analizi — HEALTH AI Co-Creation Platform

**Kaynak:** `frontend/CO-CREATION PLATFORM USABILITY TESTING.csv` (53 yanıt)
**Analiz tarihi:** 2026-10-15
**Kapsam:** Bu belge yalnızca analizdir; hiçbir sorun bu belge kapsamında düzeltilmedi.

---

## 1. Özet

- Yanıtlar iki ayrı test oturumundan geliyor:
  - **Eski grup:** 1–6 Eylül, 16 yanıt.
  - **Yeni grup:** 15 Ekim, 37 yanıt.

  Eski gruptaki sorunların büyük kısmı 14 Eylül'deki "Survey fixes" commit'lerinde ele alınmış (bkz. Bölüm 5).
- **SUS puanı belirgin biçimde düştü:** eski grupta 84,8 ("mükemmel"), yeni grupta 60,3 (68 olan sektör ortalamasının altında).
  - Yeni gruptaki 37 kişiden 27'si 68'in altında kaldı.
  - Düşüşün ana sebebi büyük ihtimalle temel görevleri tamamen engelleyen iki hata: istek limiti ("Too many requests") ve "Yayınla"/"Taslak kaydet" butonlarının sessizce başarısız olması.
- **Zamanlama:** Bu iki hatanın düzeltmesi (commit `344c90a`) 15 Ekim 14:15'te pushlandı. Yeni grubun yanıtları 13:42–14:22 arasında geldi. Yani bu şikayetlerin neredeyse tamamı düzeltme canlıya çıkmadan önce yazıldı.
- Düzeltmeler canlıya çıktıktan sonra hâlâ açık olan en önemli sorunlar:
  1. E-posta doğrulama bağlantısının "Invalid or expired verification token" hatası vermesi
  2. Arayüzde Türkçe ve İngilizcenin karışık görünmesi
  3. AI Assist ve Çeviri butonlarının çalışmaması
  4. Sayfa geçişinde sayfanın en üste kaydırılmaması
  5. Profil düzenleme ekranındaki çakışma ve üst üste binme sorunları

---

## 2. Veri ve yöntem

| | Eski grup (Eylül) | Yeni grup (15 Ekim) | Toplam |
|---|---|---|---|
| Yanıt sayısı | 16 | 37 | 53 |
| Yorum yazan | 12 | 21 | 33 |
| Katılımcı profili | 7 sağlık profesyoneli, 4 mühendis, 4 mühendislik öğrencisi, 1 AB proje yöneticisi | 35 mühendislik öğrencisi, 2 mühendis | |
| Ülke | Türkiye, Kosova, Norveç, İtalya, Portekiz | Türkiye | |

**Dikkat edilmesi gerekenler:**

- **Gruplar karşılaştırılabilir değil.** Eski grup çok uluslu ve karma bir kitleydi (sağlık profesyonelleri dahil). Yeni grup neredeyse tamamen Türk mühendislik öğrencilerinden oluşuyor. SUS düşüşünün bir kısmı kitle farkından kaynaklanıyor olabilir.
- **Tekrarlanan yanıtlar var.** Bunlar puanlara dahil edildi; etkileri küçük.
  - 4 Eylül 02:46 ve 02:47: birebir aynı puanlar ve aynı yorum.
  - 15 Ekim 13:44:39 ve 13:44:43: birebir aynı puanlar.
  - 15 Ekim 14:00:39 ve 14:03:34: aynı yorumun farklı kelimelerle yazılmış hali. Muhtemelen aynı kişi veya aynı kaynaktan.
- **Sorunlar ham haliyle alınmadı.** Her sorun önce kodda kontrol edildi ve şu durumlardan biriyle işaretlendi: *Çözüldü*, *Muhtemelen çözüldü*, *Açık* veya *Doğrulanmalı*.

### Sınıflandırma

**Tür:**
- **Teknik:** hata veya bug; bir şey çalışmıyor.
- **Görsel:** hizalama, renk, tipografi, çakışma.
- **UX:** akış, geri bildirim eksikliği, anlaşılırlık.
- **Dil:** çeviri ve terim tutarlılığı.
- **Altyapı:** performans, sunucu, e-posta teslimi.
- **İstek:** yeni özellik veya kapsam talebi.

**Öncelik:**
- **P0:** Temel bir görevi (kayıt, giriş, ilan yayınlama, toplantı isteği) tamamen engelliyor.
- **P1:** Görev yapılabiliyor ama hataya açık, yanıltıcı ya da güven kaybettiriyor.
- **P2:** Görünür kalite sorunu; görevi engellemiyor.
- **P3:** İyileştirme veya istek.

---

## 3. Skorlar

### SUS (0–100; 68 ortalama kabul edilir)

| | Eski grup | Yeni grup | Toplam |
|---|---|---|---|
| Ortalama | **84,8** | **60,3** | 67,7 |
| Medyan | 87,5 | 62,5 | 67,5 |
| En düşük / en yüksek | 52,5 / 97,5 | 15,0 / 97,5 | 15,0 / 97,5 |
| 68'in altında kalan | 2 / 16 | 27 / 37 | 29 / 53 |

### Madde bazında ortalamalar (1–5)

Tek numaralı maddeler olumlu ifadeler (yüksek puan iyi), çift numaralı maddeler olumsuz ifadeler (düşük puan iyi).

| Madde | Eski | Yeni | Değişim |
|---|---|---|---|
| S1 Sık kullanmak isterim | 4,25 | 3,14 | ▼ |
| S2 Gereksiz karmaşık | 1,69 | 2,54 | ▼ |
| S3 Kullanımı kolay | 4,50 | 3,43 | ▼ |
| S4 Teknik destek gerekir | 1,44 | 2,27 | ▼ |
| S5 İşlevler iyi entegre | 4,31 | 3,38 | ▼ |
| **S6 Çok tutarsızlık var** | 1,44 | **2,78** | ▼▼ en büyük düşüş |
| S7 Çabuk öğrenilir | 4,44 | 3,70 | ▼ |
| **S8 Kullanımı zahmetli** | 1,62 | **2,97** | ▼▼ |
| S9 Kendimi güvende hissettim | 4,19 | 3,62 | ▼ |
| S10 Çok şey öğrenmem gerekti | 1,56 | 2,59 | ▼ |

**Yorum:** En büyük kötüleşme S6 (tutarsızlık) ve S8 (zahmetli kullanım) maddelerinde. Bu, yorumlardaki iki ana temayla uyuşuyor:
- Türkçe/İngilizce karışıklığı ve görsel tutarsızlıklar → S6
- Butonların tepki vermemesi ve sürekli "Too many requests" alınması → S8

### Algılanan fayda (1–5)

| | Eski | Yeni |
|---|---|---|
| Ortak bulmak için kullanırım | 4,44 | 3,78 |
| Gerçek bir ihtiyacı karşılıyor | 3,94 | 3,24 |
| Bir meslektaşıma öneririm | 4,62 | 3,65 |

Fikrin değeri iki grupta da olumlu karşılanmış. Yeni gruptaki düşüş, ürünün kendisinden çok yaşanan hatalarla ilgili görünüyor. "Platformun vizyonunu beğendim ama…" kalıbı yorumlarda sık geçiyor.

---

## 4. Yeni grup (15 Ekim) — sorun listesi

"Kişi" sütunu, sorunu yorumunda açıkça yazan kişi sayısıdır. Yorum yazmayan 16 kişinin de aynı sorunları yaşamış olması muhtemel.

### P0 — Temel görevleri engelleyen

| # | Sorun | Tür | Kişi | Durum | Teknik not |
|---|---|---|---|---|---|
| N1 | Kayıt, giriş ve şifre sıfırlamada "Too many requests". Bir yanıtta tek denemede bile alındığı yazıyor. Kayıtlı e-posta ile kayıt olunduğunda da gerçek hata yerine bu mesaj görünüyor. | Teknik | 4 | **Muhtemelen çözüldü** (`344c90a`, 14:15) | Limitler IP başınaydı (giriş/kayıt için 15 dakikada 20). Render'ın proxy'si arkasında `trust proxy 1` ayarı yüzünden tüm kullanıcılar ortak IP'den görünüyor ve tek kotayı paylaşıyor olabilir. Limit artık varsayılan olarak kapalı. Canlıda yeniden test edilmeli. |
| N2 | "İncele & Yayınla" ve "Taslak kaydet" tıklanınca hiçbir şey olmuyor. Başarı veya hata mesajı yok, ilan yayınlanmıyor. | Teknik + UX | 7 | **Muhtemelen çözüldü** (`344c90a`) | Asıl sebep: `POST /api/posts` 429 dönüyordu (kullanıcının ilettiği konsol çıktısı bunu doğruladı) ve frontend hatayı göstermiyordu. Artık hata ve doğrulama mesajı gösteriliyor. Başarılı kayıt sonrası ayrıca bir onay mesajı (toast) yok; sadece detay sayfasına yönlendiriliyor. |
| N3 | E-posta doğrulamada "Invalid or expired verification token". Kullanıcı platforma hiç giremiyor. Mesaj teknik dilde. | Teknik + Dil | 2 (aynı kaynak olabilir) | **Açık** | Olası sebep: her "yeniden gönder" veya tekrar kayıt işlemi yeni token üretip eskisini geçersiz kılıyor ([authService.ts](../../backend/services/authService.ts) `registerUser`/`resendVerification`). E-postalar geç geldiği için (N4) kullanıcı tekrar istiyor, sonra eski e-postadaki bağlantıya tıklayıp bu hatayı alıyor. Bağlantı ikinci kez açıldığında da (token silindiği için) aynı hata çıkıyor. Mesaj kullanıcı diline çevrilmeli ve yanına "yeni bağlantı iste" seçeneği eklenmeli. |
| N4 | Doğrulama e-postası geç geliyor. | Altyapı | 1 | **Doğrulanmalı** | Gmail SMTP ve Render ücretsiz sunucunun uykudan uyanma süresi birlikte etkili olabilir. N3'ü tetikliyor. |
| N5 | Şifre sıfırlamadan sonra ne yeni ne eski şifre kabul ediliyor. | Teknik | 2 | **Doğrulanmalı** | Backend'deki sıfırlama mantığı doğru görünüyor ([authService.ts](../../backend/services/authService.ts) `resetPassword`). Büyük ihtimalle sıfırlama veya giriş isteği 429'a takıldı (N1) ve kullanıcı bunu "şifre kabul edilmedi" diye algıladı. Rate limit kalktıktan sonra tekrar test edilmeli. |

### P1 — Görev yapılabiliyor ama hataya açık veya yanıltıcı

| # | Sorun | Tür | Kişi | Durum | Teknik not |
|---|---|---|---|---|---|
| N6 | Arayüz Türkçeyken bazı metinler, form alanları ve seçenekler İngilizce. Başka sayfaya geçince dil İngilizceye dönebiliyor. | Dil | 5 | **Açık** | En çok tekrar eden tema. Backend'den gelen hata mesajları (`'Too many requests…'`, `'Invalid or expired…'`) çevrilmeden doğrudan gösteriliyor. Eksik çeviri anahtarları ve sabit yazılmış metinler taranmalı. |
| N7 | İlan formundaki AI Assist çalışmıyor; "AI fallback active" bildirimi kafa karıştırıyor. | Teknik | 2 (+1 eski) | **Açık** | Geliştirme loglarında Gemini `429 quota exceeded` hatası var ([dev-server.out.log](../../backend/dev-server.out.log)). Muhtemelen API kotası doldu. Kota veya ücretlendirme kontrol edilmeli ve AI kullanılamadığında kullanıcıya anlaşılır bir mesaj gösterilmeli. |
| N8 | Proje açıklamasındaki Çevir (Türkçe) butonu çalışmıyor. | Teknik | 2 (aynı kaynak olabilir) | **Açık** | Bu da Gemini'ye bağlı; N7 ile aynı kök neden olabilir. |
| N9 | Toplantı isteğinde geçmiş tarih (ör. 2023) seçilebiliyor; takvim açılmıyor. | Teknik + UX | 1 | **Kısmen** | `min` özelliği var ([SlotListEditor.tsx](../../frontend/src/components/meetings/SlotListEditor.tsx)), ancak bu yalnızca takvim seçiciyi kısıtlıyor; elle yazılan tarihi engellemiyor. Backend geçmiş tarihleri reddediyor (`caff785`), fakat kullanıcıya gönderim anında anlaşılır bir hata gösterildiği doğrulanmalı. Takvimin açılmaması tarayıcıya özgü olabilir. |
| N10 | Bağlantıya tıklayınca yeni sayfa en üstten değil, en alttan açılıyor. | Teknik | 1 | **Açık (doğrulandı)** | Kodda sayfa geçişinde en üste kaydırma yapan bir mekanizma (`ScrollToTop`/`ScrollRestoration`) yok. Önceki sayfanın kaydırma konumu yeni sayfaya taşınıyor. Küçük ve kolay bir düzeltme. |
| N11 | Süresi dolmuş ilanlar otomatik kaldırılmıyor ve listede görünüyor. | Teknik | 1 | **Doğrulanmalı** | Saatlik bir zamanlanmış görev (cron) var ([cron.ts](../../backend/src/cron.ts)). Ancak Render ücretsiz sunucu uykuya geçtiğinde cron çalışmaz. Liste sorgusu da tarihe göre filtreleme yapmıyorsa süresi dolmuş ilanlar "aktif" görünmeye devam eder. Ayrıca süresi dolmuş ilanların "Süresi doldu" etiketiyle listede kalması bilinçli bir tasarım kararı olabilir; ekipçe netleştirilmeli. |
| N12 | Browse posts'ta "Sırala" ve "Konum" filtresi çalışmıyor. | Teknik | 2 | **Doğrulanmalı** | Son commit'lerde (`afc0d18`, `a6dac86`) liste sorgusu sunucu tarafına taşındı. Sıralamanın başlangıç değeri `localStorage`'dan okunuyor. Konum filtresi `city` parametresi olarak gönderiliyor; ülke adı yazılırsa eşleşmeyebilir. Canlıda test edilmeli. |
| N13 | Kayıt sırasında KVKK/Gizlilik bağlantısına tıklayınca sayfa kapatılamıyor ve kayıt baştan başlıyor; form içeriği kayboluyor. | UX + Teknik | 2 | **Açık** | Bağlantı aynı sekmede açılıyor ve kayıt sihirbazının durumu kayboluyor. Politika bir modal içinde veya yeni sekmede açılmalı. |
| N14 | Profilde uzmanlık girildiği halde "No data available" görünüyor; profil gücü göstergesi tutarsız değişiyor. | Teknik | 1 | **Doğrulanmalı** | `661ccd6` (expertise tags hydration) ile ilişkili olabilir. |
| N15 | Yorumlara yanıt verilemiyor. | Teknik | 1 | **Doğrulanmalı** | `caff785` yanıtlamayı düzeltmişti. Yorum yazan kişi "hiçbir işlev çalışmıyor" da diyor; büyük ihtimalle N1 kaynaklı. |
| N16 | İlan formu sayfa yenilenince sıfırlanıyor. | UX | 1 | **Açık** | Form taslağı yerelde saklanmıyor. Sadece `beforeunload` uyarısı var. |
| N17 | Kaydedilen taslaklara ulaşılabilecek belirgin bir yer yok. | UX | 2 | **Kısmen** | Taslaklar "Durum: Taslak" filtresiyle bulunabiliyor, ama bu yeterince görünür değil. Dashboard'a veya "İlanlarım" bölümüne bir taslak sekmesi eklenebilir. |
| N18 | Sistemde hangi e-postayla giriş yapıldığı belli değil. | UX | 1 | **Açık** | Hesap menüsünde e-posta adresi gösterilebilir. |
| N19 | Proje özeti PDF'inde yazar adı düzgün görünmüyor. | Teknik | 1 | **Doğrulanmalı** | Muhtemelen PDF fontunda Türkçe karakter (ğ, ş, İ) desteği yok. |
| N20 | Hata mesajları genel; ör. kayıtlı e-postada "Too many requests" çıkıyor. | UX + Dil | 1 | **Muhtemelen çözüldü** | Kök nedeni N1. 409 durumunda doğru mesaj zaten tanımlı (`2d84983`). |

### P2 — Görsel ve kalite sorunları

| # | Sorun | Tür | Kişi | Durum |
|---|---|---|---|---|
| N21 | Profil düzenlemede uzmanlık seçenekleri "Profili düzenliyorsunuz" alt çubuğunun altında kalıyor; butonlar metnin üzerine biniyor. | Görsel | 2 | **Açık**. Sabit kaydet çubuğu (`2d84983`) içeriği örtüyor; sayfanın altına çubuk yüksekliği kadar boşluk bırakılmalı. |
| N22 | Toplantılar sayfasının düzeni diğer sayfalarla tutarsız (hizalama, metin konumu, görünürlük). | Görsel | 1 | **Açık** |
| N23 | Toplantılar sayfasındaki takvimin ne işe yaradığı belli değil (işlevsel mi, süs mü?). | UX | 1 | **Açık** |
| N24 | Menüler üst üste biniyor, ikonlar kaymış; metin yoğunluğu fazla. | Görsel | 2 (aynı kaynak olabilir) | **Doğrulanmalı**. Hangi ekran olduğu belirtilmemiş. |
| N25 | %100 yakınlaştırmada her şey sola dayalı, kenar boşluğu yok (tüm sayfalarda). | Görsel | 1 | **Doğrulanmalı**. Belirli bir ekran genişliğinde ortalayan kapsayıcı (container) kırılıyor olabilir. |
| N26 | "Tekrar hoş geldin, [AD]" yazısında harf aralığı çok dar. | Görsel | 1 | **Açık**. Büyük harf ve sıkışık harf aralığı (`tracking`) birlikte kullanılıyor; Türkçe karakterlerle okunabilirlik düşüyor. |
| N27 | Üst bardaki hover alanı köşeli; barın yuvarlak tasarımıyla uyuşmuyor. | Görsel | 1 | **Açık** |
| N28 | Filtreler tarayıcının varsayılan select görünümünde (sitenin tasarımıyla uyumlu değil); arama yok. | Görsel + İstek | 1 | **Açık** |
| N29 | Kartlarda ilgi alanı bazı ilanlarda mavi, bazılarında renksiz. "Partner bulundu" ve "Süresi doldu" durumları gri ve dikkat çekmiyor. | Görsel | 1 | **Açık** |
| N30 | Profil fotoğrafını değiştirmek sezgisel değil. | UX | 1 | **Açık** |
| N31 | Sunucu yavaş; şifre ekranında "sunucu uyanıyor" mesajı çıkıyor. | Altyapı | 3 | **Bilinen kısıt**. Render ücretsiz planı uykuya geçiyor; bildirim `271ce5b` ile bilinçli olarak eklendi. Kalıcı çözüm ücretli plan veya düzenli "uyandırma" isteği (keep-alive). |
| N32 | Arayüzün yapay zekâ ile tasarlandığı belli oluyor. | Görsel | 1 | **Öznel**. Tasarım dilinin özgünleştirilmesi daha uzun vadeli bir iş. |

### P3 — İstekler

| # | İstek | Kişi | Not |
|---|---|---|---|
| N33 | Listede olmayan uzmanlık eklenebilsin (ör. "OCR uzmanı"). | 1 | Serbest metin uzmanlık; standart katalog fikriyle (E8) dengelenmeli. |
| N34 | Kurum alanında hazır seçim listesi olsun. | 1 | Üniversite listesinden otomatik tamamlama. |
| N35 | En fazla 3 sağlık alanı seçilebiliyor. | 1 | Eylül'deki geri bildirim üzerine **bilinçli olarak** 3'e çıkarıldı (`caff785`). Ekip kararı. |
| N36 | Koyu tema ve erişilebilirlik seçenekleri. | 2 (aynı kaynak olabilir) | Tema değiştirici `855b720` ile **kaldırılmış**. Bilinçli bir kararsa sorun yok; erişilebilirlik ayrıca değerlendirilmeli. |

---

## 5. Eski grup (Eylül) — durum kontrolü

Bu bölümdeki sorunlar 14 Eylül'deki `caff785`, `2d84983` ve `2780677` commit'lerinde ele alınmış. Durumlar commit mesajlarına ve koda göre belirlendi; canlıda tek tek yeniden test edilmedi.

| # | Eski geri bildirim | Tür | Durum | Nerede |
|---|---|---|---|---|
| E1 | "Approved" ve "Completed" durumları görsel olarak benzer | Görsel | Çözüldü | `2d84983`: durumların ayrı adları ve renkleri var |
| E2 | Toplantılardaki "Gelen/Giden" terimleri anlaşılmıyor | Dil | Çözüldü | "Bana gelen / Gönderdiğim" |
| E3 | Görev talimatında 2 zaman aralığı, platformda zorunlu 3; 3 öneri zorlayıcı | UX | Çözüldü | Artık 1–5 zaman aralığı |
| E4 | İstek sonrası durum "Pending Review" kalıyor | UX | Çözüldü | Yeni durum adları ve her satırda "sırada ne var" açıklaması |
| E5 | "Complete" ile "accepted" aynı şey mi? | Dil | Çözüldü | "Held" ve "Partner Found" ayrıldı |
| E6 | Sohbet ancak "complete" sonrası açılıyor | UX | Çözüldü | Sohbet kabul edilir edilmez açılıyor |
| E7 | Saat seçicide :00 yok, sadece :10, :12; AM/PM yerine 24 saat olsun | UX | Çözüldü | 24 saat, 15 dakikalık aralıklar |
| E8 | Tek alan seçilebiliyor; standart katalog kullanılsın; ebelik/hemşirelik eksik; Radyoloji tekrarlı | İçerik | Çözüldü | 1–3 alan, gruplu liste, yeni alanlar, `migrate-domains.ts` |
| E9 | "Partner found" geri alınamıyor | Teknik | Çözüldü | Reopen + onay penceresi |
| E10 | Partner bulunan ilana ilgi duyan kişi iletişim kuramıyor; yorumda bildirim yok | UX | Kısmen | Yorum bildirimi eklendi. Kapalı ilanda iletişim kanalı hâlâ yok (bilinçli olabilir). |
| E11 | Profilde ORCID ve kurum iletişim bilgisi olsun | İstek | Çözüldü | Profesyonel bilgiler bölümü |
| E12 | Kayıtta şifreler uyuşmadığı halde sonraki adıma geçiliyor | Teknik | Çözüldü | `2d84983` |
| E13 | Doğrulama başarısız olunca tekrar kayıtta "already registered" çıkıyor | Teknik | Çözüldü | Doğrulanmamış hesaba yeni bağlantı gönderiliyor. Ancak bu davranış N3'ün olası sebeplerinden biri. |
| E14 | Profilde Kaydet butonu üstte; kullanıcı altta arıyor | UX | Çözüldü | Kaydet çubuğu alta alındı. Fakat bu kez içeriği örtüyor (N21). |
| E15 | Tarih biçimi g/a/y daha tanıdık | Dil | Çözüldü | `a23a0e8`: tarih biçimi dile göre. Tarayıcının kendi tarih seçicisi işletim sistemi diline bağlı kalır. |
| E16 | Bazı ülkelerde şehir seçilemiyor | Teknik | Çözüldü | Listede olmayan şehir elle yazılabiliyor |
| E17 | Connected Accounts / LinkedIn butonu çalışmıyor | Teknik | Kısmen | Yapılandırılmamış sağlayıcılar "henüz kullanılamıyor" olarak gösteriliyor. OAuth gerçekten kurulmadı. |
| E18 | Bildirim başlıkları Türkçe görünüyor | Dil | Çözüldü | `9ce2d96`, `2d84983` |
| E19 | AI Assist çalışmıyor | Teknik | **Açık** | Yeni grupta da tekrarlandı (N7) |
| E20 | Seçenek ve görev başlıklarının anlamı net değil | UX | Çözüldü | Aşama, işbirliği ve taahhüt seçenekleri artık açıklama içeriyor |

**Sonuç:** Eski gruptaki 20 sorunun 16'sı çözüldü, 3'ü kısmen çözüldü, 1'i (AI Assist) hâlâ açık. Yeni grupta bu sorunların hiçbiri tekrar şikayet edilmedi. Bu, Eylül düzeltmelerinin işe yaradığını gösteriyor. Yalnızca iki düzeltme yeni sorunlara yol açmış olabilir: E13 → N3 ve E14 → N21.

---

## 6. Türe göre dağılım (yeni grup, açık veya doğrulanmalı)

| Tür | P0 | P1 | P2 | P3 | Toplam |
|---|---|---|---|---|---|
| Teknik | 2 | 9 | – | – | 11 |
| UX | – | 4 | 2 | – | 6 |
| Görsel | – | – | 9 | – | 9 |
| Dil | – | 1 | – | – | 1 |
| Altyapı | 1 | – | 1 | – | 2 |
| İstek | – | – | – | 4 | 4 |

*N1, N2 ve N20 "muhtemelen çözüldü" olduğu için bu tabloya dahil edilmedi. Birden fazla türe giren sorunlar ağırlıklı türüne göre sayıldı.*

**Yorum:** Kullanıcıyı engelleyen ve en çok puan kaybettiren sorunlar teknik. Görsel sorunlar sayıca fazla ama tek tek küçük ve büyük kısmı tek kişi tarafından dile getirilmiş. Dil tutarsızlığı tek bir madde olarak sayıldı, ama **en çok kişinin (5)** dile getirdiği sorun bu ve SUS S6 düşüşüyle doğrudan ilişkili.

---

## 7. Önerilen sıra

1. **Rate limit ve yayınlama düzeltmesini canlıda doğrula** (N1, N2, N5, N15, N20). Bu doğrulama tek başına beş maddeyi kapatabilir.
2. **E-posta doğrulama akışı** (N3, N4): eski bağlantılar için anlaşılır mesaj ve "yeni bağlantı gönder" seçeneği.
3. **Dil taraması** (N6): eksik çeviri anahtarları, sabit metinler ve backend hata mesajlarının çevrilmesi.
4. **AI kotası** (N7, N8): Gemini kotası ve ücretlendirme kontrolü; AI kullanılamadığında net bir mesaj.
5. **Hızlı teknik düzeltmeler:** sayfa geçişinde en üste kaydırma (N10), geçmiş tarih kontrolü (N9), KVKK bağlantısının modal veya yeni sekmede açılması (N13), kaydet çubuğunun içeriği örtmesi (N21).
6. **Doğrulama turu:** N11, N12, N14, N19 ve N24–N25 canlıda tek tek denenmeli.
7. **Görsel iyileştirmeler ve istekler** (P2 ve P3): bir sonraki tasarım turunda toplu ele alınabilir.

Düzeltmelerden sonra aynı görevlerle kısa bir tekrar testi yapılması, SUS puanının gerçekten nereye oturduğunu gösterir. Yeni gruptaki puanlar engelleyici hatalar varken toplandığı için ürünün gerçek kullanılabilirliğini yansıtmıyor olabilir.

---

## 8. Olumlu geri bildirimler

İki grupta da tekrar eden olumlu temalar:

- Temiz, modern ve düzenli arayüz
- Fikir ve vizyon değerli bulunuyor: "mühendisleri ve sağlık profesyonellerini buluşturan etkili bir sistem"
- Adımlar net ve öğrenmesi kolay; profil özelleştirme kolay
- Doğrulama aşamasındaki "işleniyor" mesajı beğenildi
