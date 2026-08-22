import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { APP_NAME } from '../../config/appConfig'
import ThemeToggle from '../../components/ThemeToggle/ThemeToggle'
import { GoogleIcon, GithubIcon, AppleIcon, LinkedInIcon, EnvelopeIcon } from '../../components/Icons/Icons'
import logoImage from '../../assets/logo.png'
import { STRONG_PASSWORD_REGEX, STRONG_PASSWORD_MESSAGE } from '../../utils/password'
import { apiUrl } from '../../lib/apiClient'
import './Signup.scss'

const optionButtonClass =
  'flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--border-panel)] bg-[var(--bg-app)] px-5 py-3 text-sm font-medium transition-colors hover:border-[var(--color-primary)]'

function Signup() {
  const { user, authStatus, signup } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'options' | 'email'>('options')
  const [notice, setNotice] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (authStatus === 'checking') return null
  if (user) return <Navigate to="/dashboard" replace />

  function showComingSoon(provider: string) {
    setNotice(`${provider} sign-up isn't available in this demo yet — try Continue with Email.`)
  }

  function openEmailForm() {
    setNotice('')
    setMode('email')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!username || !password) {
      setError('Please fill in all fields')
      return
    }
    if (!STRONG_PASSWORD_REGEX.test(password)) {
      setError(STRONG_PASSWORD_MESSAGE)
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    const result = await signup(username, password)
    setIsSubmitting(false)
    if (result.ok) {
      navigate('/dashboard', { replace: true })
    } else {
      setError(result.message)
    }
  }

  return (
    <main className="signup-page relative flex min-h-screen items-center justify-center bg-[var(--bg-app)] px-6">
      <Link
        to="/"
        className="absolute left-6 top-6 flex items-center gap-1 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-primary)]"
      >
        &larr; Back to home
      </Link>

      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <div className="signup-card w-full max-w-sm rounded-2xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-8 shadow-2xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <img src={logoImage} alt="" className="h-12 w-12 rounded-full object-cover" />
          <div>
            <h1 className="text-2xl font-semibold">Create your {APP_NAME} account</h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">Choose how you'd like to continue</p>
          </div>
        </div>

        {mode === 'options' ? (
          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              className={optionButtonClass}
              onClick={() => {
                window.location.href = apiUrl('/auth/google')
              }}
            >
              <GoogleIcon className="h-5 w-5" />
              Continue with Google
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                aria-label="Continue with GitHub"
                className="flex h-11 flex-1 cursor-pointer items-center justify-center rounded-full border border-[var(--border-panel)] bg-[var(--bg-app)] transition-colors hover:border-[var(--color-primary)]"
                onClick={() => {
                  window.location.href = apiUrl('/auth/github')
                }}
              >
                <GithubIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Continue with Apple"
                className="flex h-11 flex-1 cursor-pointer items-center justify-center rounded-full border border-[var(--border-panel)] bg-[var(--bg-app)] transition-colors hover:border-[var(--color-primary)]"
                onClick={() => showComingSoon('Apple')}
              >
                <AppleIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Continue with LinkedIn"
                className="flex h-11 flex-1 cursor-pointer items-center justify-center rounded-full border border-[var(--border-panel)] bg-[var(--bg-app)] transition-colors hover:border-[var(--color-primary)]"
                onClick={() => {
                  window.location.href = apiUrl('/auth/linkedin')
                }}
              >
                <LinkedInIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="my-1 flex items-center gap-3 text-xs text-[var(--color-muted)]">
              <span className="h-px flex-1 bg-[var(--border-panel)]" />
              OR
              <span className="h-px flex-1 bg-[var(--border-panel)]" />
            </div>

            <button type="button" className={optionButtonClass} onClick={openEmailForm}>
              <EnvelopeIcon className="h-5 w-5" />
              Continue with Email
            </button>

            {notice && <p className="px-2 text-center text-xs text-[var(--color-muted)]">{notice}</p>}

            <p className="mt-2 text-center text-xs text-[var(--color-muted)]">
              By continuing, you agree to our <span className="underline">Terms of Service</span> and{' '}
              <span className="underline">Privacy Policy</span>.
            </p>
          </div>
        ) : (
          <div className="mt-8">
            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
              <input
                className="rounded-full border border-[var(--border-panel)] bg-transparent px-5 py-3 text-sm transition-colors"
                placeholder="Username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoFocus
              />
              <input
                className="rounded-full border border-[var(--border-panel)] bg-transparent px-5 py-3 text-sm transition-colors"
                placeholder="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <p className="px-2 text-xs text-[var(--color-muted)]">{STRONG_PASSWORD_MESSAGE}</p>
              <input
                className="rounded-full border border-[var(--border-panel)] bg-transparent px-5 py-3 text-sm transition-colors"
                placeholder="Confirm password"
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
                {isSubmitting ? 'Signing up…' : 'Sign up'}
              </button>
            </form>

            <button
              type="button"
              className="mt-4 w-full cursor-pointer text-center text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)]"
              onClick={() => setMode('options')}
            >
              &larr; Back to all options
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-[var(--color-primary)]">
            Log in
          </Link>
        </p>
      </div>
    </main>
  )
}

export default Signup
