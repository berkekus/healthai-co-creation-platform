import Post, { IPost } from '../models/Post'
import { FilterQuery, Types } from 'mongoose'
import Meeting from '../models/Meeting'
import SavedSearch from '../models/SavedSearch'
import { pushNotification } from './notificationService'
import { makeError } from '../utils/AppError'
import { MAX_POST_DOMAINS, domainFilterVariants, escapeRegex } from '../constants/domains'

/**
 * A post's domains: one to three distinct, non-empty names. Older clients send
 * a single `domain`; newer ones send `domains`, which wins when both are present.
 */
export function resolveDomains(domains: unknown, domain: unknown): string[] {
  const raw: unknown[] = Array.isArray(domains) && domains.length > 0
    ? domains
    : (typeof domain === 'string' && domain.trim() ? [domain] : [])

  const cleaned: string[] = []
  for (const value of raw) {
    if (typeof value !== 'string' || !value.trim()) throw makeError('Each domain must be a non-empty name', 400)
    const name = value.trim()
    if (name.length > 80) throw makeError('Domain names must be 80 characters or fewer', 400)
    if (!cleaned.some(existing => existing.toLowerCase() === name.toLowerCase())) cleaned.push(name)
  }
  if (cleaned.length === 0) throw makeError('Choose at least one domain', 400)
  if (cleaned.length > MAX_POST_DOMAINS) throw makeError(`Choose no more than ${MAX_POST_DOMAINS} domains`, 400)
  return cleaned
}

function postDomains(post: Pick<IPost, 'domain' | 'domains'>): string[] {
  return post.domains?.length ? post.domains : [post.domain]
}

export interface PostFilters {
  domain?: string
  expertise?: string
  city?: string
  country?: string
  projectStage?: string
  status?: string
  search?: string
  authorRole?: string
  /** Giriş yapan kullanıcının kendi post'larını (draft dahil) görmesi için */
  authorId?: string
}

export async function createPost(data: {
  title: string
  authorId: string
  authorName: string
  authorRole: IPost['authorRole']
  domains: string[]
  expertiseRequired: string
  description: string
  projectStage: IPost['projectStage']
  collaborationType: IPost['collaborationType']
  levelOfCommitment: IPost['levelOfCommitment']
  confidentiality: IPost['confidentiality']
  city: string
  country: string
  expiryDate: string
}) {
  const post = await Post.create({
    ...data,
    domain: data.domains[0],
    status: 'draft',
    interestCount: 0,
    meetingCount: 0,
  })
  return post
}

export async function getPostById(id: string, requesterId: string, isAdmin: boolean) {
  const post = await Post.findById(id)
  if (!post) throw makeError('Post not found', 404)
  if (post.status === 'draft' && !isAdmin && post.authorId.toString() !== requesterId) {
    throw makeError('Forbidden', 403)
  }
  return post
}

export async function listPosts(filters: PostFilters, page = 1, limit = 20) {
  const query: FilterQuery<IPost> = {}

  if (filters.authorId) {
    query.authorId = filters.authorId
    // When scoped to a specific author, allow further filtering by status
    if (filters.status) query.status = filters.status
  } else if (filters.status) {
    query.status = filters.status
  } else {
    query.status = { $ne: 'draft' }
  }

  if (filters.domain) {
    // Match any of the post's domains, and treat merged legacy names as the
    // canonical one. Names contain regex characters, e.g. "Intensive Care (ICU)".
    const names = domainFilterVariants(filters.domain).map(name => new RegExp(`^${escapeRegex(name)}$`, 'i'))
    query.$or = [{ domains: { $in: names } }, { domain: { $in: names } }]
  }
  if (filters.expertise) query.expertiseRequired = { $regex: escapeRegex(filters.expertise), $options: 'i' }
  if (filters.city) query.city = { $regex: `^${escapeRegex(filters.city)}$`, $options: 'i' }
  if (filters.country) query.country = { $regex: `^${escapeRegex(filters.country)}$`, $options: 'i' }
  if (filters.projectStage) query.projectStage = filters.projectStage
  if (filters.authorRole) query.authorRole = filters.authorRole
  if (filters.search) {
    query.$text = { $search: filters.search }
  }

  const skip = (page - 1) * limit
  const [posts, total] = await Promise.all([
    Post.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Post.countDocuments(query),
  ])
  return { posts, total, page, limit, pages: Math.ceil(total / limit) }
}

const UPDATABLE_FIELDS = [
  'title', 'expertiseRequired', 'description',
  'projectStage', 'collaborationType', 'levelOfCommitment', 'confidentiality',
  'city', 'country', 'expiryDate',
] as const

type UpdatableField = typeof UPDATABLE_FIELDS[number]

export async function updatePost(id: string, requesterId: string, isAdmin: boolean, data: Partial<IPost>) {
  const post = await Post.findById(id)
  if (!post) throw makeError('Post not found', 404)
  if (!isAdmin && post.authorId.toString() !== requesterId) throw makeError('Forbidden', 403)

  if ('domains' in data || 'domain' in data) {
    const domains = resolveDomains(data.domains, data.domain)
    post.set('domains', domains)
    post.set('domain', domains[0])
  }
  for (const field of UPDATABLE_FIELDS) {
    if (field in data) post.set(field, data[field as UpdatableField])
  }
  await post.save()
  return post
}

async function notifySavedSearchSubscribers(post: IPost) {
  const domains = postDomains(post)
  const searches = await SavedSearch.find({ userId: { $ne: post.authorId } }).lean()

  await Promise.all(searches.map(async (search) => {
    const f = search.filters
    if (f.domain) {
      const wanted = domainFilterVariants(f.domain).map(name => name.toLowerCase())
      if (!domains.some(domain => wanted.includes(domain.toLowerCase()))) return
    }
    if (f.projectStage && f.projectStage !== post.projectStage) return
    if (f.authorRole && f.authorRole !== post.authorRole) return
    if (f.country && post.country.toLowerCase() !== f.country.toLowerCase()) return
    if (f.expertise && !post.expertiseRequired.toLowerCase().includes(f.expertise.toLowerCase())) return
    if (f.search) {
      const hay = [post.title, post.description, post.expertiseRequired, ...domains].join(' ').toLowerCase()
      if (!hay.includes(f.search.toLowerCase())) return
    }
    pushNotification({
      userId: search.userId.toString(),
      type: 'interest_received',
      contentKey: 'saved_search_match',
      metadata: { searchName: search.name, postTitle: post.title },
      title: 'Kayıtlı aramanızla eşleşen yeni ilan',
      body: `"${search.name}" — ${post.title}`,
      linkTo: `/posts/${post.id}`,
    }).catch(() => {})
  }))
}

export async function publishPost(id: string, requesterId: string) {
  const post = await Post.findById(id)
  if (!post) throw makeError('Post not found', 404)
  if (post.authorId.toString() !== requesterId) throw makeError('Forbidden', 403)

  post.status = 'active'
  await post.save()
  notifySavedSearchSubscribers(post).catch(() => {})
  return post
}

export async function markPartnerFound(id: string, requesterId: string) {
  const post = await Post.findById(id)
  if (!post) throw makeError('Post not found', 404)
  if (post.authorId.toString() !== requesterId) throw makeError('Forbidden', 403)
  if (!['active', 'meeting_scheduled', 'expired'].includes(post.status)) {
    throw makeError('Only a published post can be marked as Partner Found', 400)
  }

  post.status = 'partner_found'
  await post.save()

  // Close requests still waiting on the owner and tell each requester. A meeting
  // that already has a confirmed time is left alone — it is often the very
  // meeting with the partner who was found, and the owner can still cancel it.
  const openRequests = await Meeting.find({
    postId: id,
    status: { $in: ['pending', 'time_proposed'] },
  })
  await Promise.all(openRequests.map(async (meeting) => {
    meeting.status = 'cancelled'
    await meeting.save()
    pushNotification({
      userId: meeting.requesterId.toString(),
      type: 'partner_found',
      contentKey: 'partner_found',
      metadata: { postTitle: post.title },
      title: 'İşbirliği tamamlandı',
      body: `"${post.title}" için zaten bir işbirliği ortağı bulundu.`,
      linkTo: `/posts/${id}`,
    }).catch(() => {})
  }))

  return post
}

/**
 * Undoes "Partner Found". Requests that were closed stay closed; the post simply
 * accepts new ones again. An expired post needs a new future expiry date.
 */
export async function reopenPost(id: string, requesterId: string, newExpiryDate?: unknown) {
  const post = await Post.findById(id)
  if (!post) throw makeError('Post not found', 404)
  if (post.authorId.toString() !== requesterId) throw makeError('Forbidden', 403)
  if (post.status !== 'partner_found') throw makeError('Only a post marked as Partner Found can be reopened', 400)

  if (newExpiryDate !== undefined) {
    const parsed = typeof newExpiryDate === 'string' ? new Date(newExpiryDate) : new Date(NaN)
    if (Number.isNaN(parsed.getTime()) || parsed <= new Date()) {
      throw makeError('expiryDate must be a valid future date', 400)
    }
    post.expiryDate = parsed
  }
  if (post.expiryDate <= new Date()) {
    throw makeError('This post has expired. Choose a new expiry date to reopen it.', 400)
  }

  const scheduled = await Meeting.exists({ postId: id, status: 'confirmed' })
  post.status = scheduled ? 'meeting_scheduled' : 'active'
  await post.save()
  return post
}

export async function expressInterest(id: string, requesterId: string, requesterName: string) {
  const post = await Post.findById(id)
  if (!post) throw makeError('Post not found', 404)
  if (post.status !== 'active') throw makeError('Post is not accepting interest', 400)
  if (post.authorId.toString() === requesterId) throw makeError('Cannot express interest in your own post', 400)

  // $addToSet prevents duplicates; only increment count when user is newly added
  const updated = await Post.findOneAndUpdate(
    { _id: id, interestedUserIds: { $ne: new Types.ObjectId(requesterId) } },
    { $addToSet: { interestedUserIds: requesterId }, $inc: { interestCount: 1 } },
    { new: true }
  )

  // null means user already expressed interest — return unchanged post
  if (!updated) return post

  pushNotification({
    userId: post.authorId.toString(),
    type: 'interest_received',
    contentKey: 'post_interest_received',
    metadata: { actorName: requesterName, postTitle: post.title },
    title: 'Yeni ilgi',
    body: `${requesterName} "${post.title}" postunuza ilgi gösterdi.`,
    linkTo: `/posts/${id}`,
  }).catch(() => {})

  return updated
}

export async function deletePost(id: string, requesterId: string, isAdmin: boolean) {
  const post = await Post.findById(id)
  if (!post) throw makeError('Post not found', 404)
  if (!isAdmin && post.authorId.toString() !== requesterId) throw makeError('Forbidden', 403)

  await post.deleteOne()
}

// Yalnızca sayacı artır — durum değişikliği meetingService tarafından yönetilir
export async function incrementMeetingCount(postId: string) {
  await Post.findByIdAndUpdate(postId, { $inc: { meetingCount: 1 } })
}

// Mevcut meeting'lere bakarak post durumunu hesaplar ve günceller
export async function recomputePostStatus(postId: string) {
  const post = await Post.findById(postId)
  if (!post) return
  // Terminal durumları ve taslakları değiştirme
  if (post.status === 'partner_found' || post.status === 'expired' || post.status === 'draft') return

  const active = await Meeting.exists({
    postId,
    status: 'confirmed',
  })

  if (active) {
    post.status = 'meeting_scheduled'
  } else if (post.status === 'meeting_scheduled') {
    // Onaylı meeting kalmadıysa active'e geri dön
    post.status = 'active'
  }
  await post.save()
}
