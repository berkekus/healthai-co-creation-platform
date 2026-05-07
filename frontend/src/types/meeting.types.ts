export type MeetingStatus = 'pending' | 'confirmed' | 'completed' | 'declined' | 'cancelled'

export interface TimeSlot {
  date: string
  time: string
}

export interface Meeting {
  id: string
  postId: string
  postTitle: string
  requesterId: string
  requesterName: string
  requesterEmail?: string
  ownerId: string
  ownerName: string
  ownerEmail?: string
  status: MeetingStatus
  message: string
  ndaAccepted: boolean
  proposedSlots: TimeSlot[]
  confirmedSlot?: TimeSlot
  declineReason?: string
  cancelReason?: string
  createdAt: string
  updatedAt: string
}

export interface MeetingRequestData {
  postId: string
  message: string
  ndaAccepted: boolean
  proposedSlots: TimeSlot[]
}
