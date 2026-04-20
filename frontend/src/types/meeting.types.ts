export type MeetingStatus = 'pending' | 'time_proposed' | 'confirmed' | 'declined' | 'cancelled'

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
  ownerId: string
  ownerName: string
  status: MeetingStatus
  message: string
  ndaAccepted: boolean
  proposedSlots: TimeSlot[]
  confirmedSlot?: TimeSlot
  createdAt: string
  updatedAt: string
}

export interface MeetingRequestData {
  postId: string
  message: string
  ndaAccepted: boolean
  proposedSlots: TimeSlot[]
}
