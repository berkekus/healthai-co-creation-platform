import { useQuery } from '@tanstack/react-query'
import { fetchPost } from '../lib/postsApi'
import { postKeys } from '../lib/queryClient'

export function usePost(id: string | undefined) {
  return useQuery({
    queryKey: postKeys.detail(id ?? ''),
    queryFn: ({ signal }) => fetchPost(id as string, signal),
    enabled: Boolean(id),
  })
}
