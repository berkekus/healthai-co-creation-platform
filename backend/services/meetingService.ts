import Meeting, { ITimeSlot } from '../models/Meeting'
import { incrementMeetingCount, recomputePostStatus } from './postService'
import { pushNotification } from './notificationService'

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

  // Meeting onaylandığında post'u meeting_scheduled yap
  recomputePostStatus(meeting.postId.toString()).catch(() => {})

  pushNotification({
    userId: meeting.requesterId.toString(),
    type: 'meeting_accepted',
    title: 'Toplanti kabul edildi',
    body: `${meeting.ownerName} toplanti talebinizi kabul etti. "${meeting.postTitle}"`,
    linkTo: `/meetings`,
  }).catch(() => {})

  return meeting
}

export async function declineMeeting(id: string, ownerId: string) {
  const meeting = await Meeting.findById(id)
  if (!meeting) throw makeError('Meeting not found', 404)
  if (meeting.ownerId.toString() !== ownerId) throw makeError('Forbidden', 403)

  meeting.status = 'declined'
  await meeting.save()

  recomputePostStatus(meeting.postId.toString()).catch(() => {})

  pushNotification({
    userId: meeting.requesterId.toString(),
    type: 'meeting_declined',
    title: 'Toplanti reddedildi',
    body: `${meeting.ownerName} toplanti talebinizi reddetti. "${meeting.postTitle}"`,
    linkTo: `/meetings`,
  }).catch(() => {})

  return meeting
}

export async function cancelMeeting(id: string, userId: string) {
  const meeting = await Meeting.findById(id)
  if (!meeting) throw makeError('Meeting not found', 404)

  const isRequester = meeting.requesterId.toString() === userId
  const isOwner = meeting.ownerId.toString() === userId
  if (!isRequester && !isOwner) throw makeError('Forbidden', 403)

  meeting.status = 'cancelled'
  await meeting.save()

  recomputePostStatus(meeting.postId.toString()).catch(() => {})

  const notifyUserId = isRequester
    ? meeting.ownerId.toString()
    : meeting.requesterId.toString()
  const cancellerName = isRequester ? meeting.requesterName : meeting.ownerName

  pushNotification({
    userId: notifyUserId,
    type: 'meeting_cancelled',
    title: 'Toplanti iptal edildi',
    body: `${cancellerName} toplanti talebini iptal etti. "${meeting.postTitle}"`,
    linkTo: `/meetings`,
  }).catch(() => {})

  return meeting
}
