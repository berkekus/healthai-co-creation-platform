import { useEffect } from 'react'
import AppRouter from './router/AppRouter'
import { useAuthStore } from './store/authStore'
import { usePostStore } from './store/postStore'

export default function App() {
  const hydrate = useAuthStore(s => s.hydrate)
  const fetchPosts = usePostStore(s => s.fetchPosts)

  useEffect(() => {
    hydrate()
    fetchPosts()
  }, [hydrate, fetchPosts])

  return <AppRouter />
}
