import Meeting, { ITimeSlot } from '../models/Meeting'
import { incrementMeetingCount } from './postService'

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number }
  err.statusCode = statusCode
  return err
}

export async function requestMeeting(data: {
  postId: string
  postTitle: string
  requesterId: string
  requesterName: string
  ownerId: string
  ownerName: string
  message: string
  ndaAccepted: boolean
  proposedSlots: ITimeSlot[]
}) {
  if (!data.ndaAccepted) throw makeError('NDA must be accepted', 400)
  if (data.message.length < 20) throw makeError('Message must be at least 20 characters', 400)
  if (data.proposedSlots.length < 3) throw makeError('At least 3 time slots are required', 400)

  const meeting = await Meeting.create({ ...data, status: 'pending' })
  await incrementMeetingCount(data.postId, 'meeting_scheduled')
  return meeting
}

export async function getMeetingById(id: string) {
  const meeting = await Meeting.findById(id)
  if (!meeting) throw makeError('Meeting not found', 404)
  return meeting
}

export async function getMeetingsByUser(userId: string) {
  return Meeting.find({
    $or: [{ requesterId: userId }, { ownerId: userId }],
  }).sort({ createdAt: -1 })
}

export async function getMeetingsByPost(postId: string) {
  return Meeting.find({ postId }).sort({ createdAt: -1 })
}

export async function acceptMeeting(id: string, ownerId: string, slot: ITimeSlot) {
  const meeting = await Meeting.findById(id)
  if (!meeting) throw makeError('Meeting not found', 404)
  if (meeting.ownerId.toString() !== ownerId) throw makeError('Forbidden', 403)
  if (meeting.status !== 'pending' && meeting.status !== 'time_proposed') {
    throw makeError(`Cannot accept a meeting with status: ${meeting.status}`, 400)
  }

  meeting.status = 'confirmed'
  meeting.confirmedSlot = slot
  await meeting.save()
  return meeting
}

export async function declineMeeting(id: string, ownerId: string) {
  const meeting = await Meeting.findById(id)
  if (!meeting) throw makeError('Meeting not found', 404)
  if (meeting.ownerId.toString() !== ownerId) throw makeError('Forbidden', 403)

  meeting.status = 'declined'
  await meeting.save()
  return meeting
}

export async function cancelMeeting(id: string, userId: string) {
  const meeting = await Meeting.findById(id)
  if (!meeting) throw makeError('Meeting not found', 404)

  const isParty =
    meeting.requesterId.toString() === userId || meeting.ownerId.toString() === userId
  if (!isParty) throw makeError('Forbidden', 403)

  meeting.status = 'cancelled'
  await meeting.save()
  return meeting
}
