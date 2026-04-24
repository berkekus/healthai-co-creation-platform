import Post, { IPost } from '../models/Post'
import { FilterQuery } from 'mongoose'
import Meeting from '../models/Meeting'

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
  return post
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
