import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSlowRequestHint } from '../hooks/useSlowRequestHint'

describe('useSlowRequestHint', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('stays false while nothing is pending', () => {
    const { result } = renderHook(() => useSlowRequestHint(false))
    act(() => { vi.advanceTimersByTime(10_000) })
    expect(result.current).toBe(false)
  })

  it('stays false for a request that settles before the delay', () => {
    const { result, rerender } = renderHook(
      ({ pending }) => useSlowRequestHint(pending, 3000),
      { initialProps: { pending: true } },
    )

    act(() => { vi.advanceTimersByTime(2999) })
    expect(result.current).toBe(false)

    rerender({ pending: false })
    act(() => { vi.advanceTimersByTime(10_000) })
    expect(result.current).toBe(false)
  })

  it('flips to true once a pending request outlasts the delay', () => {
    const { result } = renderHook(() => useSlowRequestHint(true, 3000))

    expect(result.current).toBe(false)
    act(() => { vi.advanceTimersByTime(3000) })
    expect(result.current).toBe(true)
  })

  it('resets to false as soon as the request settles', () => {
    const { result, rerender } = renderHook(
      ({ pending }) => useSlowRequestHint(pending, 3000),
      { initialProps: { pending: true } },
    )

    act(() => { vi.advanceTimersByTime(3000) })
    expect(result.current).toBe(true)

    rerender({ pending: false })
    expect(result.current).toBe(false)
  })

  it('honours a custom delay', () => {
    const { result } = renderHook(() => useSlowRequestHint(true, 500))

    act(() => { vi.advanceTimersByTime(499) })
    expect(result.current).toBe(false)
    act(() => { vi.advanceTimersByTime(1) })
    expect(result.current).toBe(true)
  })
})
