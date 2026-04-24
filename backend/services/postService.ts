import Post, { IPost } from '../models/Post'
import { FilterQuery } from 'mongoose'
import Meeting from '../models/Meeting'
import { pushNotification } from './notificationService'

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number }
  err.statusCode = statusCode
  return err
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
  domain: string
  expertiseRequired: string
  description: string
  projectStage: IPost['projectStage']
  collaborationType: IPost['collaborationType']
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

export async function listPosts(filters: PostFilters) {
  // Item 8: lazily mark active posts past their expiry date
  const now = new Date()
  await Post.updateMany(
    { status: 'active', expiryDate: { $lt: now } },
    { $set: { status: 'expired' } }
  )

  const query: FilterQuery<IPost> = {}

  if (filters.authorId) {
    // Kullanıcı kendi post'larını görüyor — draft dahil, yalnızca kendisine ait
    query.authorId = filters.authorId
  } else if (filters.status) {
    query.status = filters.status
  } else {
    // Genel feed: yayınlanmamış draft'ları gizle
    query.status = { $ne: 'draft' }
  }

  if (filters.domain) query.domain = { $regex: filters.domain, $options: 'i' }
  if (filters.expertise) query.expertiseRequired = { $regex: filters.expertise, $options: 'i' }
  if (filters.city) query.city = { $regex: `^${filters.city}$`, $options: 'i' }
  if (filters.country) query.country = { $regex: `^${filters.country}$`, $options: 'i' }
  if (filters.projectStage) query.projectStage = filters.projectStage
  if (filters.authorRole) query.authorRole = filters.authorRole
  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } },
    ]
  }

  return Post.find(query).sort({ createdAt: -1 })
}

export async function updatePost(id: string, requesterId: string, isAdmin: boolean, data: Partial<IPost>) {
  const post = await Post.findById(id)
  if (!post) throw makeError('Post not found', 404)
  if (!isAdmin && post.authorId.toString() !== requesterId) throw makeError('Forbidden', 403)

  Object.assign(post, data)
  await post.save()
  return post
}

export async function publishPost(id: string, requesterId: string) {
  const post = await Post.findById(id)
  if (!post) throw makeError('Post not found', 404)
  if (post.authorId.toString() !== requesterId) throw makeError('Forbidden', 403)

  post.status = 'active'
  await post.save()
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
    status: { $in: ['pending', 'time_proposed', 'confirmed'] },
  })
  for (const meeting of activeMeetings) {
    meeting.status = 'cancelled'
    await meeting.save()
    pushNotification({
      userId: meeting.requesterId.toString(),
      type: 'partner_found',
      title: 'İşbirliği tamamlandı',
      body: `"${post.title}" için zaten bir işbirliği ortağı bulundu.`,
      linkTo: `/posts/${id}`,
    }).catch(() => {})
  }

  return post
}

export async function expressInterest(id: string, requesterId: string, requesterName: string) {
  const post = await Post.findById(id)
  if (!post) throw makeError('Post not found', 404)
  if (post.status !== 'active') throw makeError('Post is not accepting interest', 400)
  if (post.authorId.toString() === requesterId) throw makeError('Cannot express interest in your own post', 400)

  const updated = await Post.findByIdAndUpdate(
    id,
    { $inc: { interestCount: 1 } },
    { new: true }
  )

  pushNotification({
    userId: post.authorId.toString(),
    type: 'interest_received',
    title: 'Yeni ilgi',
    body: `${requesterName} "${post.title}" postunuza ilgi gösterdi.`,
    linkTo: `/posts/${id}`,
  }).catch(() => {})

  return updated!
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
