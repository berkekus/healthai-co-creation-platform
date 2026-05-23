import { create } from 'zustand'
import api from '../lib/api'
import type { Conversation, Message } from '../types/conversation.types'
import { getSocket } from '../lib/socket'

interface ConversationState {
  conversations: Conversation[]
  messages: Record<string, Message[]>
  unreadCount: number
  isLoading: boolean
  error: string | null

  fetchConversations: () => Promise<void>
  fetchMessages: (conversationId: string) => Promise<void>
  sendMessage: (conversationId: string, content: string) => Promise<void>
  markRead: (conversationId: string) => Promise<void>
  fetchUnreadCount: () => Promise<void>
  deleteConversation: (conversationId: string) => Promise<void>
  getByMeetingId: (meetingId: string) => Conversation | undefined
}

export const useConversationStore = create<ConversationState>()((set, get) => ({
  conversations: [],
  messages: {},
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchConversations: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.get<{ success: boolean; data: Conversation[] }>('/conversations')
      set({ conversations: data.data, isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message })
    }
  },

  fetchMessages: async (conversationId) => {
    try {
      const { data } = await api.get<{ success: boolean; data: Message[] }>(`/conversations/${conversationId}/messages`)
      set(state => ({ messages: { ...state.messages, [conversationId]: data.data } }))
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },

  sendMessage: async (conversationId, content) => {
    const { data } = await api.post<{ success: boolean; data: Message }>(`/conversations/${conversationId}/messages`, { content })
    set(state => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] ?? []), data.data],
      },
      conversations: state.conversations.map(c =>
        c.id === conversationId
          ? { ...c, lastMessagePreview: content.slice(0, 80), lastMessageAt: new Date().toISOString() }
          : c,
      ),
    }))
  },

  markRead: async (conversationId) => {
    await api.put(`/conversations/${conversationId}/read`).catch(() => {})
    get().fetchUnreadCount()
  },

  fetchUnreadCount: async () => {
    try {
      const { data } = await api.get<{ success: boolean; data: { count: number } }>('/conversations/unread')
      set({ unreadCount: data.data.count })
    } catch {
      // silent
    }
  },

  deleteConversation: async (conversationId) => {
    await api.delete(`/conversations/${conversationId}`)
    set(state => ({
      conversations: state.conversations.filter(c => c.id !== conversationId),
      messages: Object.fromEntries(
        Object.entries(state.messages).filter(([k]) => k !== conversationId)
      ),
    }))
  },

  getByMeetingId: (meetingId) => {
    return get().conversations.find(c => c.meetingId === meetingId)
  },
}))

// Subscribe to real-time messages via Socket.io
// Called once after login/hydrate — safe to call multiple times (guard on socket)
export function subscribeToSocketMessages(): () => void {
  const socket = getSocket()
  if (!socket) return () => {}

  const handler = ({ conversationId, message }: { conversationId: string; message: Message }) => {
    useConversationStore.setState(state => {
      const existing = state.messages[conversationId] ?? []
      const alreadyExists = existing.some(m => m.id === message.id)
      if (alreadyExists) return state
      return {
        messages: { ...state.messages, [conversationId]: [...existing, message] },
        conversations: state.conversations.map(c =>
          c.id === conversationId
            ? { ...c, lastMessagePreview: message.content.slice(0, 80), lastMessageAt: message.createdAt }
            : c,
        ),
        unreadCount: state.unreadCount + 1,
      }
    })
  }

  socket.on('new_message', handler)
  return () => { socket.off('new_message', handler) }
}
