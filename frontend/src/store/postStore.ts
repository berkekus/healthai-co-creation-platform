import { create } from 'zustand'
import type { Post, PostCreateData, PostAuthorRole } from '../types/post.types'
import api from '../lib/api'
import { queryClient, postKeys } from '../lib/queryClient'
import { normalisePost } from '../lib/postsApi'

/**
 * Post changes. Pages read posts through usePostList / usePost (TanStack Query, server-paged); each
 * successful change here marks those cached lists and details stale so they refetch.
 */
interface PostState {
  create: (data: PostCreateData, authorId: string, authorName: string, authorRole: PostAuthorRole) => Promise<Post>
  update: (id: string, data: Partial<Post>) => Promise<void>
  markPartnerFound: (id: string) => Promise<void>
  /** Undo "Partner Found"; an expired post needs a new expiry date. */
  reopen: (id: string, expiryDate?: string) => Promise<void>
  publish: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
  expressInterest: (id: string) => Promise<void>
}

const invalidatePostQueries = () => { void queryClient.invalidateQueries({ queryKey: postKeys.all }) }

export const usePostStore = create<PostState>()(() => ({
  create: async (data, _authorId, authorName, authorRole) => {
    const { data: res } = await api.post<{ success: boolean; data: Post }>('/posts', {
      ...data,
      authorName,
      authorRole,
    })
    invalidatePostQueries()
    return normalisePost(res.data)
  },

  update: async (id, data) => {
    await api.put<{ success: boolean; data: Post }>(`/posts/${id}`, data)
    invalidatePostQueries()
  },

  markPartnerFound: async (id) => {
    await api.post<{ success: boolean; data: Post }>(`/posts/${id}/partner-found`)
    invalidatePostQueries()
  },

  reopen: async (id, expiryDate) => {
    await api.post<{ success: boolean; data: Post }>(`/posts/${id}/reopen`, expiryDate ? { expiryDate } : undefined)
    invalidatePostQueries()
  },

  publish: async (id) => {
    await api.post<{ success: boolean; data: Post }>(`/posts/${id}/publish`)
    invalidatePostQueries()
  },

  remove: async (id) => {
    await api.delete(`/posts/${id}`)
    invalidatePostQueries()
  },

  expressInterest: async (id) => {
    await api.post<{ success: boolean; data: Post }>(`/posts/${id}/interest`)
    invalidatePostQueries()
  },
}))
