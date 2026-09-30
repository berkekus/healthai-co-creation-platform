import { afterEach, describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useCanGoBack } from '../hooks/useCanGoBack'

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>

describe('useCanGoBack', () => {
  afterEach(() => window.history.replaceState(null, ''))

  it('is false when the tab entered the app on this page, e.g. from an outside link', () => {
    window.history.replaceState({ idx: 0 }, '')
    expect(renderHook(() => useCanGoBack(), { wrapper }).result.current).toBe(false)
  })

  it('is false when there is no router history state at all', () => {
    window.history.replaceState(null, '')
    expect(renderHook(() => useCanGoBack(), { wrapper }).result.current).toBe(false)
  })

  it('is true after navigating within the app', () => {
    window.history.replaceState({ idx: 2 }, '')
    expect(renderHook(() => useCanGoBack(), { wrapper }).result.current).toBe(true)
  })
})
