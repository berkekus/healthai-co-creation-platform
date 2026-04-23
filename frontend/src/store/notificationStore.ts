import { create } from 'zustand'
import type { Notification } from '../types/common.types'

const seed: Notification[] = [
  { id: 'n1', userId: 'u1', type: 'meeting_request',  title: 'New meeting request', body: 'Marco Rossi expressed interest in your ECG post.', isRead: false, createdAt: '2026-04-19T09:15:00Z', linkTo: '/meetings' },
  { id: 'n2', userId: 'u1', type: 'meeting_accepted',  title: 'Meeting confirmed',  body: 'Your meeting with Marco Rossi is confirmed for Apr 25.', isRead: false, createdAt: '2026-04-19T09:45:00Z', linkTo: '/meetings' },
  { id: 'n3', userId: 'u2', type: 'meeting_accepted',  title: 'Meeting confirmed',  body: 'Dr. Müller confirmed your meeting slot.', isRead: true,  createdAt: '2026-04-19T09:46:00Z', linkTo: '/meetings' },
  { id: 'n4', userId: 'u3', type: 'meeting_request',  title: 'New meeting request', body: 'Kenji Nakamura expressed interest in your CV pipeline post.', isRead: false, createdAt: '2026-04-18T10:01:00Z', linkTo: '/meetings' },
]

interface NotificationState {
  notifications: Notification[]
  unreadCount: (userId: string) => number
  markRead: (id: string) => void
  markAllRead: (userId: string) => void
  getByUser: (userId: string) => Notification[]
  push: (n: Omit<Notification, 'id' | 'createdAt'>) => void
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: seed,

  unreadCount: (userId) => get().notifications.filter(n => n.userId === userId && !n.isRead).length,
  getByUser: (userId) => get().notifications.filter(n => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

  markRead: (id) => set(s => ({
    notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
  })),

  markAllRead: (userId) => set(s => ({
    notifications: s.notifications.map(n => n.userId === userId ? { ...n, isRead: true } : n),
  })),

  push: (n) => set(s => ({
    notifications: [{ ...n, id: `n${Date.now()}`, createdAt: new Date().toISOString() }, ...s.notifications],
  })),
}))
