import Post, { IPost } from '../models/Post'
import { FilterQuery, Types } from 'mongoose'
import Meeting from '../models/Meeting'
import SavedSearch from '../models/SavedSearch'
import { pushNotification } from './notificationService'
import { makeError } from '../utils/AppError'

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
  domain: string
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
  const post = await Post.create({ ...data, status: 'draft', interestCount: 0, meetingCount: 0 })
  return post
}

export async function getPostById(id: string) {
  const post = await Post.findById(id)
  if (!post) throw makeError('Post not found', 404)
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

  if (filters.domain) query.domain = { $regex: filters.domain, $options: 'i' }
  if (filters.expertise) query.expertiseRequired = { $regex: filters.expertise, $options: 'i' }
  if (filters.city) query.city = { $regex: `^${filters.city}$`, $options: 'i' }
  if (filters.country) query.country = { $regex: `^${filters.country}$`, $options: 'i' }
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
  'title', 'domain', 'expertiseRequired', 'description',
  'projectStage', 'collaborationType', 'levelOfCommitment', 'confidentiality',
  'city', 'country', 'expiryDate',
] as const

type UpdatableField = typeof UPDATABLE_FIELDS[number]

export async function updatePost(id: string, requesterId: string, isAdmin: boolean, data: Partial<IPost>) {
  const post = await Post.findById(id)
  if (!post) throw makeError('Post not found', 404)
  if (!isAdmin && post.authorId.toString() !== requesterId) throw makeError('Forbidden', 403)

  for (const field of UPDATABLE_FIELDS) {
    if (field in data) post.set(field, data[field as UpdatableField])
  }
  await post.save()
  return post
}

async function notifySavedSearchSubscribers(post: IPost) {
  const searches = await SavedSearch.find({
    userId: { $ne: post.authorId },
    ...(post.domain ? { 'filters.domain': { $in: [post.domain, ''] } } : {}),
  }).lean()

  await Promise.all(searches.map(async (search) => {
    const f = search.filters
    if (f.domain && f.domain !== post.domain) return
    if (f.projectStage && f.projectStage !== post.projectStage) return
    if (f.authorRole && f.authorRole !== post.authorRole) return
    if (f.country && post.country.toLowerCase() !== f.country.toLowerCase()) return
    if (f.expertise && !post.expertiseRequired.toLowerCase().includes(f.expertise.toLowerCase())) return
    if (f.search) {
      const hay = [post.title, post.description, post.expertiseRequired, post.domain].join(' ').toLowerCase()
      if (!hay.includes(f.search.toLowerCase())) return
    }
    pushNotification({
      userId: search.userId.toString(),
      type: 'interest_received',
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

  post.status = 'partner_found'
  await post.save()

  // Cancel all non-terminal meetings and notify each requester
  const activeMeetings = await Meeting.find({
    postId: id,
    status: { $in: ['pending', 'confirmed'] },
  })
  await Promise.all(activeMeetings.map(async (meeting) => {
    meeting.status = 'cancelled'
    await meeting.save()
    pushNotification({
      userId: meeting.requesterId.toString(),
      type: 'partner_found',
      title: 'İşbirliği tamamlandı',
      body: `"${post.title}" için zaten bir işbirliği ortağı bulundu.`,
      linkTo: `/posts/${id}`,
    }).catch(() => {})
  }))

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
  // Terminal durumları değiştirme
  if (post.status === 'partner_found' || post.status === 'expired') return

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
