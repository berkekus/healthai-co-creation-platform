import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/authMiddleware'
import * as postService from '../services/postService'

export async function createPost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { title, domain, expertiseRequired, description, projectStage,
            collaborationType, confidentiality, city, country, expiryDate } = req.body

    if (!title || !domain || !expertiseRequired || !description || !projectStage ||
        !collaborationType || !confidentiality || !city || !country || !expiryDate) {
      res.status(400).json({ success: false, message: 'All post fields are required' })
      return
    }

    const post = await postService.createPost({
      ...req.body,
      authorId: req.userId as string,
      authorName: req.body.authorName,
      authorRole: req.userRole as 'engineer' | 'healthcare_professional',
    })
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
    const { domain, expertise, city, country, projectStage, status, search, authorRole } = req.query
    const posts = await postService.listPosts({
      domain: domain as string,
      expertise: expertise as string,
      city: city as string,
      country: country as string,
      projectStage: projectStage as string,
      status: status as string,
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
    res.json({ success: true, data: post })
  } catch (err) {
    next(err)
  }
}

export async function markPartnerFound(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const post = await postService.markPartnerFound(req.params.id, req.userId as string)
    res.json({ success: true, data: post })
  } catch (err) {
    next(err)
  }
}

export async function deletePost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const isAdmin = req.userRole === 'admin'
    await postService.deletePost(req.params.id, req.userId as string, isAdmin)
    res.json({ success: true, message: 'Post deleted' })
  } catch (err) {
    next(err)
  }
}
