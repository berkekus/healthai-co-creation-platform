import Meeting, { IMeeting, ITimeSlot } from '../models/Meeting'
import User from '../models/User'
import Post from '../models/Post'
import { incrementMeetingCount, recomputePostStatus } from './postService'
import { pushNotification } from './notificationService'
import { ensureMeetingConversation } from './conversationService'
import { recalculateBadges } from './badgeService'
import { makeError } from '../utils/AppError'
import { isValidTimeZone, zonedTimeToUtc } from '../utils/timeZone'

const MAX_MEETING_MESSAGE_LENGTH = 500
export const MIN_PROPOSED_SLOTS = 1
export const MAX_PROPOSED_SLOTS = 5
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

/** Statuses in which a request is still alive for its requester. */
const OPEN_REQUEST_STATUSES = ['pending', 'time_proposed', 'confirmed'] as const

/**
 * Validates proposed slots and returns them without any extra fields a client
 * may have sent along. One slot is enough: the chat opens once the owner
 * accepts, so the two sides can still agree on another time.
 */
function normalizeProposedSlots(slots: unknown): ITimeSlot[] {
  if (!Array.isArray(slots) || slots.length < MIN_PROPOSED_SLOTS) {
    throw makeError('Propose at least one time slot', 400)
  }
  if (slots.length > MAX_PROPOSED_SLOTS) {
    throw makeError(`Propose no more than ${MAX_PROPOSED_SLOTS} time slots`, 400)
  }

  const seen = new Set<string>()
  return slots.map((raw) => {
    const slot = raw as Partial<ITimeSlot> | null
    if (!slot || typeof slot.date !== 'string' || typeof slot.time !== 'string'
        || !DATE_RE.test(slot.date) || !TIME_RE.test(slot.time)) {
      throw makeError('Each proposed time slot must include a valid date and time', 400)
    }
    if (slot.timezone !== undefined && !isValidTimeZone(slot.timezone)) {
      throw makeError('Each proposed time slot must use a valid time zone', 400)
    }

    const instant = slot.timezone
      ? zonedTimeToUtc(slot.date, slot.time, slot.timezone)
      : new Date(`${slot.date}T${slot.time}:00`)
    if (Number.isNaN(instant.getTime()) || instant <= new Date()) {
      throw makeError('Proposed time slots must be in the future', 400)
    }

    const key = `${slot.date}T${slot.time}`
    if (seen.has(key)) throw makeError('Proposed time slots must be unique', 400)
    seen.add(key)

    return slot.timezone
      ? { date: slot.date, time: slot.time, timezone: slot.timezone }
      : { date: slot.date, time: slot.time }
  })
}

/** Adds participant emails and the post's current status (e.g. closed with Partner Found). */
async function withDetails(meetings: IMeeting[]) {
  const userIds = [...new Set(meetings.flatMap(m => [m.requesterId.toString(), m.ownerId.toString()]))]
  const postIds = [...new Set(meetings.map(m => m.postId.toString()))]
  const [users, posts] = await Promise.all([
    User.find({ _id: { $in: userIds } }).select('_id email').lean(),
    Post.find({ _id: { $in: postIds } }).select('_id status').lean(),
  ])
  const emails = new Map(users.map(u => [(u._id as any).toString(), u.email as string]))
  const postStatuses = new Map(posts.map(p => [(p._id as any).toString(), p.status as string]))
  return meetings.map(m => ({
    ...m.toJSON(),
    requesterEmail: (m.requesterEmail || emails.get(m.requesterId.toString()) || ''),
    ownerEmail:     (m.ownerEmail     || emails.get(m.ownerId.toString())     || ''),
    postStatus: postStatuses.get(m.postId.toString()),
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
  if (data.message.length > MAX_MEETING_MESSAGE_LENGTH) throw makeError(`Message must be no more than ${MAX_MEETING_MESSAGE_LENGTH} characters`, 400)
  const proposedSlots = normalizeProposedSlots(data.proposedSlots)

  // One live request per requester per post — including accepted and scheduled ones.
  const existing = await Meeting.exists({
    postId: data.postId,
    requesterId: data.requesterId,
    status: { $in: OPEN_REQUEST_STATUSES },
  })
  if (existing) throw makeError('You already have an open meeting request for this post', 409)

  const meeting = await Meeting.create({ ...data, proposedSlots, status: 'pending' })
  await incrementMeetingCount(data.postId)

  pushNotification({
    userId: data.ownerId,
    type: 'meeting_request',
    contentKey: 'meeting_request',
    metadata: { actorName: data.requesterName, postTitle: data.postTitle },
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
  return (await withDetails([meeting]))[0]
}

export async function getMeetingsByUser(userId: string) {
  const meetings = await Meeting.find({
    $or: [{ requesterId: userId }, { ownerId: userId }],
  }).sort({ createdAt: -1 })
  return withDetails(meetings)
}

export async function getMeetingsByPost(postId: string) {
  const meetings = await Meeting.find({ postId }).sort({ createdAt: -1 })
  return withDetails(meetings)
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

// Step 1: owner accepts request → pending → time_proposed (no slot chosen yet).
// The conversation opens here, so both sides can agree on a time before one is confirmed.
export async function acceptMeeting(id: string, ownerId: string) {
  const meeting = await Meeting.findOneAndUpdate(
    { _id: id, ownerId, status: 'pending' },
    { $set: { status: 'time_proposed' } },
    { new: true },
  )
  if (!meeting) return await resolveUpdateFailure(id, ownerId, 'ownerId', 'accept')

  await ensureMeetingConversation(meeting)

  pushNotification({
    userId: meeting.requesterId.toString(),
    type: 'meeting_accepted',
    contentKey: 'meeting_accepted_waiting',
    metadata: { actorName: meeting.ownerName, postTitle: meeting.postTitle },
    title: 'Toplantı kabul edildi',
    body: `${meeting.ownerName} toplantı talebinizi kabul etti. Zaman dilimi onayını bekliyor. "${meeting.postTitle}"`,
    linkTo: `/meetings`,
  }).catch(() => {})

  return (await withDetails([meeting]))[0]
}

// Step 2: owner confirms a slot → time_proposed → confirmed
export async function confirmMeetingSlot(id: string, ownerId: string, slot: ITimeSlot) {
  const existing = await Meeting.findOne({ _id: id, ownerId, status: 'time_proposed' })
  if (!existing) await resolveUpdateFailure(id, ownerId, 'ownerId', 'confirm')

  const proposedSlot = existing!.proposedSlots.find(
    proposed => proposed.date === slot.date && proposed.time === slot.time,
  )
  if (!proposedSlot) throw makeError('Confirmed slot must be one of the proposed slots', 400)

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
  // Store the proposed slot itself so its time zone travels with the confirmation.
  existing!.confirmedSlot = { date: proposedSlot.date, time: proposedSlot.time, timezone: proposedSlot.timezone }
  const meeting = await existing!.save()

  // Other requests for the same post stay open: an owner may meet several
  // candidates before deciding. Marking the post "Partner Found" closes them.
  await recomputePostStatus(meeting.postId.toString())

  // Meetings accepted before the chat opened on acceptance may still lack one.
  await ensureMeetingConversation(meeting)

  pushNotification({
    userId: meeting.requesterId.toString(),
    type: 'meeting_accepted',
    contentKey: 'meeting_accepted',
    metadata: { actorName: meeting.ownerName, postTitle: meeting.postTitle },
    title: 'Toplantı kabul edildi',
    body: `${meeting.ownerName} toplantı talebinizi kabul etti. "${meeting.postTitle}"`,
    linkTo: `/meetings`,
  }).catch(() => {})

  return (await withDetails([meeting]))[0]
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

  await recomputePostStatus(meeting!.postId.toString())
  pushNotification({
    userId: meeting!.requesterId.toString(),
    type: 'meeting_declined',
    contentKey: 'meeting_declined',
    metadata: { actorName: meeting!.ownerName, postTitle: meeting!.postTitle },
    title: 'Toplantı reddedildi',
    body: `${meeting!.ownerName} toplantı talebinizi reddetti. "${meeting!.postTitle}"`,
    linkTo: `/meetings`,
  }).catch(() => {})

  return (await withDetails([meeting!]))[0]
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

  await recomputePostStatus(meeting!.postId.toString())

  const isRequester = meeting!.requesterId.toString() === userId
  pushNotification({
    userId: isRequester ? meeting!.ownerId.toString() : meeting!.requesterId.toString(),
    type: 'meeting_cancelled',
    contentKey: 'meeting_cancelled',
    metadata: { actorName: isRequester ? meeting!.requesterName : meeting!.ownerName, postTitle: meeting!.postTitle },
    title: 'Toplantı iptal edildi',
    body: `${isRequester ? meeting!.requesterName : meeting!.ownerName} toplantı talebini iptal etti. "${meeting!.postTitle}"`,
    linkTo: `/meetings`,
  }).catch(() => {})

  return (await withDetails([meeting!]))[0]
}

// The requester offers new times — while the owner is still choosing (none of
// the first ones fit) or after a time was confirmed (plans changed).
export async function rescheduleMeeting(id: string, requesterId: string, slots: unknown) {
  const proposedSlots = normalizeProposedSlots(slots)
  const meeting = await Meeting.findOneAndUpdate(
    { _id: id, requesterId, status: { $in: ['time_proposed', 'confirmed'] } },
    { $set: { status: 'time_proposed', proposedSlots }, $unset: { confirmedSlot: 1 } },
    { new: true },
  )
  if (!meeting) await resolveUpdateFailure(id, requesterId, 'requesterId', 'reschedule')

  await recomputePostStatus(meeting!.postId.toString())
  pushNotification({
    userId: meeting!.ownerId.toString(),
    type: 'meeting_request',
    contentKey: 'meeting_reschedule_requested',
    metadata: { actorName: meeting!.requesterName, postTitle: meeting!.postTitle },
    title: 'Toplantı yeniden zamanlanma isteği',
    body: `${meeting!.requesterName} toplantıyı yeniden zamanlamak istiyor. "${meeting!.postTitle}"`,
    linkTo: `/meetings`,
  }).catch(() => {})

  return (await withDetails([meeting!]))[0]
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

  // Holding a meeting is not the same as finding a partner. Only the post's
  // author closes the post, explicitly, via "Partner Found".
  await recomputePostStatus(meeting!.postId.toString())

  const isRequester = meeting!.requesterId.toString() === userId
  pushNotification({
    userId: isRequester ? meeting!.ownerId.toString() : meeting!.requesterId.toString(),
    type: 'meeting_completed',
    contentKey: 'meeting_completed',
    metadata: { actorName: isRequester ? meeting!.requesterName : meeting!.ownerName, postTitle: meeting!.postTitle },
    title: 'Görüşme tamamlandı',
    body: `${isRequester ? meeting!.requesterName : meeting!.ownerName} görüşmeyi tamamlandı olarak işaretledi. "${meeting!.postTitle}"`,
    linkTo: `/meetings`,
  }).catch(() => {})

  // Recalculate badges for both participants
  recalculateBadges(meeting!.requesterId.toString()).catch(() => {})
  recalculateBadges(meeting!.ownerId.toString()).catch(() => {})

  return (await withDetails([meeting!]))[0]
}
