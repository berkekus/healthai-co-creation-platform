import type { PostStatus } from './post.types'

export type MeetingStatus = 'pending' | 'time_proposed' | 'confirmed' | 'completed' | 'declined' | 'cancelled'

export interface TimeSlot {
  /** YYYY-MM-DD */
  date: string
  /** HH:MM, 24-hour clock */
  time: string
  /** IANA zone the slot was proposed in; absent on older slots. */
  timezone?: string
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
  /** Current status of the post; tells whether it was already closed with Partner Found. */
  postStatus?: PostStatus
  createdAt: string
  updatedAt: string
}

export interface MeetingRequestData {
  postId: string
  message: string
  ndaAccepted: boolean
  proposedSlots: TimeSlot[]
}
