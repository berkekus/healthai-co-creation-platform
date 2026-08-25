import { API_BASE_URL } from './api'

/**
 * The API runs on a free Render instance, which spins the container down after
 * ~15 minutes of inactivity. Waking it costs ~20s, and for a signed-out visitor
 * the login POST is the first request to touch the backend — so it absorbs the
 * entire wake-up while the user stares at a spinner.
 *
 * Calling this when an auth screen mounts moves that wake-up off the critical
 * path: the container comes up while the user is still typing their email.
 *
 * Deliberately uses `fetch` rather than the axios instance so it bypasses the
 * auth interceptors, and swallows every failure — a warm-up that fails changes
 * nothing about the login that follows.
 */
let started = false

export function prewarmBackend(): void {
  if (started) return
  started = true

  // Fire-and-forget. AbortSignal keeps a hung request from lingering; on a cold
  // container the response can legitimately take ~20s, so the cap is generous.
  const timeout = AbortSignal.timeout?.(30_000)

  void fetch(`${API_BASE_URL}/health`, {
    method: 'GET',
    signal: timeout,
    // No credentials or auth header — this only needs to wake the container.
    cache: 'no-store',
  }).catch(() => {
    // Offline, CORS, cold-start timeout: all irrelevant here.
  })
}
