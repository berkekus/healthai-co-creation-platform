import { AuthenticatedRequest } from '../middleware/authMiddleware'
import * as meetingService from '../services/meetingService'
import { LOG } from '../constants/logActions'
import User from '../models/User'
import Post from '../models/Post'
import { asyncHandler } from '../utils/asyncHandler'
import { log } from '../utils/controllerLog'

export const requestMeeting = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const { postId, message, ndaAccepted, proposedSlots } = req.body

  if (!postId || !message || !proposedSlots) {
    res.status(400).json({ success: false, message: 'postId, message and proposedSlots are required' })
    return
  }

  const [post, requester] = await Promise.all([
    Post.findById(postId).select('title authorId'),
    User.findById(req.userId).select('name email'),
  ])

  if (!post) {
    res.status(404).json({ success: false, message: 'Post not found' })
    return
  }
  if (!requester) {
    res.status(404).json({ success: false, message: 'User not found' })
    return
  }

  const owner = await User.findById(post.authorId).select('name email')

  const meeting = await meetingService.requestMeeting({
    postId,
    postTitle: post.title,
    requesterId: req.userId,
    requesterName: requester.name,
    requesterEmail: requester.email,
    ownerId: post.authorId.toString(),
    ownerName: owner?.name ?? '',
    ownerEmail: owner?.email ?? '',
    message,
    ndaAccepted,
    proposedSlots,
  })
  log(req, LOG.MEETING_REQUEST, meeting.id as string)
  res.status(201).json({ success: true, data: meeting })
})

export const getMeeting = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const meeting = await meetingService.getMeetingById(req.params.id)
  res.json({ success: true, data: meeting })
})

export const listMeetings = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const { postId } = req.query

  if (postId) {
    const post = await Post.findById(postId as string).select('authorId')
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' })
      return
    }
    if (post.authorId.toString() !== req.userId && req.userRole !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' })
      return
    }
    const meetings = await meetingService.getMeetingsByPost(postId as string)
    res.json({ success: true, data: meetings })
    return
  }

  const meetings = await meetingService.getMeetingsByUser(req.userId)
  res.json({ success: true, data: meetings })
})

export const acceptMeeting = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const { slot } = req.body
  if (!slot?.date || !slot?.time) {
    res.status(400).json({ success: false, message: 'A confirmed slot with date and time is required' })
    return
  }
  const meeting = await meetingService.acceptMeeting(req.params.id, req.userId, slot)
  log(req, LOG.MEETING_ACCEPT, req.params.id)
  res.json({ success: true, data: meeting })
})

export const declineMeeting = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const meeting = await meetingService.declineMeeting(req.params.id, req.userId)
  log(req, LOG.MEETING_DECLINE, req.params.id)
  res.json({ success: true, data: meeting })
})

export const cancelMeeting = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const meeting = await meetingService.cancelMeeting(req.params.id, req.userId)
  log(req, LOG.MEETING_CANCEL, req.params.id)
  res.json({ success: true, data: meeting })
})

export const completeMeeting = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const meeting = await meetingService.completeMeeting(req.params.id, req.userId)
  log(req, LOG.MEETING_COMPLETE, req.params.id)
  res.json({ success: true, data: meeting })
})
