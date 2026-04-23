import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/authMiddleware'
import * as meetingService from '../services/meetingService'
import User from '../models/User'

export async function requestMeeting(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { postId, postTitle, ownerId, ownerName, message, ndaAccepted, proposedSlots } = req.body

    if (!postId || !postTitle || !ownerId || !ownerName || !message || !proposedSlots) {
      res.status(400).json({ success: false, message: 'Missing required fields' })
      return
    }

    const requester = await User.findById(req.userId).select('name')
    if (!requester) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    const meeting = await meetingService.requestMeeting({
      postId,
      postTitle,
      requesterId: req.userId as string,
      requesterName: requester.name,
      ownerId,
      ownerName,
      message,
      ndaAccepted,
      proposedSlots,
    })
    res.status(201).json({ success: true, data: meeting })
  } catch (err) {
    next(err)
  }
}

export async function getMeeting(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const meeting = await meetingService.getMeetingById(req.params.id)
    res.json({ success: true, data: meeting })
  } catch (err) {
    next(err)
  }
}

export async function listMeetings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { postId } = req.query

    const meetings = postId
      ? await meetingService.getMeetingsByPost(postId as string)
      : await meetingService.getMeetingsByUser(req.userId as string)

    res.json({ success: true, data: meetings })
  } catch (err) {
    next(err)
  }
}

export async function acceptMeeting(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { slot } = req.body
    if (!slot?.date || !slot?.time) {
      res.status(400).json({ success: false, message: 'A confirmed slot with date and time is required' })
      return
    }
    const meeting = await meetingService.acceptMeeting(req.params.id, req.userId as string, slot)
    res.json({ success: true, data: meeting })
  } catch (err) {
    next(err)
  }
}

export async function declineMeeting(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const meeting = await meetingService.declineMeeting(req.params.id, req.userId as string)
    res.json({ success: true, data: meeting })
  } catch (err) {
    next(err)
  }
}

export async function cancelMeeting(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const meeting = await meetingService.cancelMeeting(req.params.id, req.userId as string)
    res.json({ success: true, data: meeting })
  } catch (err) {
    next(err)
  }
}
