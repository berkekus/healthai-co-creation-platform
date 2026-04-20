import { create } from 'zustand'
import type { Notification } from '../types/common.types'
import api from '../lib/api'

interface NotificationState {
  notifications: Notification[]
  fetchByUser: (userId: string) => Promise<void>
  unreadCount: (userId: string) => number
  markRead: (id: string) => Promise<void>
  markAllRead: (userId: string) => Promise<void>
  getByUser: (userId: string) => Notification[]
  push: (n: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>
}

function normalise(raw: Notification & { _id?: string }): Notification {
  return { ...raw, id: raw._id ?? raw.id }
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],

  fetchByUser: async (_userId: string) => {
    try {
      const { data } = await api.get<{ success: boolean; data: Notification[] }>('/notifications')
      set({ notifications: data.data.map(normalise) })
    } catch {
      // keep existing state on error
    }
  },

  unreadCount: (userId) =>
    get().notifications.filter(n => n.userId === userId && !n.isRead).length,

  getByUser: (userId) =>
    get().notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

  markRead: async (id) => {
    await api.post(`/notifications/${id}/read`)
    set(s => ({
      notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
    }))
  },

  markAllRead: async (_userId: string) => {
    await api.post('/notifications/mark-all-read')
    set(s => ({
      notifications: s.notifications.map(n => ({ ...n, isRead: true })),
    }))
  },

  push: async (n) => {
    try {
      const { data } = await api.post<{ success: boolean; data: Notification }>('/notifications', n)
      const notification = normalise(data.data)
      set(s => ({ notifications: [notification, ...s.notifications] }))
    } catch {
      // optimistic fallback — still show locally
      set(s => ({
        notifications: [
          { ...n, id: `n${Date.now()}`, createdAt: new Date().toISOString() },
          ...s.notifications,
        ],
      }))
    }
  },
}))
