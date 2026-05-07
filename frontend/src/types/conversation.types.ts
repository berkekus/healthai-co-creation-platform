export interface ParticipantDetail {
  userId: string
  name: string
  role: string
}

export interface Conversation {
  id: string
  meetingId: string
  postId: string
  postTitle: string
  participants: string[]
  participantDetails: ParticipantDetail[]
  lastMessageAt: string
  lastMessagePreview: string
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  content: string
  readBy: string[]
  createdAt: string
}
