import { Router } from 'express'
import { getComments, createComment, deleteComment } from '../controllers/commentController'
import { protect } from '../middleware/authMiddleware'

const router = Router({ mergeParams: true })

// /api/posts/:id/comments
router.get('/', protect, getComments)
router.post('/', protect, createComment)

// /api/comments/:commentId
export const commentRouter = Router()
commentRouter.delete('/:commentId', protect, deleteComment)

export default router
