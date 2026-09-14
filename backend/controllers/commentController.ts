import { AuthenticatedRequest } from '../middleware/authMiddleware'
import { asyncHandler } from '../utils/asyncHandler'
import { makeError } from '../utils/AppError'
import Comment from '../models/Comment'
import Post from '../models/Post'
import { pushNotification } from '../services/notificationService'

const PAGE_SIZE = 20

export const getComments = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const { id: postId } = req.params
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const skip = (page - 1) * PAGE_SIZE

  const [comments, total] = await Promise.all([
    Comment.find({ postId }).sort({ createdAt: 1 }).skip(skip).limit(PAGE_SIZE),
    Comment.countDocuments({ postId }),
  ])

  res.json({
    success: true,
    // toJSON adds the `id` the client replies to and deletes by (lean documents only carry `_id`).
    data: { comments: comments.map(c => c.toJSON()), total, page, pages: Math.ceil(total / PAGE_SIZE) },
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

  const post = await Post.findById(postId).select('title authorId')
  if (!post) throw makeError('Post not found', 404)

  const parent = parentId ? await Comment.findById(parentId).select('postId authorId') : null
  if (parentId && (!parent || parent.postId.toString() !== postId)) {
    throw makeError('The comment you are replying to does not exist', 400)
  }

  const comment = await Comment.create({
    postId,
    authorId: req.userId,
    authorName: req.userName,
    authorRole: req.userRole,
    content: content.trim(),
    parentId: parentId ?? null,
  })

  await notifyAboutComment({
    postId,
    postTitle: post.title,
    postAuthorId: post.authorId.toString(),
    parentAuthorId: parent?.authorId.toString(),
    commenterId: req.userId,
    commenterName: req.userName,
  })

  res.status(201).json({ success: true, data: comment.toJSON() })
})

/**
 * Comments are the only way to reach the author of a closed post, so they must
 * not go unnoticed. The post author hears about every comment on their post,
 * the author of a replied-to comment hears about the reply, and nobody is told
 * about their own comment or told twice about the same one.
 */
async function notifyAboutComment(c: {
  postId: string
  postTitle: string
  postAuthorId: string
  parentAuthorId?: string
  commenterId: string
  commenterName: string
}) {
  const linkTo = `/posts/${c.postId}#comments`
  const metadata = { actorName: c.commenterName, postTitle: c.postTitle }
  const notices: Parameters<typeof pushNotification>[0][] = []

  const replyTarget = c.parentAuthorId && c.parentAuthorId !== c.commenterId ? c.parentAuthorId : undefined
  if (replyTarget) {
    notices.push({
      userId: replyTarget,
      type: 'new_comment',
      contentKey: 'comment_reply',
      metadata,
      title: 'Yorumunuza yanıt',
      body: `${c.commenterName} "${c.postTitle}" ilanındaki yorumunuza yanıt verdi.`,
      linkTo,
    })
  }
  if (c.postAuthorId !== c.commenterId && c.postAuthorId !== replyTarget) {
    notices.push({
      userId: c.postAuthorId,
      type: 'new_comment',
      contentKey: 'new_comment',
      metadata,
      title: 'Yeni yorum',
      body: `${c.commenterName} "${c.postTitle}" ilanınıza yorum yaptı.`,
      linkTo,
    })
  }

  // A failed notification must not fail the comment that was already saved.
  await Promise.allSettled(notices.map(notice => pushNotification(notice)))
}

export const deleteComment = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId)
  if (!comment) throw makeError('Comment not found', 404)

  const isOwn = comment.authorId.toString() === req.userId
  const isAdmin = req.userRole === 'admin'
  if (!isOwn && !isAdmin) throw makeError('Forbidden', 403)

  await comment.deleteOne()
  res.json({ success: true })
})
