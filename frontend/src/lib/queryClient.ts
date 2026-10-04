import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    // Lists are cheap to refetch; 30 s keeps quick back-and-forth navigation instant.
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
})

export const postKeys = {
  all: ['posts'] as const,
  list: (params: object) => ['posts', 'list', params] as const,
  detail: (id: string) => ['posts', 'detail', id] as const,
}
