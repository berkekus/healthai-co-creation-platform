import { describe, it, expect, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

describe('useDebouncedValue', () => {
  it('only publishes the last value after the user pauses', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 300), { initialProps: { v: 'k' } })
    rerender({ v: 'ka' })
    rerender({ v: 'kar' })
    act(() => { vi.advanceTimersByTime(299) })
    expect(result.current).toBe('k')
    act(() => { vi.advanceTimersByTime(1) })
    expect(result.current).toBe('kar')
    vi.useRealTimers()
  })
})
