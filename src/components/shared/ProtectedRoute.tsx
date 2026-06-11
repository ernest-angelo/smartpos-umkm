import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { UserRole } from '../../context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12 animate-spin rounded-full border-4 border-zinc-800 border-t-purple-600">
            <div className="absolute inset-1 rounded-full border-4 border-transparent border-t-purple-400 opacity-50"></div>
          </div>
          <p className="text-sm font-medium tracking-widest text-zinc-400 uppercase animate-pulse">
            Authenticating...
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    // Redirect to login but save current location for post-login redirection
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // If user's role is not authorized, redirect to dashboard or appropriate page
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
