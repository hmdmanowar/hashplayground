import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { APP_NAME } from '../../config/appConfig'
import ThemeToggle from '../../components/ThemeToggle/ThemeToggle'
import logoImage from '../../assets/logo.png'

function ForgotPassword() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    const result = await requestPasswordReset(email)
    setIsSubmitting(false)
    if (result.ok) {
      setSent(true)
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
          <div>
            <h1 className="text-2xl font-semibold">Reset your password</h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Enter the email on your {APP_NAME} account and we'll send you a reset link.
            </p>
          </div>
        </div>

        {sent ? (
          <p className="mt-8 rounded-lg border border-[var(--border-panel)] bg-[var(--bg-app)] p-4 text-center text-sm text-[var(--color-muted)]">
            If an account with that email exists, a reset link has been sent. Check your inbox (and spam folder).
          </p>
        ) : (
          <form className="mt-8 flex flex-col gap-3" onSubmit={handleSubmit}>
            <input
              className="rounded-full border border-[var(--border-panel)] bg-transparent px-5 py-3 text-sm transition-colors"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoFocus
            />
            {error && <p className="px-2 text-sm text-red-500">{error}</p>}
            <button
              className="mt-2 cursor-pointer rounded-full bg-[var(--color-primary-strong)] px-5 py-3 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}

export default ForgotPassword
