import { create } from 'zustand'
import type { Meeting, MeetingRequestData, TimeSlot } from '../types/meeting.types'
import api from '../lib/api'

interface MeetingState {
  meetings: Meeting[]
  fetchByUser: (userId?: string) => Promise<void>
  request: (data: MeetingRequestData, requesterId: string, requesterName: string, ownerId: string, ownerName: string, postTitle: string) => Promise<Meeting>
  accept: (id: string) => Promise<void>
  confirm: (id: string, slot: TimeSlot) => Promise<void>
  decline: (id: string, reason?: string) => Promise<void>
  cancel: (id: string, reason?: string) => Promise<void>
  complete: (id: string) => Promise<void>
  getByUser: (userId: string) => Meeting[]
  getByPost: (postId: string) => Meeting[]
}

function normalise(raw: Meeting & { _id?: string }): Meeting {
  return { ...raw, id: raw._id ?? raw.id }
}

export const useMeetingStore = create<MeetingState>()((set, get) => ({
  meetings: [],

  fetchByUser: async (_userId?: string) => {
    try {
      const { data } = await api.get<{ success: boolean; data: Meeting[] }>('/meetings')
      set({ meetings: data.data.map(normalise) })
    } catch {
      // keep existing state on error
    }
  },

  request: async (data, _requesterId, requesterName, ownerId, ownerName, postTitle) => {
    const { data: res } = await api.post<{ success: boolean; data: Meeting }>('/meetings', {
      postId: data.postId,
      postTitle,
      requesterName,
      ownerId,
      ownerName,
      message: data.message,
      ndaAccepted: data.ndaAccepted,
      proposedSlots: data.proposedSlots,
    })
    const meeting = normalise(res.data)
    set(s => ({ meetings: [meeting, ...s.meetings] }))
    return meeting
  },

  accept: async (id) => {
    const { data: res } = await api.post<{ success: boolean; data: Meeting }>(`/meetings/${id}/accept`)
    const updated = normalise(res.data)
    set(s => ({ meetings: s.meetings.map(m => m.id === id ? updated : m) }))
  },

  confirm: async (id, slot) => {
    const { data: res } = await api.post<{ success: boolean; data: Meeting }>(`/meetings/${id}/confirm`, { slot })
    const updated = normalise(res.data)
    set(s => ({ meetings: s.meetings.map(m => m.id === id ? updated : m) }))
  },

  decline: async (id, reason) => {
    const { data: res } = await api.post<{ success: boolean; data: Meeting }>(`/meetings/${id}/decline`, reason ? { reason } : undefined)
    const updated = normalise(res.data)
    set(s => ({ meetings: s.meetings.map(m => m.id === id ? updated : m) }))
  },

  cancel: async (id, reason) => {
    const { data: res } = await api.post<{ success: boolean; data: Meeting }>(`/meetings/${id}/cancel`, reason ? { reason } : undefined)
    const updated = normalise(res.data)
    set(s => ({ meetings: s.meetings.map(m => m.id === id ? updated : m) }))
  },

  complete: async (id) => {
    const { data: res } = await api.post<{ success: boolean; data: Meeting }>(`/meetings/${id}/complete`)
    const updated = normalise(res.data)
    set(s => ({ meetings: s.meetings.map(m => m.id === id ? updated : m) }))
  },

  getByUser: (userId) => get().meetings.filter(m => m.requesterId === userId || m.ownerId === userId),
  getByPost: (postId) => get().meetings.filter(m => m.postId === postId),
}))
