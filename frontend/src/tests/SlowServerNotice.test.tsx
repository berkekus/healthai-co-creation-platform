import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import '../i18n'
import api from '../lib/api'
import SlowServerNotice from '../components/ui/SlowServerNotice'
import { useNetworkStore } from '../store/networkStore'

const WAKING = /Waking the server/i

describe('SlowServerNotice', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useNetworkStore.setState({ pending: 0, inlineHints: 0 })
  })
  afterEach(() => vi.useRealTimers())

  it('explains the wait once a request has taken longer than three seconds', () => {
    render(<SlowServerNotice />)
    act(() => useNetworkStore.getState().requestStarted())

    act(() => { vi.advanceTimersByTime(2900) })
    expect(screen.queryByText(WAKING)).not.toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(200) })
    expect(screen.getByText(WAKING)).toBeInTheDocument()

    act(() => useNetworkStore.getState().requestFinished())
    expect(screen.queryByText(WAKING)).not.toBeInTheDocument()
  })

  it('stays hidden while the page shows its own hint', () => {
    useNetworkStore.setState({ inlineHints: 1 })
    render(<SlowServerNotice />)
    act(() => useNetworkStore.getState().requestStarted())
    act(() => { vi.advanceTimersByTime(5000) })

    expect(screen.queryByText(WAKING)).not.toBeInTheDocument()
  })
})

describe('request counting', () => {
  beforeEach(() => useNetworkStore.setState({ pending: 0, inlineHints: 0 }))

  it('counts ordinary API calls but not AI calls, and settles back to zero', async () => {
    let seen = -1
    api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      seen = useNetworkStore.getState().pending
      return { status: 200, statusText: 'OK', headers: {}, config, data: { success: true } } as AxiosResponse
    }

    await api.get('/posts')
    expect(seen).toBe(1)
    expect(useNetworkStore.getState().pending).toBe(0)

    await api.post('/ai/translate', {})
    expect(seen).toBe(0)
  })
})
