import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { request, ApiError, onUnauthorized } from '../lib/apiClient'
import { useToast } from './ToastContext'

export type Role = 'admin' | 'user'

export interface AuthUser {
  username: string
  role: Role
  name?: string
  email?: string
  phone?: string
  joinedAt: string
}

type AuthStatus = 'checking' | 'ready'

interface AuthContextValue {
  user: AuthUser | null
  authStatus: AuthStatus
  // `identifier` may be a username or a phone number — the backend accepts either.
  login: (identifier: string, password: string) => Promise<{ ok: true } | { ok: false; reason: 'blocked' | 'invalid' }>
  signup: (username: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<{ ok: true } | { ok: false; message: string }>
  confirmPasswordReset: (token: string, newPassword: string) => Promise<{ ok: true } | { ok: false; message: string }>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking')
  const { showToast } = useToast()
  const mountedRef = useRef(true)
  const userRef = useRef<AuthUser | null>(null)

  useEffect(() => {
    userRef.current = user
  }, [user])

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
      // Only a real, previously-authenticated session dying mid-use deserves this
      // toast — a routine boot-time /auth/me check (or any anonymous browsing)
      // also gets a 401 through the exact same listener, and that's normal, not
      // an expiry.
      const wasLoggedIn = userRef.current !== null
      setUser(null)
      if (wasLoggedIn) {
        showToast('Your session expired — please log in again.', { kind: 'error' })
      }
    })
  }, [showToast])

  async function login(identifier: string, password: string) {
    try {
      const { user: loggedInUser } = await request<{ user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: { identifier, password },
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

  async function requestPasswordReset(email: string) {
    try {
      await request('/auth/forgot-password', { method: 'POST', body: { email } })
      return { ok: true } as const
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not send the reset email'
      return { ok: false, message } as const
    }
  }

  async function confirmPasswordReset(token: string, newPassword: string) {
    try {
      await request('/auth/reset-password', { method: 'POST', body: { token, newPassword } })
      return { ok: true } as const
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not reset your password'
      return { ok: false, message } as const
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, authStatus, login, signup, logout, refreshUser, requestPasswordReset, confirmPasswordReset }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
