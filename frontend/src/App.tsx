import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import AppRouter from './router/AppRouter'
import { useAuthStore } from './store/authStore'
import { usePostStore } from './store/postStore'
import { useNotificationStore } from './store/notificationStore'

export default function App() {
  const { i18n } = useTranslation()
  const hydrate         = useAuthStore(s => s.hydrate)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const fetchPosts      = usePostStore(s => s.fetchPosts)
  const startPolling    = useNotificationStore(s => s.startPolling)
  const stopPolling     = useNotificationStore(s => s.stopPolling)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    document.documentElement.lang = i18n.language.startsWith('tr') ? 'tr' : 'en'
  }, [i18n.language])

  useEffect(() => {
    if (isAuthenticated) fetchPosts()
  }, [isAuthenticated, fetchPosts])

  // Start notification polling when authenticated; stop on logout/unmount
  useEffect(() => {
    if (!isAuthenticated) return
    startPolling()
    return () => stopPolling()
  }, [isAuthenticated, startPolling, stopPolling])

  return <AppRouter />
}
