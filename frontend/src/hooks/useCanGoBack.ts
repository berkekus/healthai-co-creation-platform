import { useLocation } from 'react-router-dom'

/**
 * Whether history.back() would land on another page of this app rather than leave it.
 *
 * React Router's browser history stores an `idx` in history.state: push increments it,
 * replace keeps it. So idx 0 means this tab entered the app here, even after a redirect
 * such as a broken link → /404, which is exactly when a "Back" button must not appear.
 */
export function useCanGoBack(): boolean {
  useLocation() // re-evaluate on navigation
  const idx = (window.history.state as { idx?: number } | null)?.idx
  return typeof idx === 'number' && idx > 0
}
