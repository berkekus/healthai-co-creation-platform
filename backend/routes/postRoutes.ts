import { Router } from 'express'
import {
  createPost, getPost, listPosts, updatePost,
  publishPost, markPartnerFound, deletePost, expressInterest,
} from '../controllers/postController'
import { protect } from '../middleware/authMiddleware'

const router = Router()

router.get('/', protect, listPosts)
router.post('/', protect, createPost)
router.get('/:id', protect, getPost)
router.put('/:id', protect, updatePost)
router.post('/:id/publish', protect, publishPost)
router.post('/:id/partner-found', protect, markPartnerFound)
router.post('/:id/interest', protect, expressInterest)
router.delete('/:id', protect, deletePost)

export default router
