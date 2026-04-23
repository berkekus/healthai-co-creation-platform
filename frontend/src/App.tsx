import { useEffect } from 'react'
import AppRouter from './router/AppRouter'
import { useAuthStore } from './store/authStore'
import { usePostStore } from './store/postStore'

export default function App() {
  const hydrate      = useAuthStore(s => s.hydrate)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const fetchPosts   = usePostStore(s => s.fetchPosts)

  // 1. Sayfa açılınca token varsa kullanıcıyı restore et
  useEffect(() => {
    hydrate()
  }, [hydrate])

  // 2. Kullanıcı oturum açtıktan (veya restore edildikten) sonra postları çek
  useEffect(() => {
    if (isAuthenticated) fetchPosts()
  }, [isAuthenticated, fetchPosts])

  return <AppRouter />
}
