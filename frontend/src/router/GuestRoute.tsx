import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { ROUTES } from '../constants/routes'

export default function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isHydrating } = useAuthStore()
  if (isHydrating) return null
  if (isAuthenticated) return <Navigate to={ROUTES.DASHBOARD} replace />
  return <>{children}</>
}
