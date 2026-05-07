import { AuthenticatedRequest } from '../middleware/authMiddleware'
import * as svc from '../services/conversationService'
import { asyncHandler } from '../utils/asyncHandler'

export const listConversations = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const convs = await svc.getConversationsByUser(req.userId)
  res.json({ success: true, data: convs })
})

export const getConversation = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const conv = await svc.getConversationById(req.params.id, req.userId)
  res.json({ success: true, data: conv })
})

export const getByMeeting = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const conv = await svc.getConversationByMeetingId(req.params.meetingId, req.userId)
  res.json({ success: true, data: conv })
})

export const listMessages = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const messages = await svc.getMessages(req.params.id, req.userId)
  res.json({ success: true, data: messages })
})

export const postMessage = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const { content } = req.body
  if (!content || typeof content !== 'string') {
    res.status(400).json({ success: false, message: 'content is required' })
    return
  }
  const message = await svc.sendMessage(req.params.id, req.userId, req.userName ?? req.userEmail, content)
  res.status(201).json({ success: true, data: message })
})

export const markRead = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  await svc.markAsRead(req.params.id, req.userId)
  res.json({ success: true })
})

export const deleteConversation = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  await svc.deleteConversation(req.params.id, req.userId)
  res.json({ success: true })
})

export const unreadCount = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const count = await svc.getUnreadCount(req.userId)
  res.json({ success: true, data: { count } })
})
