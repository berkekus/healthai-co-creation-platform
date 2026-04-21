import { create } from 'zustand'
import type { Meeting, MeetingRequestData, TimeSlot } from '../types/meeting.types'
import { mockMeetings } from '../data/mockMeetings'

interface MeetingState {
  meetings: Meeting[]
  request: (data: MeetingRequestData, requesterId: string, requesterName: string, ownerId: string, ownerName: string, postTitle: string) => Meeting
  accept: (id: string, slot: TimeSlot) => void
  decline: (id: string) => void
  cancel: (id: string) => void
  getByUser: (userId: string) => Meeting[]
  getByPost: (postId: string) => Meeting[]
}

export const useMeetingStore = create<MeetingState>()((set, get) => ({
  meetings: [...mockMeetings],

  request: (data, requesterId, requesterName, ownerId, ownerName, postTitle) => {
    const m: Meeting = {
      id: `m${Date.now()}`,
      postId: data.postId,
      postTitle,
      requesterId,
      requesterName,
      ownerId,
      ownerName,
      status: 'pending',
      message: data.message,
      ndaAccepted: data.ndaAccepted,
      proposedSlots: data.proposedSlots,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set(s => ({ meetings: [m, ...s.meetings] }))
    return m
  },

  accept: (id, slot) => set(s => ({
    meetings: s.meetings.map(m => m.id === id
      ? { ...m, status: 'confirmed', confirmedSlot: slot, updatedAt: new Date().toISOString() }
      : m),
  })),

  decline: (id) => set(s => ({
    meetings: s.meetings.map(m => m.id === id
      ? { ...m, status: 'declined', updatedAt: new Date().toISOString() }
      : m),
  })),

  cancel: (id) => set(s => ({
    meetings: s.meetings.map(m => m.id === id
      ? { ...m, status: 'cancelled', updatedAt: new Date().toISOString() }
      : m),
  })),

  getByUser: (userId) => get().meetings.filter(m => m.requesterId === userId || m.ownerId === userId),
  getByPost: (postId) => get().meetings.filter(m => m.postId === postId),
}))
