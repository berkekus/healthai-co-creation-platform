import { create } from 'zustand'

/**
 * Counts API requests in flight so one app-wide notice can explain a slow server
 * (the free Render instance takes ~20s to wake), instead of every page wiring its own.
 */
interface NetworkState {
  /** Requests currently waiting for a response (AI calls excluded — they are slow by nature). */
  pending: number
  /** Pages that already show their own slow-request hint; the global notice stays hidden then. */
  inlineHints: number
  requestStarted: () => void
  requestFinished: () => void
  inlineHintShown: () => void
  inlineHintHidden: () => void
}

export const useNetworkStore = create<NetworkState>()(set => ({
  pending: 0,
  inlineHints: 0,
  requestStarted: () => set(s => ({ pending: s.pending + 1 })),
  requestFinished: () => set(s => ({ pending: Math.max(0, s.pending - 1) })),
  inlineHintShown: () => set(s => ({ inlineHints: s.inlineHints + 1 })),
  inlineHintHidden: () => set(s => ({ inlineHints: Math.max(0, s.inlineHints - 1) })),
}))
