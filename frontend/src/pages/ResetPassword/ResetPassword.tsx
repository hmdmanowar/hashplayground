import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ThemeToggle from '../../components/ThemeToggle/ThemeToggle'
import logoImage from '../../assets/logo.png'
import { STRONG_PASSWORD_REGEX, STRONG_PASSWORD_MESSAGE } from '../../utils/password'

function ResetPassword() {
  const { confirmPasswordReset } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (!STRONG_PASSWORD_REGEX.test(newPassword)) {
      setError(STRONG_PASSWORD_MESSAGE)
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    const result = await confirmPasswordReset(token!, newPassword)
    setIsSubmitting(false)
    if (result.ok) {
      setDone(true)
    } else {
      setError(result.message)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[var(--bg-app)] px-6">
      <Link
        to="/login"
        className="absolute left-6 top-6 flex items-center gap-1 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-primary)]"
      >
        &larr; Back to login
      </Link>

      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-8 shadow-2xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <img src={logoImage} alt="" className="h-12 w-12 rounded-full object-cover" />
          <h1 className="text-2xl font-semibold">Set a new password</h1>
        </div>

        {!token ? (
          <p className="mt-8 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-app)] p-4 text-center text-sm text-red-500">
            This reset link is missing its token — please request a new one.
          </p>
        ) : done ? (
          <div className="mt-8 flex flex-col items-center gap-4">
            <p className="rounded-lg border border-[var(--border-panel)] bg-[var(--bg-app)] p-4 text-center text-sm text-[var(--color-muted)]">
              Your password has been updated. You've been signed out everywhere — log in again with your new
              password.
            </p>
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="cursor-pointer rounded-full bg-[var(--color-primary-strong)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
            >
              Go to login
            </button>
          </div>
        ) : (
          <form className="mt-8 flex flex-col gap-3" onSubmit={handleSubmit}>
            <input
              className="rounded-full border border-[var(--border-panel)] bg-transparent px-5 py-3 text-sm transition-colors"
              placeholder="New password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoFocus
            />
            <p className="px-2 text-xs text-[var(--color-muted)]">{STRONG_PASSWORD_MESSAGE}</p>
            <input
              className="rounded-full border border-[var(--border-panel)] bg-transparent px-5 py-3 text-sm transition-colors"
              placeholder="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            {error && <p className="px-2 text-sm text-red-500">{error}</p>}
            <button
              className="mt-2 cursor-pointer rounded-full bg-[var(--color-primary-strong)] px-5 py-3 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}

export default ResetPassword
