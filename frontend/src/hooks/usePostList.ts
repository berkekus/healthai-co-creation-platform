import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchPostList, type PostListParams } from '../lib/postsApi'
import { postKeys } from '../lib/queryClient'

/** One cache entry per filter/sort/page combination; the previous page stays on screen while the next loads. */
export function usePostList(params: PostListParams) {
  return useQuery({
    queryKey: postKeys.list(params),
    queryFn: ({ signal }) => fetchPostList(params, signal),
    placeholderData: keepPreviousData,
  })
}
