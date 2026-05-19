import Meeting, { IMeeting, ITimeSlot } from '../models/Meeting'
import User from '../models/User'
import { incrementMeetingCount, markPartnerFound, recomputePostStatus } from './postService'
import { pushNotification } from './notificationService'
import { createConversation } from './conversationService'
import { makeError } from '../utils/AppError'

async function withEmails(meetings: IMeeting[]) {
  const ids = [...new Set(meetings.flatMap(m => [m.requesterId.toString(), m.ownerId.toString()]))]
  const users = await User.find({ _id: { $in: ids } }).select('_id email').lean()
  const map = new Map(users.map(u => [(u._id as any).toString(), u.email as string]))
  return meetings.map(m => ({
    ...m.toJSON(),
    requesterEmail: (m.requesterEmail || map.get(m.requesterId.toString()) || ''),
    ownerEmail:     (m.ownerEmail     || map.get(m.ownerId.toString())     || ''),
  }))
}

export async function requestMeeting(data: {
  postId: string
  postTitle: string
  requesterId: string
  requesterName: string
  requesterEmail: string
  ownerId: string
  ownerName: string
  ownerEmail: string
  message: string
  ndaAccepted: boolean
  proposedSlots: ITimeSlot[]
}) {
  if (!data.ndaAccepted) throw makeError('NDA must be accepted', 400)
  if (typeof data.message !== 'string' || data.message.length < 20) throw makeError('Message must be at least 20 characters', 400)
  if (!Array.isArray(data.proposedSlots) || data.proposedSlots.length < 3) throw makeError('At least 3 time slots are required', 400)

  // Prevent duplicate active requests from the same requester
  const existing = await Meeting.exists({
    postId: data.postId,
    requesterId: data.requesterId,
    status: 'pending',
  })
  if (existing) throw makeError('You already have a pending meeting request for this post', 409)

  const meeting = await Meeting.create({ ...data, status: 'pending' })
  await incrementMeetingCount(data.postId)

  pushNotification({
    userId: data.ownerId,
    type: 'meeting_request',
    title: 'Yeni toplanti istegi',
    body: `${data.requesterName} "${data.postTitle}" icin toplanti talep etti.`,
    linkTo: `/meetings`,
  }).catch(() => {})

  return meeting
}

export async function getMeetingById(id: string) {
  const meeting = await Meeting.findById(id)
  if (!meeting) throw makeError('Meeting not found', 404)
  return (await withEmails([meeting]))[0]
}

export async function getMeetingsByUser(userId: string) {
  const meetings = await Meeting.find({
    $or: [{ requesterId: userId }, { ownerId: userId }],
  }).sort({ createdAt: -1 })
  return withEmails(meetings)
}

export async function getMeetingsByPost(postId: string) {
  const meetings = await Meeting.find({ postId }).sort({ createdAt: -1 })
  return withEmails(meetings)
}

async function resolveUpdateFailure(
  id: string,
  actorId: string,
  actorField: 'ownerId' | 'requesterId' | null,
  verb: string,
): Promise<never> {
  const existing = await Meeting.findById(id).select('ownerId requesterId status')
  if (!existing) throw makeError('Meeting not found', 404)
  if (actorField && existing[actorField].toString() !== actorId) throw makeError('Forbidden', 403)
  throw makeError(`Cannot ${verb} a meeting with status: ${existing.status}`, 400)
}

export async function acceptMeeting(id: string, ownerId: string, slot: ITimeSlot) {
  const existing = await Meeting.findOne({ _id: id, ownerId, status: 'pending' })
  if (!existing) await resolveUpdateFailure(id, ownerId, 'ownerId', 'accept')

  const slotWasProposed = existing!.proposedSlots.some(
    proposed => proposed.date === slot.date && proposed.time === slot.time,
  )
  if (!slotWasProposed) throw makeError('Confirmed slot must be one of the proposed slots', 400)

  existing!.status = 'confirmed'
  existing!.confirmedSlot = slot
  const meeting = await existing!.save()

  recomputePostStatus(meeting.postId.toString()).catch(() => {})

  const requesterUser = await User.findById(meeting.requesterId).select('role').lean()
  const ownerUser     = await User.findById(meeting.ownerId).select('role').lean()

  createConversation({
    meetingId:     meeting.id,
    postId:        meeting.postId.toString(),
    postTitle:     meeting.postTitle,
    requesterId:   meeting.requesterId.toString(),
    requesterName: meeting.requesterName,
    requesterRole: requesterUser?.role ?? 'engineer',
    ownerId:       meeting.ownerId.toString(),
    ownerName:     meeting.ownerName,
    ownerRole:     ownerUser?.role ?? 'healthcare_professional',
  }).catch(() => {})

  pushNotification({
    userId: meeting.requesterId.toString(),
    type: 'meeting_accepted',
    title: 'Toplanti kabul edildi',
    body: `${meeting.ownerName} toplanti talebinizi kabul etti. "${meeting.postTitle}"`,
    linkTo: `/meetings`,
  }).catch(() => {})

  return (await withEmails([meeting]))[0]
}

export async function declineMeeting(id: string, ownerId: string, reason?: string) {
  const update: Record<string, unknown> = { status: 'declined' }
  if (reason) update.declineReason = reason
  const meeting = await Meeting.findOneAndUpdate(
    { _id: id, ownerId, status: 'pending' },
    { $set: update },
    { new: true },
  )
  if (!meeting) await resolveUpdateFailure(id, ownerId, 'ownerId', 'decline')

  recomputePostStatus(meeting!.postId.toString()).catch(() => {})
  pushNotification({
    userId: meeting!.requesterId.toString(),
    type: 'meeting_declined',
    title: 'Toplanti reddedildi',
    body: `${meeting!.ownerName} toplanti talebinizi reddetti. "${meeting!.postTitle}"`,
    linkTo: `/meetings`,
  }).catch(() => {})

  return (await withEmails([meeting!]))[0]
}

export async function cancelMeeting(id: string, userId: string, reason?: string) {
  const update: Record<string, unknown> = { status: 'cancelled' }
  if (reason) update.cancelReason = reason
  const meeting = await Meeting.findOneAndUpdate(
    {
      _id: id,
      $or: [{ requesterId: userId }, { ownerId: userId }],
      status: { $nin: ['declined', 'cancelled'] },
    },
    { $set: update },
    { new: true },
  )
  if (!meeting) await resolveUpdateFailure(id, userId, null, 'cancel')

  recomputePostStatus(meeting!.postId.toString()).catch(() => {})

  const isRequester = meeting!.requesterId.toString() === userId
  pushNotification({
    userId: isRequester ? meeting!.ownerId.toString() : meeting!.requesterId.toString(),
    type: 'meeting_cancelled',
    title: 'Toplanti iptal edildi',
    body: `${isRequester ? meeting!.requesterName : meeting!.ownerName} toplanti talebini iptal etti. "${meeting!.postTitle}"`,
    linkTo: `/meetings`,
  }).catch(() => {})

  return (await withEmails([meeting!]))[0]
}

export async function completeMeeting(id: string, userId: string) {
  const meeting = await Meeting.findOneAndUpdate(
    {
      _id: id,
      $or: [{ requesterId: userId }, { ownerId: userId }],
      status: 'confirmed',
    },
    { $set: { status: 'completed' } },
    { new: true },
  )
  if (!meeting) await resolveUpdateFailure(id, userId, null, 'complete')

  // Mark post as partner_found (also cascades: cancels other pending/confirmed meetings)
  await markPartnerFound(meeting!.postId.toString(), meeting!.ownerId.toString())

  const isRequester = meeting!.requesterId.toString() === userId
  pushNotification({
    userId: isRequester ? meeting!.ownerId.toString() : meeting!.requesterId.toString(),
    type: 'meeting_completed',
    title: 'Görüşme tamamlandı',
    body: `${isRequester ? meeting!.requesterName : meeting!.ownerName} görüşmeyi tamamlandı olarak işaretledi. "${meeting!.postTitle}"`,
    linkTo: `/meetings`,
  }).catch(() => {})

  return (await withEmails([meeting!]))[0]
}
