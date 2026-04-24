import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/authMiddleware'
import * as postService from '../services/postService'
import { createLog } from '../services/logService'
import { LOG } from '../constants/logActions'
import User from '../models/User'

function log(req: AuthRequest, action: string, targetEntityId?: string) {
  createLog({
    userId: req.userId as string,
    userEmail: req.userEmail as string,
    role: req.userRole as string,
    action,
    targetEntityId,
    result: 'success',
    ipAddress: req.ip,
  }).catch(() => {})
}

export async function createPost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { title, domain, expertiseRequired, description, projectStage,
            collaborationType, confidentiality, city, country, expiryDate } = req.body

    if (!title || !domain || !expertiseRequired || !description || !projectStage ||
        !collaborationType || !confidentiality || !city || !country || !expiryDate) {
      res.status(400).json({ success: false, message: 'All post fields are required' })
      return
    }

    const authorRole = req.userRole as string
    if (authorRole === 'admin') {
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
      authorId: req.userId as string,
      authorName: author.name,
      authorRole: authorRole as 'engineer' | 'healthcare_professional',
    })
    log(req, LOG.POST_CREATE, post.id as string)
    res.status(201).json({ success: true, data: post })
  } catch (err) {
    next(err)
  }
}

export async function getPost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const post = await postService.getPostById(req.params.id)
    res.json({ success: true, data: post })
  } catch (err) {
    next(err)
  }
}

export async function listPosts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { domain, expertise, city, country, projectStage, status, search, authorRole, mine } = req.query
    const posts = await postService.listPosts({
      domain: domain as string,
      expertise: expertise as string,
      city: city as string,
      country: country as string,
      projectStage: projectStage as string,
      // mine=true ise kendi post'larını (draft dahil) getir; aksi hâlde normal status filtresi
      authorId: mine === 'true' ? req.userId : undefined,
      status: mine === 'true' ? undefined : status as string,
      search: search as string,
      authorRole: authorRole as string,
    })
    res.json({ success: true, data: posts })
  } catch (err) {
    next(err)
  }
}

export async function updatePost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const isAdmin = req.userRole === 'admin'
    const post = await postService.updatePost(req.params.id, req.userId as string, isAdmin, req.body)
    res.json({ success: true, data: post })
  } catch (err) {
    next(err)
  }
}

export async function publishPost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const post = await postService.publishPost(req.params.id, req.userId as string)
    log(req, LOG.POST_PUBLISH, req.params.id)
    res.json({ success: true, data: post })
  } catch (err) {
    next(err)
  }
}

export async function markPartnerFound(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const post = await postService.markPartnerFound(req.params.id, req.userId as string)
    log(req, LOG.POST_PARTNER_FOUND, req.params.id)
    res.json({ success: true, data: post })
  } catch (err) {
    next(err)
  }
}

export async function deletePost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const isAdmin = req.userRole === 'admin'
    await postService.deletePost(req.params.id, req.userId as string, isAdmin)
    log(req, LOG.POST_DELETE, req.params.id)
    res.json({ success: true, message: 'Post deleted' })
  } catch (err) {
    next(err)
  }
}

export async function expressInterest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const requester = await User.findById(req.userId).select('name')
    if (!requester) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }
    const result = await postService.expressInterest(req.params.id, req.userId as string, requester.name)
    log(req, LOG.POST_INTEREST, req.params.id)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}
