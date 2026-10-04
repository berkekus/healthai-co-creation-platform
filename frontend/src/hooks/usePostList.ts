import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchPostList, type PostListParams } from '../lib/postsApi'
import { postKeys } from '../lib/queryClient'

/**
 * One cache entry per filter/sort/page combination; the previous page stays on screen while the next loads.
 * `enabled: false` holds the request until the list is actually shown (e.g. an inactive tab).
 */
export function usePostList(params: PostListParams, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: postKeys.list(params),
    queryFn: ({ signal }) => fetchPostList(params, signal),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  })
}
