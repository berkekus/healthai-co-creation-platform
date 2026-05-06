import { create } from 'zustand'
import type { Notification } from '../types/common.types'
import api from '../lib/api'

interface NotificationState {
  notifications: Notification[]
  unreadTotal: number
  fetchByUser: (userId?: string) => Promise<void>
  fetchUnreadCount: () => Promise<void>
  unreadCount: (userId: string) => number
  markRead: (id: string) => Promise<void>
  markAllRead: (userId: string) => Promise<void>
  getByUser: (userId: string) => Notification[]
  push: (n: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  deleteAll: () => Promise<void>
  startPolling: () => void
  stopPolling: () => void
}

function normalise(raw: Notification & { _id?: string }): Notification {
  return { ...raw, id: raw._id ?? raw.id }
}

let _pollInterval: ReturnType<typeof setInterval> | null = null
const POLL_INTERVAL_MS = 30_000

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadTotal: 0,

  fetchByUser: async (_userId?: string) => {
    try {
      const { data } = await api.get<{
        success: boolean
        data: { notifications: Notification[]; total: number; page: number; limit: number; pages: number }
      }>('/notifications')
      set({ notifications: data.data.notifications.map(normalise) })
      get().fetchUnreadCount()
    } catch {
      // keep existing state on error
    }
  },

  fetchUnreadCount: async () => {
    try {
      const { data } = await api.get<{ success: boolean; data: { count: number } }>('/notifications/unread-count')
      set({ unreadTotal: data.data.count })
    } catch {
      // keep existing count on error
    }
  },

  unreadCount: (_userId) => get().unreadTotal,

  getByUser: (userId) =>
    get().notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

  markRead: async (id) => {
    await api.post(`/notifications/${id}/read`)
    set(s => ({
      notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
      unreadTotal: Math.max(0, s.unreadTotal - (s.notifications.find(n => n.id === id && !n.isRead) ? 1 : 0)),
    }))
  },

  markAllRead: async (_userId: string) => {
    await api.post('/notifications/mark-all-read')
    set(s => ({
      notifications: s.notifications.map(n => ({ ...n, isRead: true })),
      unreadTotal: 0,
    }))
  },

  push: async (n) => {
    try {
      const { data } = await api.post<{ success: boolean; data: Notification }>('/notifications', n)
      const notification = normalise(data.data)
      set(s => ({
        notifications: [notification, ...s.notifications],
        unreadTotal: notification.isRead ? s.unreadTotal : s.unreadTotal + 1,
      }))
    } catch {
      // optimistic fallback — still show locally
      set(s => ({
        notifications: [
          { ...n, id: `n${Date.now()}`, createdAt: new Date().toISOString() },
          ...s.notifications,
        ],
        unreadTotal: n.isRead ? s.unreadTotal : s.unreadTotal + 1,
      }))
    }
  },

  deleteNotification: async (id) => {
    await api.delete(`/notifications/${id}`)
    set(s => {
      const deleted = s.notifications.find(n => n.id === id)
      return {
        notifications: s.notifications.filter(n => n.id !== id),
        unreadTotal: Math.max(0, s.unreadTotal - (deleted && !deleted.isRead ? 1 : 0)),
      }
    })
  },

  deleteAll: async () => {
    await api.delete('/notifications')
    set({ notifications: [], unreadTotal: 0 })
  },

  startPolling: () => {
    if (_pollInterval !== null) return
    get().fetchUnreadCount()
    _pollInterval = setInterval(() => get().fetchUnreadCount(), POLL_INTERVAL_MS)
  },

  stopPolling: () => {
    if (_pollInterval !== null) {
      clearInterval(_pollInterval)
      _pollInterval = null
    }
  },
}))
