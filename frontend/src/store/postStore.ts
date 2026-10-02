import { create } from 'zustand'
import type { Post, PostFilters, PostCreateData, PostAuthorRole } from '../types/post.types'
import api from '../lib/api'
import { queryClient, postKeys } from '../lib/queryClient'
import { normalisePost } from '../lib/postsApi'

interface PaginationMeta {
  total: number
  page: number
  limit: number
  pages: number
}

// Pages read posts through usePostList / usePost (TanStack Query). `posts` and `fetchPosts` remain only
// for the admin page until it moves to server-side lists as well.
interface PostState {
  posts: Post[]
  pagination: PaginationMeta
  isLoading: boolean
  fetchPosts: (opts?: { page?: number; limit?: number; mine?: boolean; filters?: PostFilters }) => Promise<void>
  create: (data: PostCreateData, authorId: string, authorName: string, authorRole: PostAuthorRole) => Promise<Post>
  update: (id: string, data: Partial<Post>) => Promise<void>
  markPartnerFound: (id: string) => Promise<void>
  /** Undo "Partner Found"; an expired post needs a new expiry date. */
  reopen: (id: string, expiryDate?: string) => Promise<void>
  publish: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
  expressInterest: (id: string) => Promise<void>
}

// Every successful change also marks cached post lists and details stale.
const invalidatePostQueries = () => { void queryClient.invalidateQueries({ queryKey: postKeys.all }) }

interface PostsResponse {
  posts: Post[]
  total: number
  page: number
  limit: number
  pages: number
}

export const usePostStore = create<PostState>()((set) => ({
  posts: [],
  pagination: { total: 0, page: 1, limit: 20, pages: 0 },
  isLoading: false,

  fetchPosts: async (opts = {}) => {
    set({ isLoading: true })
    try {
      const filters = opts.filters ?? {}
      const page  = opts.page  ?? 1
      const limit = opts.limit ?? 20
      const params = new URLSearchParams()
      params.set('page',  String(page))
      params.set('limit', String(limit))
      if (opts.mine) params.set('mine', 'true')
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
      set({ posts: posts.map(normalisePost), pagination: meta, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  create: async (data, _authorId, authorName, authorRole) => {
    const { data: res } = await api.post<{ success: boolean; data: Post }>('/posts', {
      ...data,
      authorName,
      authorRole,
    })
    const post = normalisePost(res.data)
    set(s => ({ posts: [post, ...s.posts] }))
    invalidatePostQueries()
    return post
  },

  update: async (id, data) => {
    const { data: res } = await api.put<{ success: boolean; data: Post }>(`/posts/${id}`, data)
    const updated = normalisePost(res.data)
    set(s => ({ posts: s.posts.map(p => p.id === id ? updated : p) }))
    invalidatePostQueries()
  },

  markPartnerFound: async (id) => {
    const { data: res } = await api.post<{ success: boolean; data: Post }>(`/posts/${id}/partner-found`)
    const updated = normalisePost(res.data)
    set(s => ({ posts: s.posts.map(p => p.id === id ? updated : p) }))
    invalidatePostQueries()
  },

  reopen: async (id, expiryDate) => {
    const { data: res } = await api.post<{ success: boolean; data: Post }>(`/posts/${id}/reopen`, expiryDate ? { expiryDate } : undefined)
    const updated = normalisePost(res.data)
    set(s => ({ posts: s.posts.map(p => p.id === id ? updated : p) }))
    invalidatePostQueries()
  },

  publish: async (id) => {
    const { data: res } = await api.post<{ success: boolean; data: Post }>(`/posts/${id}/publish`)
    const updated = normalisePost(res.data)
    set(s => ({ posts: s.posts.map(p => p.id === id ? updated : p) }))
    invalidatePostQueries()
  },

  remove: async (id) => {
    await api.delete(`/posts/${id}`)
    set(s => ({ posts: s.posts.filter(p => p.id !== id) }))
    invalidatePostQueries()
  },

  expressInterest: async (id) => {
    const { data: res } = await api.post<{ success: boolean; data: Post }>(`/posts/${id}/interest`)
    const updated = normalisePost(res.data)
    set(s => ({ posts: s.posts.map(p => p.id === id ? updated : p) }))
    invalidatePostQueries()
  },
}))
