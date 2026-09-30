# Sunucu Tarafı Listeleme (Filtre · Sıralama · Sayfalama) Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** İlan, kullanıcı ve log listelerinin veritabanındaki kayıt sayısından bağımsız olarak eksiksiz ve doğru çalışması: her filtre, arama, sıralama ve sayfa sunucuda hesaplanır; tarayıcı yalnızca görüntülediği sayfayı indirir.

**Architecture:** Profesyonel web uygulamalarının standart kalıbı uygulanır: (1) sunucu filtre/sıralama/sayfalamanın tek doğruluk kaynağıdır ve her yanıtta gerçek `total` döner; (2) istemcide her sorgu kendi anahtarıyla önbelleğe alınır (TanStack Query), böylece sayfalar birbirinin verisini ezmez, eski yanıtlar yenilerin üstüne yazılmaz ve sayfa geçişlerinde liste titremez; (3) metin araması 300 ms geciktirilir (debounce); (4) “en iyi eşleşme” sıralaması iki aşamalı sıralama (aday üretimi + puanlama) ile sunucuda yapılır, yapay zekâ yalnızca görünen sayfayı zenginleştirir.

**Tech Stack:** Backend Express + Mongoose (MongoDB), Vitest + supertest + mongodb-memory-server. Frontend React 18 + Vite, react-router 6, zustand, **@tanstack/react-query v5 (yeni bağımlılık)**, Vitest + Testing Library.

**Spec:** Ayrı bir spec belgesi yok. Bu plan, `frontend-fix` dalındaki HCI/kullanılabilirlik çalışması sırasında tespit edilen şu soruna dayanır: istemci en fazla 100 ilanı (backend üst sınırı) indirip filtre/sıralama/sayfalamayı tarayıcıda yapıyor; 100’den sonraki ilanlar hiçbir aramada görünmüyor, sayaçlar gerçek toplamı değil indirilen dizinin uzunluğunu gösteriyor ve tüm sayfalar tek bir paylaşılan `posts` dizisini birbirinin üstüne yazıyor.

## Mevcut durum (kanıt)

| Yer | Bugün ne oluyor | Dosya |
| --- | --- | --- |
| İlanları Keşfet | `limit: 100` ile indiriyor, filtre/sıralama/sayfa tarayıcıda | `frontend/src/pages/posts/PostListPage.tsx:137, 151-235` |
| Backend `/posts` | `limit` 100 ile sınırlı; filtre ve sayfa destekli; sıralama yalnızca `createdAt desc`; arama `$text` (tam kelime) | `backend/controllers/postController.ts:52-77`, `backend/services/postService.ts:82-116` |
| Dashboard | `mine: true` ile aynı paylaşılan diziyi dolduruyor | `frontend/src/pages/dashboard/DashboardPage.tsx:21-28` |
| İlan detayı | Paylaşılan dizi boş değilse hiç istek atmıyor (başka sayfanın verisine güveniyor) | `frontend/src/pages/posts/PostDetailPage.tsx:52-72` |
| Uygulama açılışı | Oturum açılınca global `fetchPosts()` | `frontend/src/App.tsx:27` |
| Admin → İlanlar | İki kez istiyor (200 ve 100), en fazla 100 görünür, “toplam” yanlış | `frontend/src/pages/admin/AdminPage.tsx:695-697` |
| Admin → Kullanıcılar | 500 kullanıcı indirip tarayıcıda arıyor/sayfalıyor; backend `search/page/limit` destekli ama kullanılmıyor | `AdminPage.tsx:686`, `backend/controllers/authController.ts:160-169` |
| Admin → Loglar | Son 200 kayıt, filtreler bu 200 içinde; backend `action/result/page` destekli | `AdminPage.tsx:702`, `backend/services/logService.ts:25-50` |
| Güvenlik | Log `action` filtresi kaçışsız `$regex` (regex enjeksiyonu / ReDoS) | `backend/services/logService.ts:27` |

## Global Constraints

- Backend liste uç noktalarında `limit` üst sınırı korunur: ilanlar 100, kullanıcılar 500, loglar 200.
- Her liste yanıtı `{ items…, total, page, limit, pages }` biçimini korur (mevcut sözleşme); var olan alan adları değiştirilmez.
- Sıralama parametresi yalnızca beyaz listedeki değerleri kabul eder; bilinmeyen değer `newest`’e düşer, hata vermez.
- Her sıralama benzersiz bir ikincil anahtar (`_id`) içerir; aynı zaman damgalı kayıtlar sayfalar arasında kaybolmaz veya tekrarlanmaz.
- Kullanıcı girdisi regex’e girmeden önce `escapeRegex` ile kaçışlanır.
- URL, filtre ve sayfa için tek doğruluk kaynağı olarak kalır (`?q=&domain=&stage=&status=&by=&loc=&page=`, mevcut `PostListPage` sözleşmesi).
- Arayüz metinleri 5 dilde (en, tr, es, nl, pt) çeviri anahtarıyla eklenir.
- Her görev sonunda `npm test` (backend ve frontend) ve `npx tsc -b` (frontend) hatasız olmalıdır.

## Review Focus

1. **URL’deki sayfa numarası artık geçerli değil** (ör. `?page=9` ama filtreden sonra 2 sayfa var, ya da son sayfadaki son ilan silindi): kullanıcı boş bir sayfa değil son geçerli sayfayı görmeli. → Task 5’te test.
2. **Hızlı yazma ve ağ yarışı:** “kardiyo” yazılırken önceki “kar” yanıtı sonra gelirse listeyi ezmemeli; yalnızca bir istek gitmeli. → Task 4 (debounce testi) + Task 5 (tek istek testi); TanStack Query anahtar/iptal davranışı eski yanıtı yok sayar.
3. **Kısmi kelime ve büyük/küçük harf araması:** “cardi” yazan “Cardiology” içeren ilanı bulmalı (bugünkü tarayıcı davranışı). `$text` bunu yapmaz; regex araması yapar. → Task 1’de test.
4. **Profilinde uzmanlık etiketi olmayan kullanıcı “En iyi eşleşme” seçerse** hata değil, en yeni sıralama görmeli. → Task 2’de test.
5. **Alan filtresi + konum filtresi birlikte:** ikisi de `$or` kullandığı için birbirini ezmemeli. → Task 1’de test.

---

## Dosya yapısı

**Backend**
- Modify `backend/services/postService.ts` — `listPosts`: sıralama, konum, regex arama, `$and` birleştirme, relevance dalı.
- Modify `backend/controllers/postController.ts` — `listPosts`: `sort`, `location` parametreleri; relevance için izleyici profili.
- Create `backend/utils/matchScore.ts` — frontend `getCombinedMatchScore` taban puanının sunucu karşılığı (yapay zekâsız).
- Modify `backend/models/Post.ts` — bileşik indeksler.
- Modify `backend/services/logService.ts` — `action` tam eşleşme.
- Modify `backend/tests/helpers.ts` — `createPublishedPost`.
- Create `backend/tests/postListing.test.ts`, `backend/tests/matchScore.test.ts`, `backend/tests/logs.test.ts`.

**Frontend**
- Create `frontend/src/lib/queryClient.ts` — tek `QueryClient` ve sorgu anahtarları.
- Create `frontend/src/lib/postsApi.ts` — `fetchPostList`, `fetchPost`, `normalisePost`, tipler.
- Create `frontend/src/lib/adminApi.ts` — `fetchAdminUsers`, `fetchLogs`.
- Create `frontend/src/hooks/usePostList.ts`, `frontend/src/hooks/usePost.ts`, `frontend/src/hooks/useDebouncedValue.ts`.
- Modify `frontend/src/main.tsx` — `QueryClientProvider`.
- Modify `frontend/src/store/postStore.ts` — liste durumu yerine yalnızca mutasyonlar + önbellek geçersizleştirme.
- Modify `frontend/src/pages/posts/PostListPage.tsx`, `frontend/src/pages/dashboard/DashboardPage.tsx`, `frontend/src/pages/posts/PostDetailPage.tsx`, `frontend/src/App.tsx`, `frontend/src/pages/admin/AdminPage.tsx`.
- Create `frontend/src/tests/renderWithQuery.tsx` — testlerde sağlayıcı sarmalayıcı.

Her aşama kendi başına yayınlanabilir: **Task 1-3 backend**, **Task 4-6 istemci**, **Task 7 admin**. Sıra korunmalıdır, çünkü istemci görevleri Task 1-2’deki parametrelere dayanır.

---

### Task 1: Backend — sıralama, konum ve kısmi kelime araması

**Files:**
- Modify: `backend/services/postService.ts:34-45` (PostFilters), `:82-116` (listPosts)
- Modify: `backend/controllers/postController.ts:52-77`
- Modify: `backend/models/Post.ts:91-96`
- Modify: `backend/tests/helpers.ts` (yeni yardımcı)
- Test: `backend/tests/postListing.test.ts`

**Interfaces:**
- Produces: `GET /api/posts?sort=newest|oldest|expiring|relevance&location=<text>&search=<text>&page=&limit=`; `export type PostSort`, `export const POST_SORTS`, `function buildListQuery(filters): FilterQuery<IPost>` ve `const SORT_SPECS` (`postService.ts`); `listPosts(filters, page, limit, sort?)`.

- [ ] **Step 1: Test yardımcısını ekle** — `backend/tests/helpers.ts` sonuna:

```ts
export async function createPublishedPost(token: string, overrides: Record<string, unknown> = {}) {
  const post = await createPost(token, overrides)
  const res = await api.post(`/api/posts/${post.id}/publish`).set('Authorization', `Bearer ${token}`)
  if (res.status !== 200) throw new Error(`publish failed: ${JSON.stringify(res.body)}`)
  return res.body.data
}
```

- [ ] **Step 2: Başarısız testleri yaz** — `backend/tests/postListing.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { api, createUser, createPublishedPost, futureDate } from './helpers'

const titles = (res: { body: { data: { posts: { title: string }[] } } }) => res.body.data.posts.map(p => p.title)

describe('GET /api/posts — server-side listing', () => {
  it('sorts by soonest expiry when sort=expiring', async () => {
    const { token } = await createUser()
    await createPublishedPost(token, { title: 'Late', expiryDate: futureDate(40) })
    await createPublishedPost(token, { title: 'Soon', expiryDate: futureDate(10) })

    const res = await api.get('/api/posts?sort=expiring&limit=10').set('Authorization', `Bearer ${token}`)
    expect(titles(res).indexOf('Soon')).toBeLessThan(titles(res).indexOf('Late'))
  })

  it('falls back to newest for an unknown sort instead of failing', async () => {
    const { token } = await createUser()
    const res = await api.get('/api/posts?sort=drop_table').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
  })

  it('finds partial words, case-insensitively, like the old in-browser search', async () => {
    const { token } = await createUser()
    await createPublishedPost(token, { title: 'Cardiology triage assistant' })
    await createPublishedPost(token, { title: 'Wound imaging' })

    const res = await api.get('/api/posts?search=CARDI').set('Authorization', `Bearer ${token}`)
    expect(titles(res)).toEqual(['Cardiology triage assistant'])
  })

  it('matches location against city or country, together with a domain filter', async () => {
    const { token } = await createUser()
    await createPublishedPost(token, { title: 'Berlin cardio', city: 'Berlin', country: 'Germany', domain: 'Cardiology' })
    await createPublishedPost(token, { title: 'Berlin neuro', city: 'Berlin', country: 'Germany', domain: 'Neurology' })
    await createPublishedPost(token, { title: 'Ankara cardio', city: 'Ankara', country: 'Turkey', domain: 'Cardiology' })

    const res = await api.get('/api/posts?location=germ&domain=Cardiology').set('Authorization', `Bearer ${token}`)
    expect(titles(res)).toEqual(['Berlin cardio'])
  })

  it('never repeats or drops a post across pages', async () => {
    const { token } = await createUser()
    for (const n of [1, 2, 3, 4, 5]) await createPublishedPost(token, { title: `Paged ${n}` })

    const page1 = await api.get('/api/posts?search=Paged&limit=2&page=1').set('Authorization', `Bearer ${token}`)
    const page2 = await api.get('/api/posts?search=Paged&limit=2&page=2').set('Authorization', `Bearer ${token}`)
    const page3 = await api.get('/api/posts?search=Paged&limit=2&page=3').set('Authorization', `Bearer ${token}`)
    const all = [...titles(page1), ...titles(page2), ...titles(page3)]
    expect(new Set(all).size).toBe(5)
    expect(page1.body.data.total).toBe(5)
  })
})
```

- [ ] **Step 3: Testlerin başarısız olduğunu gör**

Run: `cd backend && npx vitest run tests/postListing.test.ts`
Expected: `sort=expiring`, `search=CARDI` ve `location` testleri FAIL (sıralama yok sayılıyor, `$text` kısmi kelime bulmuyor, `location` parametresi yok).

- [ ] **Step 4: Servisi uygula** — `postService.ts` içinde `PostFilters`’a alan ekle, sorgu kurmayı ayrı fonksiyona al ve `listPosts`’u değiştir:

```ts
export interface PostFilters {
  domain?: string
  expertise?: string
  city?: string
  country?: string
  /** Free text matched against city or country (partial, case-insensitive). */
  location?: string
  projectStage?: string
  status?: string
  search?: string
  authorRole?: string
  /** Giriş yapan kullanıcının kendi post'larını (draft dahil) görmesi için */
  authorId?: string
}

export type PostSort = 'newest' | 'oldest' | 'expiring' | 'relevance'
export const POST_SORTS: readonly PostSort[] = ['newest', 'oldest', 'expiring', 'relevance']

// Every sort ends on _id so posts sharing a timestamp keep a stable order across pages.
const SORT_SPECS: Record<Exclude<PostSort, 'relevance'>, Record<string, 1 | -1>> = {
  newest:   { createdAt: -1, _id: -1 },
  oldest:   { createdAt: 1, _id: 1 },
  expiring: { expiryDate: 1, _id: 1 },
}

function buildListQuery(filters: PostFilters): FilterQuery<IPost> {
  const query: FilterQuery<IPost> = {}
  // Domain, location and search each need an $or; collecting them under $and keeps them from overwriting each other.
  const and: FilterQuery<IPost>[] = []

  if (filters.authorId) {
    query.authorId = filters.authorId
    if (filters.status) query.status = filters.status
  } else if (filters.status) {
    query.status = filters.status
  } else {
    query.status = { $ne: 'draft' }
  }

  if (filters.domain) {
    const names = domainFilterVariants(filters.domain).map(name => new RegExp(`^${escapeRegex(name)}$`, 'i'))
    and.push({ $or: [{ domains: { $in: names } }, { domain: { $in: names } }] })
  }
  if (filters.location?.trim()) {
    const loc = new RegExp(escapeRegex(filters.location.trim()), 'i')
    and.push({ $or: [{ city: loc }, { country: loc }] })
  }
  if (filters.search?.trim()) {
    // Partial, case-insensitive match (what users had with in-browser filtering). $text only
    // matches whole words; move to Atlas Search if the collection grows past ~50k posts.
    const text = new RegExp(escapeRegex(filters.search.trim()), 'i')
    and.push({ $or: [{ title: text }, { description: text }, { expertiseRequired: text }, { authorName: text }] })
  }
  if (filters.expertise) query.expertiseRequired = { $regex: escapeRegex(filters.expertise), $options: 'i' }
  if (filters.city) query.city = { $regex: `^${escapeRegex(filters.city)}$`, $options: 'i' }
  if (filters.country) query.country = { $regex: `^${escapeRegex(filters.country)}$`, $options: 'i' }
  if (filters.projectStage) query.projectStage = filters.projectStage
  if (filters.authorRole) query.authorRole = filters.authorRole

  if (and.length) query.$and = and
  return query
}

export async function listPosts(filters: PostFilters, page = 1, limit = 20, sort: PostSort = 'newest') {
  const query = buildListQuery(filters)
  const skip = (page - 1) * limit
  const spec = SORT_SPECS[sort === 'relevance' ? 'newest' : sort]
  const [posts, total] = await Promise.all([
    Post.find(query).sort(spec).skip(skip).limit(limit),
    Post.countDocuments(query),
  ])
  return { posts, total, page, limit, pages: Math.ceil(total / limit) }
}
```

- [ ] **Step 5: Controller’ı uygula** — `postController.ts` `listPosts`:

```ts
import { POST_SORTS, type PostSort } from '../services/postService'

export const listPosts = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const { domain, expertise, city, country, location, projectStage, status, search, authorRole, mine } = req.query
  const page  = Math.max(1, parseInt(req.query.page  as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
  const sort: PostSort = POST_SORTS.includes(req.query.sort as PostSort) ? req.query.sort as PostSort : 'newest'

  const isAdmin = req.userRole === 'admin'
  const isMine = mine === 'true'
  const forceScopeToOwn = !isAdmin && (status as string) === 'draft'

  const result = await postService.listPosts(
    {
      domain: domain as string,
      expertise: expertise as string,
      city: city as string,
      country: country as string,
      location: location as string,
      projectStage: projectStage as string,
      authorId: (isMine || forceScopeToOwn) ? req.userId : undefined,
      status: isMine ? undefined : (status as string),
      search: search as string,
      authorRole: authorRole as string,
    },
    page,
    limit,
    sort,
  )
  res.json({ success: true, data: result })
})
```

- [ ] **Step 6: İndeksleri ekle** — `backend/models/Post.ts` mevcut indekslerin altına:

```ts
// Listing: the default feed filters on status and sorts by recency or expiry; "mine" sorts by recency.
PostSchema.index({ status: 1, createdAt: -1, _id: -1 })
PostSchema.index({ status: 1, expiryDate: 1, _id: 1 })
PostSchema.index({ authorId: 1, createdAt: -1, _id: -1 })
```

- [ ] **Step 7: Testleri çalıştır**

Run: `cd backend && npx vitest run tests/postListing.test.ts tests/posts.test.ts`
Expected: PASS (mevcut `posts.test.ts` pagination/draft testleri dahil).

- [ ] **Step 8: Commit**

```bash
git add backend/services/postService.ts backend/controllers/postController.ts backend/models/Post.ts backend/tests/helpers.ts backend/tests/postListing.test.ts
git commit -m "feat(api): server-side sort, location and partial search for post listing"
```

---

### Task 2: Backend — “En iyi eşleşme” sıralaması sunucuda (iki aşamalı)

Öneri sistemlerindeki standart kalıp: **aday üretimi** (filtreye uyan en yeni N ilan) + **puanlama** (kurala dayalı skor) + sayfalama. Yapay zekâ sıralamayı belirlemez; istemci yalnızca görünen sayfanın ilk 10 ilanına yapay zekâ açıklaması ekler (bugünkü `/ai/matches` akışı).

**Files:**
- Create: `backend/utils/matchScore.ts`
- Modify: `backend/services/postService.ts` (listPosts relevance dalı)
- Modify: `backend/controllers/postController.ts` (izleyici profili)
- Test: `backend/tests/matchScore.test.ts`, `backend/tests/postListing.test.ts`

**Interfaces:**
- Consumes: `buildListQuery`, `SORT_SPECS`, `PostSort` (Task 1).
- Produces: `matchScore(post: MatchablePost, viewer: MatchViewer): number` (0-82, frontend `getCombinedMatchScore` taban puanıyla aynı); `interface MatchViewer { id; role; city?; country?; expertiseTags? }`; relevance yanıtında her ilanda `matchScore: number`; `export const RELEVANCE_CANDIDATES = 1000`; `listPosts(filters, page, limit, sort, viewer?)`.

- [ ] **Step 1: Birim testini yaz** — `backend/tests/matchScore.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { matchScore } from '../utils/matchScore'

const viewer = { id: 'me', role: 'engineer', city: 'Berlin', country: 'Germany', expertiseTags: ['machine learning', 'Cardiology'] }
const post = {
  authorId: 'other', authorRole: 'healthcare_professional', status: 'active', city: 'Berlin', country: 'Germany',
  title: 'ECG triage', expertiseRequired: 'Machine learning', description: 'Arrhythmia', domain: 'Cardiology', domains: ['Cardiology'],
}

describe('matchScore (mirrors frontend getCombinedMatchScore without AI)', () => {
  it('adds city, cross-role, expertise and domain points, capped at 82', () => {
    // 18 city + 22 cross-role + min(38, 14 + 2*8) expertise + 12 domain = 82 (cap)
    expect(matchScore(post, viewer)).toBe(82)
  })

  it('gives 0 for the viewer\'s own post or a non-active post', () => {
    expect(matchScore({ ...post, authorId: 'me' }, viewer)).toBe(0)
    expect(matchScore({ ...post, status: 'expired' }, viewer)).toBe(0)
  })

  it('counts country only when the city differs', () => {
    const unrelated = { ...post, city: 'Munich', title: 'x', expertiseRequired: 'x', description: 'x', domain: 'x', domains: ['x'] }
    expect(matchScore(unrelated, viewer)).toBe(8 + 22)
  })
})
```

- [ ] **Step 2: Çalıştır, başarısız olduğunu gör**

Run: `cd backend && npx vitest run tests/matchScore.test.ts`
Expected: FAIL — `Cannot find module '../utils/matchScore'`.

- [ ] **Step 3: Puanlamayı uygula** — `backend/utils/matchScore.ts` (mantık `frontend/src/utils/matchPosts.ts:19-39, 132-168` ile birebir):

```ts
export interface MatchViewer { id: string; role: string; city?: string; country?: string; expertiseTags?: string[] }
export interface MatchablePost {
  authorId: string; authorRole: string; status: string; city?: string; country?: string
  title: string; expertiseRequired: string; description: string; domain?: string; domains?: string[]
}

const normalize = (value = '') => value.trim().toLowerCase()
const tokenize = (value: string) => normalize(value).split(/[^a-z0-9ğüşöçıİĞÜŞÖÇ]+/i).filter(t => t.length >= 3)
const postDomains = (post: MatchablePost) => (post.domains?.length ? post.domains : post.domain ? [post.domain] : [])

function expertiseHits(post: MatchablePost, viewer: MatchViewer) {
  const haystack = normalize(`${post.title} ${post.expertiseRequired} ${post.description} ${postDomains(post).join(' ')}`)
  const haystackTokens = new Set(tokenize(haystack))
  return (viewer.expertiseTags ?? []).map(tag => tag.trim()).filter(tag => {
    if (tag.length < 2) return false
    if (haystack.includes(normalize(tag))) return true
    return tokenize(tag).some(token => haystackTokens.has(token))
  })
}

/** Rule-based relevance (0-82). Keep in step with frontend/src/utils/matchPosts.ts getCombinedMatchScore. */
export function matchScore(post: MatchablePost, viewer: MatchViewer): number {
  if (viewer.id === post.authorId || post.status !== 'active') return 0
  let score = 0
  const sameCity = normalize(viewer.city) && normalize(viewer.city) === normalize(post.city)
  if (sameCity) score += 18
  else if (normalize(viewer.country) && normalize(viewer.country) === normalize(post.country)) score += 8

  const crossRole = (viewer.role === 'engineer' && post.authorRole === 'healthcare_professional')
    || (viewer.role === 'healthcare_professional' && post.authorRole === 'engineer')
  if (crossRole) score += 22

  const hits = expertiseHits(post, viewer)
  if (hits.length) score += Math.min(38, 14 + hits.length * 8)

  const expertiseTokens = new Set((viewer.expertiseTags ?? []).flatMap(tokenize))
  if (postDomains(post).flatMap(tokenize).some(t => expertiseTokens.has(t))) score += 12

  return Math.min(82, score)
}
```

- [ ] **Step 4: Birim testlerini çalıştır**

Run: `cd backend && npx vitest run tests/matchScore.test.ts`
Expected: PASS.

- [ ] **Step 5: Uç nokta testlerini ekle** — `backend/tests/postListing.test.ts` sonuna:

```ts
describe('GET /api/posts?sort=relevance', () => {
  it('ranks the best match first even when it is older', async () => {
    const author = await createUser({ role: 'healthcare_professional' })
    await createPublishedPost(author.token, { title: 'Strong match', city: 'Berlin', country: 'Germany', domain: 'Cardiology', expertiseRequired: 'Machine learning' })
    await createPublishedPost(author.token, { title: 'Weak match', city: 'Lima', country: 'Peru', domain: 'Dermatology', expertiseRequired: 'Pottery' })
    const viewer = await createUser({ role: 'engineer', city: 'Berlin', country: 'Germany', expertiseTags: ['machine learning'] })

    const res = await api.get('/api/posts?sort=relevance').set('Authorization', `Bearer ${viewer.token}`)
    expect(titles(res)[0]).toBe('Strong match')
    expect(res.body.data.posts[0].matchScore).toBeGreaterThan(res.body.data.posts[1].matchScore)
  })

  it('falls back to newest for a viewer with no profile to match against', async () => {
    const author = await createUser()
    await createPublishedPost(author.token, { title: 'Older fallback' })
    await createPublishedPost(author.token, { title: 'Newer fallback' })
    const viewer = await createUser({ expertiseTags: [], city: '', country: '' })

    const res = await api.get('/api/posts?sort=relevance&search=fallback').set('Authorization', `Bearer ${viewer.token}`)
    expect(res.status).toBe(200)
    expect(titles(res)).toEqual(['Newer fallback', 'Older fallback'])
  })
})
```

> `createUser` override’ları (`helpers.ts:19`) `role`, `city`, `country`, `expertiseTags` alanlarını kayıt gövdesine geçirmiyorsa, kayıttan sonra `User.updateOne({ email }, overrides)` ile ayarlayan bir satır ekle. Önce `helpers.ts:19-55` okunmalı.

- [ ] **Step 6: Relevance dalını uygula** — `postService.ts` `listPosts`:

```ts
import { matchScore, type MatchViewer } from '../utils/matchScore'

/** Newest N posts matching the filters are scored; older posts are not ranked by relevance. */
export const RELEVANCE_CANDIDATES = 1000

export async function listPosts(filters: PostFilters, page = 1, limit = 20, sort: PostSort = 'newest', viewer?: MatchViewer) {
  const query = buildListQuery(filters)
  const skip = (page - 1) * limit
  const hasProfile = Boolean(viewer && (viewer.expertiseTags?.length || viewer.city || viewer.country))

  // Two-stage ranking: take a bounded candidate set, score it, then page through the scored list.
  if (sort === 'relevance' && viewer && hasProfile) {
    const candidates = await Post.find(query).sort(SORT_SPECS.newest).limit(RELEVANCE_CANDIDATES)
    const ranked = candidates
      .map(doc => ({ doc, score: matchScore(doc.toObject() as never, viewer) }))
      .sort((a, b) => b.score - a.score) // stable: equal scores keep newest-first
    const total = ranked.length
    const posts = ranked.slice(skip, skip + limit).map(({ doc, score }) => ({ ...doc.toJSON(), matchScore: score }))
    return { posts, total, page, limit, pages: Math.ceil(total / limit) }
  }

  // Without a profile to match against, "best match" means nothing; newest is the honest fallback.
  const spec = SORT_SPECS[sort === 'relevance' ? 'newest' : sort]
  const [posts, total] = await Promise.all([
    Post.find(query).sort(spec).skip(skip).limit(limit),
    Post.countDocuments(query),
  ])
  return { posts, total, page, limit, pages: Math.ceil(total / limit) }
}
```

- [ ] **Step 7: Controller’da izleyici profilini geçir** — `postController.ts` `listPosts` içinde, `postService.listPosts(...)` çağrısından önce:

```ts
import User from '../models/User'

const viewerProfile = sort === 'relevance'
  ? await User.findById(req.userId).select('role city country expertiseTags').lean()
  : null
const viewer = viewerProfile
  ? { id: req.userId, role: viewerProfile.role, city: viewerProfile.city, country: viewerProfile.country, expertiseTags: viewerProfile.expertiseTags }
  : undefined
```

ve çağrıya beşinci argüman olarak `viewer` geçir: `postService.listPosts({ … }, page, limit, sort, viewer)`.

- [ ] **Step 8: Tüm backend testlerini çalıştır**

Run: `cd backend && npx vitest run`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add backend/utils/matchScore.ts backend/services/postService.ts backend/controllers/postController.ts backend/tests/matchScore.test.ts backend/tests/postListing.test.ts backend/tests/helpers.ts
git commit -m "feat(api): server-side best-match ranking with a bounded candidate window"
```

---

### Task 3: Backend — log filtresinde regex enjeksiyonunu kapat

**Files:**
- Modify: `backend/services/logService.ts:27`
- Test: `backend/tests/logs.test.ts`

**Interfaces:**
- Produces: `GET /api/logs?action=<exact value>` — `action` artık regex değil, `backend/constants/logActions.ts`’teki sabitlerle birebir eşleşir.

- [ ] **Step 1: Başarısız testi yaz** — `backend/tests/logs.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { api, createUser } from './helpers'
import User from '../models/User'

async function adminToken() {
  const admin = await createUser()
  await User.updateOne({ email: admin.email }, { role: 'admin' })
  const login = await api.post('/api/auth/login').send({ email: admin.email, password: admin.password })
  return login.body.data.token as string
}

describe('GET /api/logs — action filter', () => {
  it('treats the action as an exact value, not a regular expression', async () => {
    const token = await adminToken()
    // "(a+)+$" is a classic catastrophic-backtracking pattern; as a literal it matches nothing.
    const res = await api.get('/api/logs?action=(a%2B)%2B%24').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.logs).toEqual([])
  })

  it('still finds logs by their exact action', async () => {
    const token = await adminToken()
    const res = await api.get('/api/logs?action=login').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.logs.every((l: { action: string }) => l.action === 'login')).toBe(true)
  })
})
```

> `CreatedUser` (`helpers.ts:12-17`) `email`/`password` alanlarını döndürmüyorsa, test başında sabit bir e-posta/şifre ile `createUser({ email, password })` çağır.

- [ ] **Step 2: Çalıştır** — Run: `cd backend && npx vitest run tests/logs.test.ts` — Expected: ilk test FAIL (desen regex olarak yorumlanıyor, ör. `login_failed` gibi eylemler eşleşebilir).

- [ ] **Step 3: Uygula** — `logService.ts:27` satırını değiştir:

```ts
  // Actions are fixed constants (constants/logActions.ts): exact match, never a user-supplied regex.
  if (filters.action) query.action = filters.action
```

- [ ] **Step 4: Çalıştır** — Run: `cd backend && npx vitest run tests/logs.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/services/logService.ts backend/tests/logs.test.ts
git commit -m "fix(api): match log action filter exactly instead of as a regex"
```

---

### Task 4: Frontend — sorgu katmanı (TanStack Query) ve API fonksiyonları

**Files:**
- Modify: `frontend/package.json` (bağımlılık)
- Create: `frontend/src/lib/queryClient.ts`, `frontend/src/lib/postsApi.ts`, `frontend/src/hooks/usePostList.ts`, `frontend/src/hooks/usePost.ts`, `frontend/src/hooks/useDebouncedValue.ts`, `frontend/src/tests/renderWithQuery.tsx`
- Modify: `frontend/src/main.tsx`, `frontend/src/store/postStore.ts`
- Test: `frontend/src/tests/postsApi.test.ts`, `frontend/src/tests/useDebouncedValue.test.ts`

**Interfaces:**
- Produces:
  - `type PostSort = 'newest' | 'oldest' | 'expiring' | 'relevance'`
  - `interface PostListParams { page: number; limit: number; mine?: boolean; search?: string; domain?: string; projectStage?: string; status?: string; authorRole?: 'engineer' | 'healthcare_professional'; location?: string; sort?: PostSort }`
  - `interface PostListResult { posts: (Post & { matchScore?: number })[]; total: number; page: number; limit: number; pages: number }`
  - `fetchPostList(params: PostListParams, signal?: AbortSignal): Promise<PostListResult>`
  - `fetchPost(id: string, signal?: AbortSignal): Promise<Post>`
  - `normalisePost<T extends Post & { _id?: string }>(raw: T): T`
  - `usePostList(params: PostListParams)`, `usePost(id: string | undefined)`, `useDebouncedValue<T>(value: T, ms = 300): T`
  - `queryClient`, `postKeys = { all, list(params), detail(id) }`
  - `renderWithQuery(ui: ReactElement)` (test yardımcısı)

- [ ] **Step 1: Bağımlılığı ekle**

Run: `cd frontend && npm install @tanstack/react-query@^5`
Expected: `package.json` `dependencies` içinde `@tanstack/react-query`.

- [ ] **Step 2: Başarısız testleri yaz** — `frontend/src/tests/postsApi.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import api from '../lib/api'
import { fetchPostList } from '../lib/postsApi'

vi.mock('../lib/api', () => ({ default: { get: vi.fn() } }))

describe('fetchPostList', () => {
  it('sends only the filters that are set and normalises ids', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: { posts: [{ _id: 'p1', title: 'A' }], total: 1, page: 2, limit: 5, pages: 1 } } })

    const result = await fetchPostList({ page: 2, limit: 5, search: 'ecg', domain: '', mine: false, sort: 'expiring' })

    expect(api.get).toHaveBeenCalledWith('/posts?page=2&limit=5&search=ecg&sort=expiring', { signal: undefined })
    expect(result.posts[0].id).toBe('p1')
    expect(result.total).toBe(1)
  })
})
```

`frontend/src/tests/useDebouncedValue.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

describe('useDebouncedValue', () => {
  it('only publishes the last value after the user pauses', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 300), { initialProps: { v: 'k' } })
    rerender({ v: 'ka' })
    rerender({ v: 'kar' })
    act(() => { vi.advanceTimersByTime(299) })
    expect(result.current).toBe('k')
    act(() => { vi.advanceTimersByTime(1) })
    expect(result.current).toBe('kar')
    vi.useRealTimers()
  })
})
```

- [ ] **Step 3: Çalıştır** — Run: `cd frontend && npx vitest run src/tests/postsApi.test.ts src/tests/useDebouncedValue.test.ts` — Expected: FAIL (modüller yok).

- [ ] **Step 4: Uygula**

`frontend/src/lib/queryClient.ts`:

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    // Lists are cheap to refetch; 30 s keeps quick back-and-forth navigation instant.
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
})

export const postKeys = {
  all: ['posts'] as const,
  list: (params: object) => ['posts', 'list', params] as const,
  detail: (id: string) => ['posts', 'detail', id] as const,
}
```

`frontend/src/lib/postsApi.ts`:

```ts
import api from './api'
import type { Post } from '../types/post.types'

export type PostSort = 'newest' | 'oldest' | 'expiring' | 'relevance'

export interface PostListParams {
  page: number
  limit: number
  mine?: boolean
  search?: string
  domain?: string
  projectStage?: string
  status?: string
  authorRole?: 'engineer' | 'healthcare_professional'
  location?: string
  sort?: PostSort
}

export interface PostListResult {
  posts: (Post & { matchScore?: number })[]
  total: number
  page: number
  limit: number
  pages: number
}

export function normalisePost<T extends Post & { _id?: string }>(raw: T): T {
  return { ...raw, id: raw._id ?? raw.id }
}

export async function fetchPostList(params: PostListParams, signal?: AbortSignal): Promise<PostListResult> {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '' || value === false) continue
    query.set(key, String(value))
  }
  const { data } = await api.get<{ success: boolean; data: PostListResult }>(`/posts?${query}`, { signal })
  return { ...data.data, posts: data.data.posts.map(normalisePost) }
}

export async function fetchPost(id: string, signal?: AbortSignal): Promise<Post> {
  const { data } = await api.get<{ success: boolean; data: Post & { _id?: string } }>(`/posts/${id}`, { signal })
  return normalisePost(data.data)
}
```

`frontend/src/hooks/usePostList.ts`:

```ts
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchPostList, type PostListParams } from '../lib/postsApi'
import { postKeys } from '../lib/queryClient'

/** One cache entry per filter/sort/page combination; the previous page stays on screen while the next loads. */
export function usePostList(params: PostListParams) {
  return useQuery({
    queryKey: postKeys.list(params),
    queryFn: ({ signal }) => fetchPostList(params, signal),
    placeholderData: keepPreviousData,
  })
}
```

`frontend/src/hooks/usePost.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { fetchPost } from '../lib/postsApi'
import { postKeys } from '../lib/queryClient'

export function usePost(id: string | undefined) {
  return useQuery({
    queryKey: postKeys.detail(id ?? ''),
    queryFn: ({ signal }) => fetchPost(id as string, signal),
    enabled: Boolean(id),
  })
}
```

`frontend/src/hooks/useDebouncedValue.ts`:

```ts
import { useEffect, useState } from 'react'

export function useDebouncedValue<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return debounced
}
```

`frontend/src/tests/renderWithQuery.tsx`:

```tsx
import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function renderWithQuery(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}
```

`frontend/src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import './i18n'
import './styles/globals.css'
import App from './App'
import { queryClient } from './lib/queryClient'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
```

`frontend/src/store/postStore.ts` — yerel `normalise` fonksiyonunu kaldır, `normalisePost`’u içe aktar; her başarılı mutasyonun (`create`, `update`, `remove`, `publish`, `markPartnerFound`, `reopen`, `expressInterest`) son satırı olarak:

```ts
import { queryClient, postKeys } from '../lib/queryClient'
import { normalisePost } from '../lib/postsApi'

// …her mutasyonun başarı yolunun sonunda:
void queryClient.invalidateQueries({ queryKey: postKeys.all })
```

`posts`, `fetchPosts`, `pagination` şimdilik kalır (Task 6’da kaldırılır), böylece bu görev hiçbir sayfayı bozmaz.

- [ ] **Step 5: Çalıştır** — Run: `cd frontend && npx vitest run && npx tsc -b` — Expected: PASS, tip hatası yok.

- [ ] **Step 6: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/lib/queryClient.ts frontend/src/lib/postsApi.ts frontend/src/hooks/usePostList.ts frontend/src/hooks/usePost.ts frontend/src/hooks/useDebouncedValue.ts frontend/src/tests/renderWithQuery.tsx frontend/src/main.tsx frontend/src/store/postStore.ts frontend/src/tests/postsApi.test.ts frontend/src/tests/useDebouncedValue.test.ts
git commit -m "feat(web): add query layer for server-side post lists"
```

---

### Task 5: Frontend — İlanları Keşfet sunucu tarafı listelemeye geçer

**Files:**
- Modify: `frontend/src/pages/posts/PostListPage.tsx:91-235` (veri akışı), `:340-360` (`PostList` prop’ları)
- Test: `frontend/src/tests/PostListPage.test.tsx` (yeniden yazılır)

**Interfaces:**
- Consumes: `usePostList`, `useDebouncedValue`, `PostSort`, `renderWithQuery` (Task 4); URL parametreleri (`q, domain, stage, status, by, loc, page`, mevcut); `setPage` (mevcut, URL’ye yazar).

- [ ] **Step 1: Testleri sunucu tarafı davranışa göre yeniden yaz** — `frontend/src/tests/PostListPage.test.tsx` içeriğini değiştir:

```tsx
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import '../i18n'
import api from '../lib/api'
import PostListPage from '../pages/posts/PostListPage'
import { useAuthStore } from '../store/authStore'
import { renderWithQuery } from './renderWithQuery'

vi.mock('../lib/api', () => ({ default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }))
vi.mock('../lib/gemini', () => ({
  useSmartSuggestions: () => ({ suggestions: new Map(), isLoading: false, error: null, load: vi.fn(), reset: vi.fn() }),
}))

const ana = { id: 'ana', name: 'Ana', email: 'a@x.test', role: 'healthcare_professional' as const, institution: 'U', city: 'Lisbon', country: 'Portugal', expertiseTags: [], createdAt: '', isVerified: true, isSuspended: false, lastActive: '' }
const post = (id: string, title: string) => ({ _id: id, title, authorId: 'x', authorName: 'X', authorRole: 'engineer', domain: 'Cardiology', domains: ['Cardiology'], expertiseRequired: 'ML', description: title, projectStage: 'prototype', collaborationType: 'research_partner', confidentiality: 'public_pitch', city: 'Lisbon', country: 'Portugal', expiryDate: '2030-01-01', status: 'active', createdAt: '2026-09-01', updatedAt: '2026-09-01', interestCount: 0, meetingCount: 0 })

function CurrentSearch() { return <p data-testid="search">{useLocation().search}</p> }
const renderAt = (url: string) => renderWithQuery(
  <MemoryRouter initialEntries={[url]}><Routes><Route path="/posts" element={<><PostListPage /><CurrentSearch /></>} /></Routes></MemoryRouter>,
)
const lastRequest = () => vi.mocked(api.get).mock.calls.at(-1)?.[0] as string

describe('PostListPage (server-side)', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset()
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: { posts: [post('p1', 'Prototype A')], total: 137, page: 1, limit: 5, pages: 28 } } })
    useAuthStore.setState({ user: ana, isAuthenticated: true })
  })

  it('asks the server for the filters in the URL and shows the server total', async () => {
    renderAt('/posts?stage=prototype&by=clinician&page=3')
    await screen.findByText('Prototype A')
    expect(lastRequest()).toContain('projectStage=prototype')
    expect(lastRequest()).toContain('authorRole=healthcare_professional')
    expect(lastRequest()).toContain('page=3')
    expect(screen.getByText(/137/)).toBeInTheDocument()
  })

  it('sends one search request after the user stops typing', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    renderAt('/posts')
    await screen.findByText('Prototype A')
    const before = vi.mocked(api.get).mock.calls.length
    const box = screen.getByRole('searchbox')
    fireEvent.change(box, { target: { value: 'e' } })
    fireEvent.change(box, { target: { value: 'ec' } })
    fireEvent.change(box, { target: { value: 'ecg' } })
    await vi.advanceTimersByTimeAsync(350)
    await waitFor(() => expect(vi.mocked(api.get).mock.calls.length).toBe(before + 1))
    expect(lastRequest()).toContain('search=ecg')
    vi.useRealTimers()
  })

  it('moves to the last real page when the URL points past the end', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: { posts: [], total: 6, page: 9, limit: 5, pages: 2 } } })
    renderAt('/posts?page=9')
    await waitFor(() => expect(screen.getByTestId('search')).toHaveTextContent('page=2'))
  })
})
```

- [ ] **Step 2: Çalıştır** — Run: `cd frontend && npx vitest run src/tests/PostListPage.test.tsx` — Expected: FAIL (sayfa hâlâ paylaşılan store’u ve tarayıcı içi filtrelemeyi kullanıyor).

- [ ] **Step 3: Veri akışını değiştir** — `PostListPage.tsx`:

1. `usePostStore()` satırından `posts, fetchPosts, isLoading`’i kaldır; `remove` kalır.
2. `fetchPosts({ limit: 100, mine: mineOnly, filters: {} })` `useEffect`’ini kaldır.
3. `directoryPosts` `useMemo` bloğunu (tarayıcıda filtre + sıralama) ve `totalPages`/`currentPage`/`paginatedPosts` hesaplarını kaldır; yerine:

```tsx
import { usePostList } from '../../hooks/usePostList'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import type { PostSort } from '../../lib/postsApi'

const SORT_TO_SERVER: Record<SortMode, PostSort> = { best: 'relevance', newest: 'newest', oldest: 'oldest', expiring: 'expiring' }

// Inside the component:
const debouncedSearch = useDebouncedValue(search.trim(), 300)
const debouncedLocation = useDebouncedValue(location.trim(), 300)
const listQuery = usePostList({
  page,
  limit: POSTS_PER_PAGE,
  mine: mineOnly,
  search: debouncedSearch,
  location: debouncedLocation,
  domain,
  projectStage: stage,
  status,
  authorRole: postedBy === 'Engineer' ? 'engineer' : postedBy === 'Healthcare Professional' ? 'healthcare_professional' : undefined,
  sort: SORT_TO_SERVER[sort],
})
const pagePosts = useMemo(() => listQuery.data?.posts ?? [], [listQuery.data])
const totalPosts = listQuery.data?.total ?? 0
const totalPages = Math.max(1, listQuery.data?.pages ?? 1)
const directoryPosts = useMemo(
  () => pagePosts.map(post => toDirectoryPost(post, user, t, suggestions.get(post.id))),
  [pagePosts, suggestions, t, user],
)

// A page number from an old link (or after the last post on the last page was deleted) must not leave an empty page.
useEffect(() => {
  const pages = listQuery.data?.pages ?? 0
  if (pages > 0 && page > pages) setPage(pages)
}, [listQuery.data, page])
```

4. Yapay zekâ önerisini yalnızca görünen sayfa için iste: mevcut `loadSmartSuggestions(user, posts)` çağrısını `loadSmartSuggestions(user, pagePosts)` yap; etki bağımlılıklarında `posts` → `pagePosts`; koşul `posts.length === 0` → `pagePosts.length === 0`.
5. `PostList` çağrısında: `posts={directoryPosts}`, `totalPosts={totalPosts}`, `isLoading={listQuery.isPending}`, `page={page}`, `totalPages={totalPages}`.
6. `locationSuggestions` artık tüm ilanlardan türetilemez: öneri listesini `src/data/locations.ts`’teki sabit şehir/ülke listesinden besle (bileşen zaten bu veriyi `CountryCityPicker`’da kullanıyor).
7. Kayıtlı arama (`saveCurrentSearch`) değişmez; `authorRole` eşlemesi zaten aynı.

- [ ] **Step 4: Çalıştır** — Run: `cd frontend && npx vitest run src/tests/PostListPage.test.tsx && npx tsc -b` — Expected: PASS.

- [ ] **Step 5: Tarayıcıda doğrula** — `npm run dev`; 100’den fazla ilanı olan bir veritabanında (`backend/scripts/seed-realistic-posts.ts` ile doldurulmuş): “Kardiyoloji” filtresi 100. sıradan sonraki bir ilanı da buluyor; sayaç gerçek toplamı gösteriyor; sayfa değiştirirken liste boşalıp titremiyor; bir ilandan Geri ile dönünce filtre ve sayfa korunuyor.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/posts/PostListPage.tsx frontend/src/tests/PostListPage.test.tsx
git commit -m "feat(web): browse posts with server-side filters, sort and paging"
```

---

### Task 6: Frontend — paylaşılan `posts` dizisini kaldır (Dashboard, İlan detayı, açılış)

**Files:**
- Modify: `frontend/src/pages/dashboard/DashboardPage.tsx:21-43`
- Modify: `frontend/src/pages/posts/PostDetailPage.tsx:52-72`
- Modify: `frontend/src/App.tsx:13, 26-28`
- Modify: `frontend/src/store/postStore.ts` (liste alanlarını kaldır)
- Test: `frontend/src/tests/DashboardCounts.test.tsx` (yeni), `frontend/src/tests/PostDetailPage.test.tsx` (mevcut, sağlayıcıyla sarılır)

**Interfaces:**
- Consumes: `usePostList`, `usePost`, `renderWithQuery` (Task 4).

- [ ] **Step 1: Başarısız testi yaz** — `frontend/src/tests/DashboardCounts.test.tsx`:

```tsx
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '../i18n'
import api from '../lib/api'
import DashboardPage from '../pages/dashboard/DashboardPage'
import { useAuthStore } from '../store/authStore'
import { useMeetingStore } from '../store/meetingStore'
import { renderWithQuery } from './renderWithQuery'

vi.mock('../lib/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

describe('Dashboard counts', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockImplementation(async (url: string) =>
      url.startsWith('/posts?')
        ? { data: { success: true, data: { posts: [], total: 142, page: 1, limit: 5, pages: 29 } } }
        : { data: { success: true, data: null } })
    useAuthStore.setState({ user: { id: 'me', name: 'Me', role: 'engineer' } as never, isAuthenticated: true })
    useMeetingStore.setState({ meetings: [], fetchByUser: vi.fn() })
  })

  it('shows the real number of my posts from the server total, not the length of a capped list', async () => {
    renderWithQuery(<MemoryRouter><DashboardPage /></MemoryRouter>)
    expect(await screen.findByText('142')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Çalıştır** — Run: `cd frontend && npx vitest run src/tests/DashboardCounts.test.tsx` — Expected: FAIL.

- [ ] **Step 3: Uygula**

`DashboardPage.tsx` — `usePostStore()` ve `fetchPosts({ limit: 100, mine: true })` yerine:

```tsx
import { usePostList } from '../../hooks/usePostList'

const mine = usePostList({ page: 1, limit: 5, mine: true, sort: 'newest' })
const recentPosts = mine.data?.posts ?? []
const myPostCount = mine.data?.total ?? 0
const activeMine = usePostList({ page: 1, limit: 1, mine: true, status: 'active' })
const activeListings = activeMine.data?.total ?? 0
```

`posts.length` kullanımları → `myPostCount`; son ilanlar listesi → `recentPosts`; eski `activeListings` hesabı → yukarıdaki sorgu. (`mine: true` ile `status` backend’de yazarın kendi ilanlarında filtre olarak uygulanır: `postService.ts` `authorId` dalı.)

`PostDetailPage.tsx` — `posts`/`getById`/`fetchPosts` yerine:

```tsx
import { usePost } from '../../hooks/usePost'

const { data: post, isPending, isError } = usePost(id)
```

Yükleme sırasında mevcut yükleniyor görünümü (`isPending`); “bulunamadı/yüklenemedi” ekranı `isError` durumunda (mevcut `fetchError` dalı yerine). Mutasyonlar (`publish`, `markPartnerFound`, `reopen`) store’dan çağrılmaya devam eder ve Task 4’teki geçersizleştirme sayesinde detay otomatik yenilenir.

`App.tsx` — `fetchPosts` seçicisini ve `if (isAuthenticated) fetchPosts()` etkisini kaldır (her sayfa kendi sorgusunu yapar).

`postStore.ts` — `posts`, `filters`, `pagination`, `isLoading`, `fetchPosts`, `getById`, `setFilters` ve `applyFilters` alanlarını kaldır; yalnızca mutasyonlar ve geçersizleştirme kalır. `npx tsc -b` bu alanları hâlâ kullanan yerleri listeler (ör. `PostEditPage.tsx:18` `getById` → `usePost(id)`); her birini ilgili hook’a çevir. Mevcut `PostDetailPage.test.tsx` ve bu alanları kuran diğer testlerde `usePostStore.setState({ posts })` yerine `api.get` mock’u ve `renderWithQuery` kullan.

- [ ] **Step 4: Çalıştır** — Run: `cd frontend && npx vitest run && npx tsc -b` — Expected: tüm testler PASS, tip hatası yok.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/dashboard/DashboardPage.tsx frontend/src/pages/posts/PostDetailPage.tsx frontend/src/pages/posts/PostEditPage.tsx frontend/src/App.tsx frontend/src/store/postStore.ts frontend/src/tests
git commit -m "refactor(web): each page owns its post query; drop the shared posts array"
```

---

### Task 7: Admin — İlanlar, Kullanıcılar ve Loglar sunucu tarafı

**Files:**
- Create: `frontend/src/lib/adminApi.ts`
- Modify: `frontend/src/pages/admin/AdminPage.tsx` (veri çekme `:686-713`; İlanlar, Kullanıcılar, Loglar görünümleri)
- Test: `frontend/src/tests/AdminServerLists.test.tsx` (yeni), `frontend/src/tests/AdminUsersPaging.test.tsx` (güncellenir)

**Interfaces:**
- Consumes: `usePostList`, `useDebouncedValue`, `queryClient`, `renderWithQuery` (Task 4).
- Produces: `fetchAdminUsers({ page, limit, search }, signal) → { users: User[]; total: number }`; `fetchLogs({ page, limit, action, result }, signal) → { logs: ActivityLog[]; total: number; page: number; limit: number }`.

Kapsam kararı: **Genel Bakış** sekmesindeki büyüme grafiği ve “son kullanıcılar” bugünkü gibi kalır (en fazla 500 kayıt, yalnızca özet amaçlı). Kalıcı çözüm, grafiğin `/auth/stats` uç noktasına taşınmasıdır; bu planın dışında, ayrı bir iş olarak.

- [ ] **Step 1: Başarısız testi yaz** — `frontend/src/tests/AdminServerLists.test.tsx`:

```tsx
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '../i18n'
import api from '../lib/api'
import AdminPage from '../pages/admin/AdminPage'
import { useAuthStore } from '../store/authStore'
import { useMeetingStore } from '../store/meetingStore'
import { renderWithQuery } from './renderWithQuery'

vi.mock('../lib/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }))
vi.mock('../lib/socket', () => ({ connectSocket: vi.fn(), disconnectSocket: vi.fn(), getSocket: vi.fn() }))

describe('admin lists use the server', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockImplementation(async (url: string, config?: { params?: Record<string, unknown> }) => {
      if (url.startsWith('/posts?')) return { data: { success: true, data: { posts: [], total: 1234, page: 1, limit: 20, pages: 62 } } }
      if (url === '/auth/users') return { data: { success: true, data: { users: [], total: config?.params?.search ? 3 : 900 } } }
      return { data: { success: true, data: { logs: [], total: 0, page: 1, limit: 50 } } }
    })
    useAuthStore.setState({ user: { id: 'admin', role: 'admin', name: 'A' } as never, isAuthenticated: true })
    useMeetingStore.setState({ meetings: [], fetchByUser: vi.fn() })
  })

  it('shows the real number of posts, not the 100 the list used to stop at', async () => {
    renderWithQuery(<MemoryRouter><AdminPage /></MemoryRouter>)
    fireEvent.click(screen.getAllByRole('button', { name: 'Posts' })[0])
    expect(await screen.findByText(/1,?234/)).toBeInTheDocument()
  })

  it('searches users on the server', async () => {
    renderWithQuery(<MemoryRouter><AdminPage /></MemoryRouter>)
    fireEvent.click(screen.getAllByRole('button', { name: 'Users' })[0])
    fireEvent.change(await screen.findByRole('searchbox'), { target: { value: 'ayse' } })
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/auth/users', expect.objectContaining({ params: expect.objectContaining({ search: 'ayse' }) })))
  })
})
```

- [ ] **Step 2: Çalıştır** — Run: `cd frontend && npx vitest run src/tests/AdminServerLists.test.tsx` — Expected: FAIL.

- [ ] **Step 3: Uygula**

`frontend/src/lib/adminApi.ts`:

```ts
import api from './api'
import type { User } from '../types/auth.types'
import type { ActivityLog } from '../types/common.types'

export async function fetchAdminUsers(params: { page: number; limit: number; search?: string }, signal?: AbortSignal) {
  const { data } = await api.get<{ success: boolean; data: { users: (User & { _id?: string })[]; total: number } }>('/auth/users', {
    params: { page: params.page, limit: params.limit, search: params.search || undefined },
    signal,
  })
  return { users: data.data.users.map(u => ({ ...u, id: u._id ?? u.id })), total: data.data.total }
}

export async function fetchLogs(params: { page: number; limit: number; action?: string; result?: string }, signal?: AbortSignal) {
  const { data } = await api.get<{ success: boolean; data: { logs: (ActivityLog & { _id?: string })[]; total: number; page: number; limit: number } }>('/logs', {
    params: { page: params.page, limit: params.limit, action: params.action || undefined, result: params.result || undefined },
    signal,
  })
  return { ...data.data, logs: data.data.logs.map(l => ({ ...l, id: l._id ?? l.id })) }
}
```

`AdminPage.tsx`:

1. `useEffect(() => { fetchPosts({ limit: 200 }) }, …)` ve `useEffect(() => { fetchPosts({ limit: 100 }) }, …)` satırlarını sil (yinelenen istek).
2. **İlanlar:** `const [postsPage, setPostsPage] = useState(1)`; `const adminPosts = usePostList({ page: postsPage, limit: 20, sort: 'newest' })`; tablo `adminPosts.data?.posts ?? []`; başlıktaki sayı `adminPosts.data?.total ?? 0`; alta Kullanıcılar sekmesindeki sayfalama bileşeninin aynısı (`pages = adminPosts.data?.pages`). İlan kaldırma sonrası liste Task 4’teki geçersizleştirme ile kendiliğinden yenilenir.
3. **Kullanıcılar:** `const userSearch = useDebouncedValue(userQuery.trim(), 300)`;

```tsx
const usersQuery = useQuery({
  queryKey: ['admin', 'users', { page: usersPage, limit: usersPerPage, search: userSearch }],
  queryFn: ({ signal }) => fetchAdminUsers({ page: usersPage, limit: usersPerPage, search: userSearch }, signal),
  placeholderData: keepPreviousData,
})
const pageUsers = usersQuery.data?.users ?? []
const usersTotal = usersQuery.data?.total ?? 0
const usersTotalPages = Math.max(1, Math.ceil(usersTotal / usersPerPage))
```

Tarayıcı içi `filteredUsers`/`paginatedUsers` yerine `pageUsers`; “N kullanıcıdan M gösteriliyor” metni `usersTotal`’dan. Askıya alma/silme sonrası: `queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })`. Arama değişince `setUsersPage(1)` (mevcut etki korunur).
4. **Loglar:** `logAction`/`logResult` seçimleri ve yeni `logsPage` sunucuya gider:

```tsx
const logsQuery = useQuery({
  queryKey: ['admin', 'logs', { page: logsPage, action: logAction, result: logResult }],
  queryFn: ({ signal }) => fetchLogs({ page: logsPage, limit: 50, action: logAction, result: logResult }, signal),
  placeholderData: keepPreviousData,
  enabled: view === 'logs' || view === 'overview',
})
```

Eylem seçenekleri (`uniqueActions`) artık yüklenmiş kayıtlardan değil, `backend/constants/logActions.ts` ile aynı değerleri içeren yeni `frontend/src/constants/logActions.ts` sabit listesinden gelir (yeni uç nokta eklenmez). Loglar tablosuna sayfalama eklenir.
5. Mevcut `AdminUsersPaging.test.tsx`: `render` → `renderWithQuery`; `api.get` mock’u `/auth/users` isteğinde `params.page`/`params.limit`’e göre `users` dizisinden ilgili dilimi ve `total: 30` döndürsün (sayfa boyutu 50’ye çıkınca tek istekte 30 satır).

- [ ] **Step 4: Çalıştır** — Run: `cd frontend && npx vitest run && npx tsc -b` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/adminApi.ts frontend/src/constants/logActions.ts frontend/src/pages/admin/AdminPage.tsx frontend/src/tests/AdminServerLists.test.tsx frontend/src/tests/AdminUsersPaging.test.tsx
git commit -m "feat(admin): server-side paging, search and totals for posts, users and logs"
```

---

## Doğrulama ve yayına alma

- [ ] 1.000 ilanlık bir test veritabanında (`backend/scripts/seed-realistic-posts.ts`): İlanları Keşfet’te son sayfaya gidilebiliyor; “Kardiyoloji” + “Almanya” birlikte doğru sonuç veriyor; “En iyi eşleşme” ilk sayfası 1 saniyenin altında dönüyor.
- [ ] MongoDB’de `db.posts.find({ status: { $ne: 'draft' } }).sort({ createdAt: -1, _id: -1 }).explain('executionStats')` çıktısında yeni bileşik indeksle `IXSCAN` görülüyor; `COLLSCAN` + bellek içi `SORT` görülmüyor.
- [ ] Render’da yeni indeksler ilk açılışta otomatik oluşur (Mongoose `autoIndex`); üretimde `autoIndex` kapalıysa indeksleri bir kez elle oluştur.
- [ ] Ayrı PR’lar: **PR 1** Task 1-3 (backend; yeni parametreler isteğe bağlı olduğu için mevcut istemciyi bozmaz), **PR 2** Task 4-6 (istemci), **PR 3** Task 7 (admin).

## Bilinen sınırlar (bilinçli kararlar)

- **Relevance penceresi:** “En iyi eşleşme” filtreye uyan en yeni 1.000 ilanı puanlar; daha eski ilanlar bu sıralamada yer almaz (diğer sıralamalarda ve aramada yer alır). 10.000+ aktif ilanda puan, veritabanında saklanan ve ilan/profil değişince güncellenen bir alana taşınmalıdır.
- **Arama:** Regex araması ~50.000 ilana kadar yeterli hızdadır; ötesinde MongoDB Atlas Search (Türkçe dil çözümleyici, önek arama, yazım hatası toleransı) önerilir.
- **Türkçe büyük/küçük harf:** MongoDB `i` bayrağı “İ/i” ve “I/ı” eşlemesini Türkçe kurallarla yapmaz (“istanbul” ↔ “İstanbul”). Gerekirse arama alanları için Türkçe `collation` veya Atlas Search kullanılmalıdır.
- **Offset sayfalama:** Sayfa numaralı arayüz için offset (skip/limit) seçildi. Log gibi yalnızca eklenen ve çok büyüyen listelerde, sonsuz kaydırmaya geçilirse imleç (cursor/keyset) sayfalama tercih edilmelidir.
- **Yeni bağımlılık:** `@tanstack/react-query` (~13 KB gzip). Alternatifi, aynı işi yapan küçük bir özel hook’tur; ancak önbellek anahtarı, istek iptali, önceki sayfayı ekranda tutma ve mutasyon sonrası geçersizleştirmeyi yeniden yazmak gerekir. Sektör standardı olduğu için kütüphane seçildi.
