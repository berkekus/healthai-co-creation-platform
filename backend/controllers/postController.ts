import { AuthenticatedRequest } from '../middleware/authMiddleware'
import * as postService from '../services/postService'
import { LOG } from '../constants/logActions'
import User from '../models/User'
import { asyncHandler } from '../utils/asyncHandler'
import { log } from '../utils/controllerLog'

export const createPost = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const { title, domain, expertiseRequired, description, projectStage,
          collaborationType, confidentiality, city, country, expiryDate } = req.body

  if (!title || !domain || !expertiseRequired || !description || !projectStage ||
      !collaborationType || !confidentiality || !city || !country || !expiryDate) {
    res.status(400).json({ success: false, message: 'All post fields are required' })
    return
  }
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
    title, domain, expertiseRequired, description, projectStage,
    collaborationType, confidentiality, city, country, expiryDate,
    authorId: req.userId,
    authorName: author.name,
    authorRole: req.userRole as 'engineer' | 'healthcare_professional',
  })
  log(req, LOG.POST_CREATE, post.id as string)
  res.status(201).json({ success: true, data: post })
})

export const getPost = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const post = await postService.getPostById(req.params.id)
  res.json({ success: true, data: post })
})

export const listPosts = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const { domain, expertise, city, country, projectStage, status, search, authorRole, mine } = req.query
  const page  = Math.max(1, parseInt(req.query.page  as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))

  const isAdmin = req.userRole === 'admin'
  const isMine = mine === 'true'
  const forceScopeToOwn = !isAdmin && (status as string) === 'draft'

  const result = await postService.listPosts(
    {
      domain: domain as string,
      expertise: expertise as string,
      city: city as string,
      country: country as string,
      projectStage: projectStage as string,
      authorId: (isMine || forceScopeToOwn) ? req.userId : undefined,
      status: isMine ? undefined : (status as string),
      search: search as string,
      authorRole: authorRole as string,
    },
    page,
    limit,
  )
  res.json({ success: true, data: result })
})

export const updatePost = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const isAdmin = req.userRole === 'admin'
  const post = await postService.updatePost(req.params.id, req.userId, isAdmin, req.body)
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
