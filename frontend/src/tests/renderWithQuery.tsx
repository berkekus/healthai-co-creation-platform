import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '../lib/queryClient'

/**
 * Renders with the app's own query client, so invalidations from stores (after a delete, publish, …) reach
 * the queries under test exactly as in the app. The cache is cleared on every render and failures are not
 * retried, so each test starts from nothing and error states show at once.
 */
export function renderWithQuery(ui: ReactElement) {
  queryClient.clear()
  queryClient.setDefaultOptions({ queries: { staleTime: 30_000, retry: false, refetchOnWindowFocus: false } })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}
