import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { request, ApiError, onUnauthorized } from '../lib/apiClient'
import { useToast } from './ToastContext'

export type Role = 'admin' | 'user'

export interface AuthUser {
  username: string
  role: Role
  name?: string
  email?: string
  joinedAt: string
}

type AuthStatus = 'checking' | 'ready'

interface AuthContextValue {
  user: AuthUser | null
  authStatus: AuthStatus
  login: (username: string, password: string) => Promise<{ ok: true } | { ok: false; reason: 'blocked' | 'invalid' }>
  signup: (username: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking')
  const { showToast } = useToast()
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    request<{ user: AuthUser }>('/auth/me')
      .then((data) => {
        if (mountedRef.current) setUser(data.user)
      })
      .catch(() => {
        if (mountedRef.current) setUser(null)
      })
      .finally(() => {
        if (mountedRef.current) setAuthStatus('ready')
      })
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    return onUnauthorized(() => {
      setUser(null)
      showToast('Your session expired — please log in again.', { kind: 'error' })
    })
  }, [showToast])

  async function login(username: string, password: string) {
    try {
      const { user: loggedInUser } = await request<{ user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: { username, password },
      })
      setUser(loggedInUser)
      return { ok: true } as const
    } catch (error) {
      if (error instanceof ApiError && error.code === 'blocked') return { ok: false, reason: 'blocked' } as const
      return { ok: false, reason: 'invalid' } as const
    }
  }

  async function signup(username: string, password: string) {
    try {
      const { user: newUser } = await request<{ user: AuthUser }>('/auth/signup', {
        method: 'POST',
        body: { username, password },
      })
      setUser(newUser)
      return { ok: true } as const
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not create your account'
      return { ok: false, message } as const
    }
  }

  async function logout() {
    await request('/auth/logout', { method: 'POST' }).catch(() => {})
    setUser(null)
  }

  async function refreshUser() {
    try {
      const { user: refreshed } = await request<{ user: AuthUser }>('/auth/me')
      setUser(refreshed)
    } catch {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, authStatus, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
