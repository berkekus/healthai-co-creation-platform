import { create } from 'zustand'
import type { Post, PostFilters, PostCreateData, PostAuthorRole } from '../types/post.types'
import api from '../lib/api'

interface PostState {
  posts: Post[]
  filters: PostFilters
  isLoading: boolean
  fetchPosts: () => Promise<void>
  setFilters: (f: Partial<PostFilters>) => void
  clearFilters: () => void
  getFiltered: () => Post[]
  getById: (id: string) => Post | undefined
  create: (data: PostCreateData, authorId: string, authorName: string, authorRole: PostAuthorRole) => Promise<Post>
  update: (id: string, data: Partial<Post>) => Promise<void>
  markPartnerFound: (id: string) => Promise<void>
  publish: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

function applyFilters(posts: Post[], f: PostFilters): Post[] {
  return posts.filter(p => {
    if (f.domain      && !p.domain.toLowerCase().includes(f.domain.toLowerCase())) return false
    if (f.expertise   && !p.expertiseRequired.toLowerCase().includes(f.expertise.toLowerCase())) return false
    if (f.city        && p.city.toLowerCase() !== f.city.toLowerCase()) return false
    if (f.country     && p.country.toLowerCase() !== f.country.toLowerCase()) return false
    if (f.projectStage && p.projectStage !== f.projectStage) return false
    if (f.status      && p.status !== f.status) return false
    if (f.authorRole  && p.authorRole !== f.authorRole) return false
    if (f.search) {
      const q = f.search.toLowerCase()
      if (!p.title.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false
    }
    return true
  })
}

function normalise(raw: Post & { _id?: string }): Post {
  return { ...raw, id: raw._id ?? raw.id }
}

export const usePostStore = create<PostState>()((set, get) => ({
  posts: [],
  filters: {},
  isLoading: false,

  fetchPosts: async () => {
    set({ isLoading: true })
    try {
      const { data } = await api.get<{ success: boolean; data: Post[] }>('/posts')
      set({ posts: data.data.map(normalise), isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  setFilters: (f) => set(s => ({ filters: { ...s.filters, ...f } })),
  clearFilters: () => set({ filters: {} }),
  getFiltered: () => applyFilters(get().posts, get().filters),
  getById: (id) => get().posts.find(p => p.id === id),

  create: async (data, _authorId, authorName, authorRole) => {
    const { data: res } = await api.post<{ success: boolean; data: Post }>('/posts', {
      ...data,
      authorName,
      authorRole,
    })
    const post = normalise(res.data)
    set(s => ({ posts: [post, ...s.posts] }))
    return post
  },

  update: async (id, data) => {
    const { data: res } = await api.put<{ success: boolean; data: Post }>(`/posts/${id}`, data)
    const updated = normalise(res.data)
    set(s => ({ posts: s.posts.map(p => p.id === id ? updated : p) }))
  },

  markPartnerFound: async (id) => {
    const { data: res } = await api.post<{ success: boolean; data: Post }>(`/posts/${id}/partner-found`)
    const updated = normalise(res.data)
    set(s => ({ posts: s.posts.map(p => p.id === id ? updated : p) }))
  },

  publish: async (id) => {
    const { data: res } = await api.post<{ success: boolean; data: Post }>(`/posts/${id}/publish`)
    const updated = normalise(res.data)
    set(s => ({ posts: s.posts.map(p => p.id === id ? updated : p) }))
  },

  remove: async (id) => {
    await api.delete(`/posts/${id}`)
    set(s => ({ posts: s.posts.filter(p => p.id !== id) }))
  },
}))
