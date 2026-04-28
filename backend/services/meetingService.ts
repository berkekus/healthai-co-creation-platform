import Meeting, { ITimeSlot } from '../models/Meeting'
import Post from '../models/Post'
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

  // Verify ownerId matches the post's actual author
  const post = await Post.findById(data.postId).select('authorId')
  if (!post) throw makeError('Post not found', 404)
  if (post.authorId.toString() !== data.ownerId) throw makeError('Invalid owner', 400)

  // Prevent duplicate active requests from the same requester
  const existing = await Meeting.exists({
    postId: data.postId,
    requesterId: data.requesterId,
    status: { $in: ['pending', 'time_proposed'] },
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
  const meeting = await Meeting.findOneAndUpdate(
    { _id: id, ownerId, status: { $in: ['pending', 'time_proposed'] } },
    { $set: { status: 'confirmed', confirmedSlot: slot } },
    { new: true },
  )
  if (!meeting) await resolveUpdateFailure(id, ownerId, 'ownerId', 'accept')

  recomputePostStatus(meeting!.postId.toString()).catch(() => {})
  pushNotification({
    userId: meeting!.requesterId.toString(),
    type: 'meeting_accepted',
    title: 'Toplanti kabul edildi',
    body: `${meeting!.ownerName} toplanti talebinizi kabul etti. "${meeting!.postTitle}"`,
    linkTo: `/meetings`,
  }).catch(() => {})

  return meeting!
}

export async function declineMeeting(id: string, ownerId: string) {
  const meeting = await Meeting.findOneAndUpdate(
    { _id: id, ownerId, status: { $in: ['pending', 'time_proposed'] } },
    { $set: { status: 'declined' } },
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

  return meeting!
}

export async function cancelMeeting(id: string, userId: string) {
  const meeting = await Meeting.findOneAndUpdate(
    {
      _id: id,
      $or: [{ requesterId: userId }, { ownerId: userId }],
      status: { $nin: ['declined', 'cancelled'] },
    },
    { $set: { status: 'cancelled' } },
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

  return meeting!
}
