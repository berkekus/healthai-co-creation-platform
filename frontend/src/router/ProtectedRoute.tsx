import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { ROUTES } from '../constants/routes'
import type { UserRole } from '../types/auth.types'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isHydrating, user } = useAuthStore()
  const location = useLocation()

  if (isHydrating) return null

  if (!isAuthenticated) {
    const state = allowedRoles ? undefined : { from: location }
    return <Navigate to={ROUTES.LOGIN} state={state} replace />
  }
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />
  }
  return <>{children}</>
}
