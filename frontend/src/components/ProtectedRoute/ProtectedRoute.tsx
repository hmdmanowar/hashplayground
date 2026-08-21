import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth, type Role } from '../../context/AuthContext'

interface ProtectedRouteProps {
  children?: ReactNode
  requiredRole?: Role
}

function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, authStatus } = useAuth()

  if (authStatus === 'checking') return null
  if (!user) return <Navigate to="/login" replace />
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/" replace />

  return children ? <>{children}</> : <Outlet />
}

export default ProtectedRoute
