import { AuthenticatedRequest } from '../middleware/authMiddleware'
import { asyncHandler } from '../utils/asyncHandler'
import { makeError } from '../utils/AppError'
import Comment from '../models/Comment'
import Post from '../models/Post'

const PAGE_SIZE = 20

export const getComments = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const { id: postId } = req.params
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const skip = (page - 1) * PAGE_SIZE

  const [comments, total] = await Promise.all([
    Comment.find({ postId }).sort({ createdAt: 1 }).skip(skip).limit(PAGE_SIZE).lean(),
    Comment.countDocuments({ postId }),
  ])

  res.json({
    success: true,
    data: { comments, total, page, pages: Math.ceil(total / PAGE_SIZE) },
  })
})

export const createComment = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const { id: postId } = req.params
  const { content, parentId } = req.body

  if (!content || typeof content !== 'string' || !content.trim()) {
    throw makeError('Content is required', 400)
  }
  if (content.trim().length > 500) {
    throw makeError('Comment too long (max 500 characters)', 400)
  }

  const postExists = await Post.exists({ _id: postId })
  if (!postExists) throw makeError('Post not found', 404)

  if (parentId) {
    const parent = await Comment.findById(parentId).select('postId')
    if (!parent || parent.postId.toString() !== postId) {
      throw makeError('parentId must reference a comment on the same post', 400)
    }
  }

  const comment = await Comment.create({
    postId,
    authorId: req.userId,
    authorName: req.userName,
    authorRole: req.userRole,
    content: content.trim(),
    parentId: parentId ?? null,
  })

  res.status(201).json({ success: true, data: comment.toJSON() })
})

export const deleteComment = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId)
  if (!comment) throw makeError('Comment not found', 404)

  const isOwn = comment.authorId.toString() === req.userId
  const isAdmin = req.userRole === 'admin'
  if (!isOwn && !isAdmin) throw makeError('Forbidden', 403)

  await comment.deleteOne()
  res.json({ success: true })
})
