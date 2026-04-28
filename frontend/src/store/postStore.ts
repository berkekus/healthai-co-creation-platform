import { create } from 'zustand'
import type { Post, PostFilters, PostCreateData, PostAuthorRole } from '../types/post.types'
import api from '../lib/api'

interface PaginationMeta {
  total: number
  page: number
  limit: number
  pages: number
}

interface PostState {
  posts: Post[]
  filters: PostFilters
  pagination: PaginationMeta
  isLoading: boolean
  fetchPosts: (opts?: { page?: number; limit?: number }) => Promise<void>
  setFilters: (f: Partial<PostFilters>) => void
  clearFilters: () => void
  getFiltered: () => Post[]
  getById: (id: string) => Post | undefined
  create: (data: PostCreateData, authorId: string, authorName: string, authorRole: PostAuthorRole) => Promise<Post>
  update: (id: string, data: Partial<Post>) => Promise<void>
  markPartnerFound: (id: string) => Promise<void>
  publish: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
  expressInterest: (id: string) => Promise<void>
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

interface PostsResponse {
  posts: Post[]
  total: number
  page: number
  limit: number
  pages: number
}

export const usePostStore = create<PostState>()((set, get) => ({
  posts: [],
  filters: {},
  pagination: { total: 0, page: 1, limit: 20, pages: 0 },
  isLoading: false,

  fetchPosts: async (opts = {}) => {
    set({ isLoading: true })
    try {
      const { filters } = get()
      const page  = opts.page  ?? 1
      const limit = opts.limit ?? 20
      const params = new URLSearchParams()
      params.set('page',  String(page))
      params.set('limit', String(limit))
      if (filters.domain)       params.set('domain',       filters.domain)
      if (filters.expertise)    params.set('expertise',    filters.expertise)
      if (filters.city)         params.set('city',         filters.city)
      if (filters.country)      params.set('country',      filters.country)
      if (filters.projectStage) params.set('projectStage', filters.projectStage)
      if (filters.status)       params.set('status',       filters.status)
      if (filters.authorRole)   params.set('authorRole',   filters.authorRole)
      if (filters.search)       params.set('search',       filters.search)

      const { data } = await api.get<{ success: boolean; data: PostsResponse }>(`/posts?${params}`)
      const { posts, ...meta } = data.data
      set({ posts: posts.map(normalise), pagination: meta, isLoading: false })
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

  expressInterest: async (id) => {
    const { data: res } = await api.post<{ success: boolean; data: Post }>(`/posts/${id}/interest`)
    const updated = normalise(res.data)
    set(s => ({ posts: s.posts.map(p => p.id === id ? updated : p) }))
  },
}))
