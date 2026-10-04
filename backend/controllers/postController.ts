import { AuthenticatedRequest } from '../middleware/authMiddleware'
import * as postService from '../services/postService'
import { POST_SORTS } from '../services/postService'
import { LOG } from '../constants/logActions'
import User from '../models/User'
import { asyncHandler } from '../utils/asyncHandler'
import { log } from '../utils/controllerLog'

export const createPost = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const { title, domain, domains, expertiseRequired, description, projectStage,
          collaborationType, levelOfCommitment, confidentiality, city, country, expiryDate } = req.body

  const hasDomain = (Array.isArray(domains) && domains.length > 0) || Boolean(domain)
  if (!title || !hasDomain || !expertiseRequired || !description || !projectStage ||
      !collaborationType || !levelOfCommitment || !confidentiality || !city || !country || !expiryDate) {
    res.status(400).json({ success: false, message: 'All post fields are required' })
    return
  }
  const resolvedDomains = postService.resolveDomains(domains, domain)
  const parsedExpiry = new Date(expiryDate)
  if (isNaN(parsedExpiry.getTime()) || parsedExpiry <= new Date()) {
    res.status(400).json({ success: false, message: 'expiryDate must be a valid future date' })
    return
  }

  if (req.userRole === 'admin') {
    res.status(403).json({ success: false, message: 'Admins cannot create posts' })
    return
  }

  const author = await User.findById(req.userId).select('name')
  if (!author) {
    res.status(404).json({ success: false, message: 'User not found' })
    return
  }

  const post = await postService.createPost({
    title, domains: resolvedDomains, expertiseRequired, description, projectStage,
    collaborationType, levelOfCommitment, confidentiality, city, country, expiryDate,
    authorId: req.userId,
    authorName: author.name,
    authorRole: req.userRole as 'engineer' | 'healthcare_professional',
  })
  log(req, LOG.POST_CREATE, post.id as string)
  res.status(201).json({ success: true, data: post })
})

export const getPost = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const post = await postService.getPostById(req.params.id, req.userId, req.userRole === 'admin')
  res.json({ success: true, data: post })
})

export const listPosts = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  // qs turns ?status[$exists]=true into an object; only plain strings may reach the query.
  const text = (value: unknown) => (typeof value === 'string' ? value : undefined)
  const q = req.query
  const status = text(q.status)
  const page  = Math.max(1, parseInt(text(q.page) ?? '') || 1)
  const limit = Math.min(100, Math.max(1, parseInt(text(q.limit) ?? '') || 20))
  const sort: postService.PostSort = POST_SORTS.includes(q.sort as postService.PostSort) ? q.sort as postService.PostSort : 'newest'

  const isAdmin = req.userRole === 'admin'
  const isMine = text(q.mine) === 'true'
  const forceScopeToOwn = !isAdmin && status === 'draft'

  const viewerProfile = sort === 'relevance'
    ? await User.findById(req.userId).select('role city country expertiseTags').lean()
    : null
  const viewer = viewerProfile
    ? { id: req.userId, role: viewerProfile.role, city: viewerProfile.city, country: viewerProfile.country, expertiseTags: viewerProfile.expertiseTags }
    : undefined

  const result = await postService.listPosts(
    {
      domain: text(q.domain),
      expertise: text(q.expertise),
      city: text(q.city),
      country: text(q.country),
      location: text(q.location),
      projectStage: text(q.projectStage),
      authorId: (isMine || forceScopeToOwn) ? req.userId : undefined,
      status: isMine ? undefined : status,
      search: text(q.search),
      authorRole: text(q.authorRole),
    },
    page,
    limit,
    sort,
    viewer,
  )
  res.json({ success: true, data: result })
})

export const updatePost = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const isAdmin = req.userRole === 'admin'
  const post = await postService.updatePost(req.params.id, req.userId, isAdmin, req.body)
  log(req, LOG.POST_UPDATE, req.params.id)
  res.json({ success: true, data: post })
})

export const publishPost = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const post = await postService.publishPost(req.params.id, req.userId)
  log(req, LOG.POST_PUBLISH, req.params.id)
  res.json({ success: true, data: post })
})

export const markPartnerFound = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const post = await postService.markPartnerFound(req.params.id, req.userId)
  log(req, LOG.POST_PARTNER_FOUND, req.params.id)
  res.json({ success: true, data: post })
})

export const reopenPost = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const post = await postService.reopenPost(req.params.id, req.userId, req.body?.expiryDate)
  log(req, LOG.POST_REOPEN, req.params.id)
  res.json({ success: true, data: post })
})

export const deletePost = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const isAdmin = req.userRole === 'admin'
  await postService.deletePost(req.params.id, req.userId, isAdmin)
  log(req, LOG.POST_DELETE, req.params.id)
  res.json({ success: true, message: 'Post deleted' })
})

export const expressInterest = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const requester = await User.findById(req.userId).select('name')
  if (!requester) {
    res.status(404).json({ success: false, message: 'User not found' })
    return
  }
  const result = await postService.expressInterest(req.params.id, req.userId, requester.name)
  log(req, LOG.POST_INTEREST, req.params.id)
  res.json({ success: true, data: result })
})
