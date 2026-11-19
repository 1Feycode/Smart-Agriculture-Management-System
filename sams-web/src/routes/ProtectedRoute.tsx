import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { roleDashboardPaths, type UserRole } from '../types/user'

interface ProtectedRouteProps extends PropsWithChildren {
  role?: UserRole
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const auth = useAuth()
  const location = useLocation()

  if (auth.authLoading || auth.profileLoading) {
    return <div className="route-loading" role="status">Checking your account...</div>
  }

  if (!auth.user) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />
  }

  if (!auth.role || !auth.profile || auth.profile.status !== 'active') {
    return (
      <Navigate
        to="/access-denied"
        replace
        state={{ message: auth.accessError ?? 'Your account is not authorized for this page.' }}
      />
    )
  }

  if (role && auth.role !== role) {
    return <Navigate to={roleDashboardPaths[auth.role]} replace />
  }

  return children
}
