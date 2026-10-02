import { describe, it, expect, vi } from 'vitest'
import api from '../lib/api'
import { fetchPostList } from '../lib/postsApi'

vi.mock('../lib/api', () => ({ default: { get: vi.fn() } }))

describe('fetchPostList', () => {
  it('sends only the filters that are set and normalises ids', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: { posts: [{ _id: 'p1', title: 'A' }], total: 1, page: 2, limit: 5, pages: 1 } } })

    const result = await fetchPostList({ page: 2, limit: 5, search: 'ecg', domain: '', mine: false, sort: 'expiring' })

    expect(api.get).toHaveBeenCalledWith('/posts?page=2&limit=5&search=ecg&sort=expiring', { signal: undefined })
    expect(result.posts[0].id).toBe('p1')
    expect(result.total).toBe(1)
  })
})
