import { create } from 'zustand'
import type { Post, PostFilters, PostCreateData, PostAuthorRole } from '../types/post.types'
import { mockPosts } from '../data/mockPosts'

interface PostState {
  posts: Post[]
  filters: PostFilters
  isLoading: boolean
  setFilters: (f: Partial<PostFilters>) => void
  clearFilters: () => void
  getFiltered: () => Post[]
  getById: (id: string) => Post | undefined
  create: (data: PostCreateData, authorId: string, authorName: string, authorRole: PostAuthorRole) => Post
  update: (id: string, data: Partial<Post>) => void
  markPartnerFound: (id: string) => void
  publish: (id: string) => void
  remove: (id: string) => void
}

function applyFilters(posts: Post[], f: PostFilters): Post[] {
  return posts.filter(p => {
    if (f.domain     && !p.domain.toLowerCase().includes(f.domain.toLowerCase())) return false
    if (f.expertise  && !p.expertiseRequired.toLowerCase().includes(f.expertise.toLowerCase())) return false
    if (f.city       && p.city.toLowerCase() !== f.city.toLowerCase()) return false
    if (f.country    && p.country.toLowerCase() !== f.country.toLowerCase()) return false
    if (f.projectStage && p.projectStage !== f.projectStage) return false
    if (f.status     && p.status !== f.status) return false
    if (f.authorRole && p.authorRole !== f.authorRole) return false
    if (f.search) {
      const q = f.search.toLowerCase()
      if (!p.title.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false
    }
    return true
  })
}

export const usePostStore = create<PostState>()((set, get) => ({
  posts: [...mockPosts],
  filters: {},
  isLoading: false,

  setFilters: (f) => set(s => ({ filters: { ...s.filters, ...f } })),
  clearFilters: () => set({ filters: {} }),
  getFiltered: () => applyFilters(get().posts, get().filters),
  getById: (id) => get().posts.find(p => p.id === id),

  create: (data, authorId, authorName, authorRole) => {
    const post: Post = {
      id: `p${Date.now()}`,
      ...data,
      authorId,
      authorName,
      authorRole,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      interestCount: 0,
      meetingCount: 0,
    }
    set(s => ({ posts: [post, ...s.posts] }))
    return post
  },

  update: (id, data) => set(s => ({
    posts: s.posts.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p),
  })),

  markPartnerFound: (id) => set(s => ({
    posts: s.posts.map(p => p.id === id ? { ...p, status: 'partner_found', updatedAt: new Date().toISOString() } : p),
  })),

  publish: (id) => set(s => ({
    posts: s.posts.map(p => p.id === id ? { ...p, status: 'active', updatedAt: new Date().toISOString() } : p),
  })),

  remove: (id) => set(s => ({ posts: s.posts.filter(p => p.id !== id) })),
}))
