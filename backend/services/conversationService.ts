import Conversation from '../models/Conversation'
import Message from '../models/Message'
import { makeError } from '../utils/AppError'
import { pushNotification } from './notificationService'
import { emitToUser } from '../src/socket'

export async function createConversation(data: {
  meetingId: string
  postId: string
  postTitle: string
  requesterId: string
  requesterName: string
  requesterRole: string
  ownerId: string
  ownerName: string
  ownerRole: string
}) {
  return Conversation.findOneAndUpdate(
    { meetingId: data.meetingId },
    {
      $setOnInsert: {
        meetingId: data.meetingId,
        postId: data.postId,
        postTitle: data.postTitle,
        participants: [data.requesterId, data.ownerId],
        participantDetails: [
          { userId: data.requesterId, name: data.requesterName, role: data.requesterRole },
          { userId: data.ownerId, name: data.ownerName, role: data.ownerRole },
        ],
        lastMessageAt: new Date(),
        lastMessagePreview: '',
      },
    },
    { upsert: true, new: true },
  )
}

export async function getConversationsByUser(userId: string) {
  const convs = await Conversation.find({ participants: userId }).sort({ lastMessageAt: -1 })
  return convs.map(c => c.toJSON())
}

export async function getConversationById(id: string, userId: string) {
  const conv = await Conversation.findById(id)
  if (!conv) throw makeError('Conversation not found', 404)
  const isParticipant = conv.participants.some(p => p.toString() === userId)
  if (!isParticipant) throw makeError('Forbidden', 403)
  return conv
}

export async function getConversationByMeetingId(meetingId: string, userId: string) {
  const conv = await Conversation.findOne({ meetingId })
  if (!conv) throw makeError('Conversation not found', 404)
  const isParticipant = conv.participants.some(p => p.toString() === userId)
  if (!isParticipant) throw makeError('Forbidden', 403)
  return conv
}

export async function getMessages(conversationId: string, userId: string) {
  await getConversationById(conversationId, userId)
  const msgs = await Message.find({ conversationId }).sort({ createdAt: 1 })
  return msgs.map(m => m.toJSON())
}

export async function sendMessage(conversationId: string, senderId: string, senderName: string, content: string) {
  const trimmed = content.trim()
  if (!trimmed) throw makeError('Message cannot be empty', 400)
  if (trimmed.length > 4000) throw makeError('Message too long (max 4000 characters)', 400)

  const conv = await getConversationById(conversationId, senderId)

  const doc = await Message.create({
    conversationId,
    senderId,
    senderName,
    content: trimmed,
    readBy: [senderId],
  })
  const message = doc.toJSON()

  await Conversation.updateOne(
    { _id: conversationId },
    {
      lastMessageAt: new Date(),
      lastMessagePreview: trimmed.length > 80 ? trimmed.slice(0, 80) + '…' : trimmed,
    },
  )

  const otherId = conv.participants.find(p => p.toString() !== senderId)?.toString()
  if (otherId) {
    // Emit real-time event to recipient
    emitToUser(otherId, 'new_message', {
      conversationId,
      message,
    })

    pushNotification({
      userId: otherId,
      type: 'meeting_request',
      title: `New message from ${senderName}`,
      body: trimmed.length > 60 ? trimmed.slice(0, 60) + '…' : trimmed,
      linkTo: `/messages/${conversationId}`,
    }).catch(() => {})
  }

  return message
}

export async function markAsRead(conversationId: string, userId: string) {
  await getConversationById(conversationId, userId)
  await Message.updateMany(
    { conversationId, readBy: { $ne: userId } },
    { $addToSet: { readBy: userId } },
  )
}

export async function deleteConversation(id: string, userId: string) {
  const conv = await getConversationById(id, userId)
  await Message.deleteMany({ conversationId: conv._id })
  await Conversation.findByIdAndDelete(conv._id)
}

export async function getUnreadCount(userId: string): Promise<number> {
  const convIds = (await Conversation.find({ participants: userId }).select('_id').lean())
    .map(c => c._id)

  if (convIds.length === 0) return 0

  return Message.countDocuments({
    conversationId: { $in: convIds },
    senderId: { $ne: userId },
    readBy: { $ne: userId },
  })
}
