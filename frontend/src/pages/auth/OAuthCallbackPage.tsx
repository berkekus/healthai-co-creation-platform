import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { ROUTES } from '../../constants/routes'
import api from '../../lib/api'
import { connectSocket } from '../../lib/socket'
import type { User } from '../../types/auth.types'

export default function OAuthCallbackPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  void useAuthStore()

  useEffect(() => {
    const token = params.get('token')
    const error = params.get('error')

    if (error || !token) {
      navigate(ROUTES.LOGIN + '?error=oauth', { replace: true })
      return
    }

    localStorage.setItem('token', token)
    connectSocket(token)

    api.get<{ success: boolean; data: User }>('/auth/me')
      .then(res => {
        useAuthStore.setState({ user: res.data.data, isAuthenticated: true, isHydrating: false })
        navigate(ROUTES.DASHBOARD, { replace: true })
      })
      .catch(() => {
        localStorage.removeItem('token')
        navigate(ROUTES.LOGIN + '?error=oauth', { replace: true })
      })
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-hai-plum/20 border-t-hai-plum" />
        <p className="text-sm font-semibold text-[#6F6878]">Signing you in…</p>
      </div>
    </div>
  )
}
