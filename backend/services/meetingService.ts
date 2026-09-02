import Meeting, { IMeeting, ITimeSlot } from '../models/Meeting'
import User from '../models/User'
import { incrementMeetingCount, markPartnerFound, recomputePostStatus } from './postService'
import { pushNotification } from './notificationService'
import { createConversation } from './conversationService'
import { recalculateBadges } from './badgeService'
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
    title: 'Yeni toplantı isteği',
    body: `${data.requesterName} "${data.postTitle}" için toplantı talep etti.`,
    linkTo: `/meetings`,
  }).catch(() => {})

  return meeting
}

export async function getMeetingById(id: string, requesterId: string, isAdmin: boolean) {
  const meeting = await Meeting.findById(id)
  if (!meeting) throw makeError('Meeting not found', 404)
  const isParticipant = meeting.requesterId.toString() === requesterId || meeting.ownerId.toString() === requesterId
  if (!isAdmin && !isParticipant) throw makeError('Forbidden', 403)
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

// Step 1: owner accepts request → pending → time_proposed (no slot chosen yet)
export async function acceptMeeting(id: string, ownerId: string) {
  const meeting = await Meeting.findOneAndUpdate(
    { _id: id, ownerId, status: 'pending' },
    { $set: { status: 'time_proposed' } },
    { new: true },
  )
  if (!meeting) return await resolveUpdateFailure(id, ownerId, 'ownerId', 'accept')

  pushNotification({
    userId: meeting.requesterId.toString(),
    type: 'meeting_accepted',
    title: 'Toplantı kabul edildi',
    body: `${meeting.ownerName} toplantı talebinizi kabul etti. Zaman dilimi onayını bekliyor. "${meeting.postTitle}"`,
    linkTo: `/meetings`,
  }).catch(() => {})

  return (await withEmails([meeting]))[0]
}

// Step 2: owner confirms a slot → time_proposed → confirmed
export async function confirmMeetingSlot(id: string, ownerId: string, slot: ITimeSlot) {
  const existing = await Meeting.findOne({ _id: id, ownerId, status: 'time_proposed' })
  if (!existing) await resolveUpdateFailure(id, ownerId, 'ownerId', 'confirm')

  const slotWasProposed = existing!.proposedSlots.some(
    proposed => proposed.date === slot.date && proposed.time === slot.time,
  )
  if (!slotWasProposed) throw makeError('Confirmed slot must be one of the proposed slots', 400)

  // Calendar conflict: ensure neither party already has a confirmed meeting at this slot
  const conflict = await Meeting.exists({
    _id: { $ne: existing!._id },
    status: 'confirmed',
    'confirmedSlot.date': slot.date,
    'confirmedSlot.time': slot.time,
    $or: [
      { requesterId: existing!.requesterId },
      { ownerId: existing!.ownerId },
      { requesterId: existing!.ownerId },
      { ownerId: existing!.requesterId },
    ],
  })
  if (conflict) throw makeError('One of the participants already has a confirmed meeting at this time slot', 409)

  existing!.status = 'confirmed'
  existing!.confirmedSlot = slot
  const meeting = await existing!.save()

  // Auto-decline all other pending/time_proposed meetings for the same post
  const competing = await Meeting.find({
    postId: meeting.postId,
    _id: { $ne: meeting._id },
    status: { $in: ['pending', 'time_proposed'] },
  })
  await Promise.all(competing.map(async (m) => {
    m.status = 'declined'
    m.declineReason = 'Another meeting was confirmed for this post'
    await m.save()
    pushNotification({
      userId: m.requesterId.toString(),
      type: 'meeting_declined',
      title: 'Toplantı isteği iptal edildi',
      body: `"${m.postTitle}" için başka bir toplantı onaylandığından talebiniz otomatik olarak iptal edildi.`,
      linkTo: `/meetings`,
    }).catch(() => {})
  }))

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
    title: 'Toplantı kabul edildi',
    body: `${meeting.ownerName} toplantı talebinizi kabul etti. "${meeting.postTitle}"`,
    linkTo: `/meetings`,
  }).catch(() => {})

  return (await withEmails([meeting]))[0]
}

export async function declineMeeting(id: string, ownerId: string, reason?: string) {
  const update: Record<string, unknown> = { status: 'declined' }
  if (reason) update.declineReason = reason
  const meeting = await Meeting.findOneAndUpdate(
    { _id: id, ownerId, status: { $in: ['pending', 'time_proposed'] } },
    { $set: update },
    { new: true },
  )
  if (!meeting) await resolveUpdateFailure(id, ownerId, 'ownerId', 'decline')

  recomputePostStatus(meeting!.postId.toString()).catch(() => {})
  pushNotification({
    userId: meeting!.requesterId.toString(),
    type: 'meeting_declined',
    title: 'Toplantı reddedildi',
    body: `${meeting!.ownerName} toplantı talebinizi reddetti. "${meeting!.postTitle}"`,
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
    title: 'Toplantı iptal edildi',
    body: `${isRequester ? meeting!.requesterName : meeting!.ownerName} toplantı talebini iptal etti. "${meeting!.postTitle}"`,
    linkTo: `/meetings`,
  }).catch(() => {})

  return (await withEmails([meeting!]))[0]
}

export async function rescheduleMeeting(id: string, requesterId: string, proposedSlots: ITimeSlot[]) {
  if (!Array.isArray(proposedSlots) || proposedSlots.length < 3) {
    throw makeError('At least 3 proposed slots are required', 400)
  }
  const meeting = await Meeting.findOneAndUpdate(
    { _id: id, requesterId, status: 'confirmed' },
    { $set: { status: 'time_proposed', proposedSlots, confirmedSlot: undefined } },
    { new: true },
  )
  if (!meeting) await resolveUpdateFailure(id, requesterId, 'requesterId', 'reschedule')

  recomputePostStatus(meeting!.postId.toString()).catch(() => {})
  pushNotification({
    userId: meeting!.ownerId.toString(),
    type: 'meeting_cancelled',
    title: 'Toplantı yeniden zamanlanma isteği',
    body: `${meeting!.requesterName} toplantıyı yeniden zamanlamak istiyor. "${meeting!.postTitle}"`,
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

  // Recalculate badges for both participants
  recalculateBadges(meeting!.requesterId.toString()).catch(() => {})
  recalculateBadges(meeting!.ownerId.toString()).catch(() => {})

  return (await withEmails([meeting!]))[0]
}
