import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '../i18n'
import ErrorBoundary from '../components/ui/ErrorBoundary'

let shouldThrow = true
function Flaky({ message = 'boom' }: { message?: string }) {
  if (shouldThrow) throw new Error(message)
  return <p>page content</p>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = true
    // React logs caught render errors; keep the test output readable.
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it('shows a recoverable message instead of a blank page and retries on request', () => {
    render(<ErrorBoundary><Flaky /></ErrorBoundary>)

    expect(screen.getByRole('alert')).toHaveTextContent('This page ran into a problem')
    shouldThrow = false
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(screen.getByText('page content')).toBeInTheDocument()
  })

  it('clears the error when the route changes', () => {
    const { rerender } = render(<ErrorBoundary resetKey="/posts/1"><Flaky /></ErrorBoundary>)
    expect(screen.getByRole('alert')).toBeInTheDocument()

    shouldThrow = false
    rerender(<ErrorBoundary resetKey="/dashboard"><Flaky /></ErrorBoundary>)

    expect(screen.getByText('page content')).toBeInTheDocument()
  })

  it('asks for a reload when a page chunk from an older deploy is gone', () => {
    render(<ErrorBoundary><Flaky message="Failed to fetch dynamically imported module: /assets/PostDetailPage-abc.js" /></ErrorBoundary>)

    expect(screen.getByRole('alert')).toHaveTextContent('A new version of HealthAI was published')
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeInTheDocument()
  })
})
