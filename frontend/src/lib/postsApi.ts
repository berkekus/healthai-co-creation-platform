import api from './api'
import type { Post } from '../types/post.types'

export type PostSort = 'newest' | 'oldest' | 'expiring' | 'relevance'

export interface PostListParams {
  page: number
  limit: number
  mine?: boolean
  search?: string
  domain?: string
  projectStage?: string
  status?: string
  authorRole?: 'engineer' | 'healthcare_professional'
  location?: string
  sort?: PostSort
}

export interface PostListResult {
  posts: (Post & { matchScore?: number })[]
  total: number
  page: number
  limit: number
  pages: number
}

export function normalisePost<T extends Post & { _id?: string }>(raw: T): T {
  return { ...raw, id: raw._id ?? raw.id }
}

export async function fetchPostList(params: PostListParams, signal?: AbortSignal): Promise<PostListResult> {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '' || value === false) continue
    query.set(key, String(value))
  }
  const { data } = await api.get<{ success: boolean; data: PostListResult }>(`/posts?${query}`, { signal })
  return { ...data.data, posts: data.data.posts.map(normalisePost) }
}

export async function fetchPost(id: string, signal?: AbortSignal): Promise<Post> {
  const { data } = await api.get<{ success: boolean; data: Post & { _id?: string } }>(`/posts/${id}`, { signal })
  return normalisePost(data.data)
}
