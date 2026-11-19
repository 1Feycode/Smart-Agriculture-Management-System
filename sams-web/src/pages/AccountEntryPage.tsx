import { useState, type FormEvent } from 'react'
import { ArrowLeft, Eye, EyeOff, LockKeyhole, UserPlus } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FormField } from '../forms/FormField'
import { useAuth } from '../hooks/useAuth'
import { firebaseAuthErrorMessage } from '../services/authService'
import { roleDashboardPaths } from '../types/user'

interface AccountEntryPageProps {
  mode: 'login' | 'register' | 'forgot-password'
}

const minimumPasswordLength = 8
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const pageCopy = {
  login: {
    title: 'Welcome back',
    description: 'Sign in to your SAMS account to continue.',
    icon: LockKeyhole,
    action: 'Create an account',
    actionHref: '/register',
  },
  register: {
    title: 'Join SAMS',
    description: 'Create your farmer account with your name and email address.',
    icon: UserPlus,
    action: 'Already have an account? Sign in',
    actionHref: '/login',
  },
  'forgot-password': {
    title: 'Reset your password',
    description: 'Enter the email address associated with your account.',
    icon: LockKeyhole,
    action: 'Return to sign in',
    actionHref: '/login',
  },
} satisfies Record<AccountEntryPageProps['mode'], {
  title: string
  description: string
  icon: typeof LockKeyhole
  action: string
  actionHref: string
}>

export function AccountEntryPage({ mode }: AccountEntryPageProps) {
  const copy = pageCopy[mode]
  const Icon = copy.icon
  const auth = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [rememberSession, setRememberSession] = useState(true)
  const [showPasswords, setShowPasswords] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error' | 'info'; message: string } | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)

    const validationErrors = validateForm(mode, { fullName, email, password, confirmPassword })
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setSubmitting(true)
    try {
      if (mode === 'login') {
        const role = await auth.login(email.trim(), password, rememberSession)
        const returnTo = safeReturnTo(searchParams.get('returnTo'))
        navigate(returnTo ?? roleDashboardPaths[role], { replace: true })
      } else if (mode === 'register') {
        const provisioned = await auth.register(fullName.trim(), email.trim(), password)
        setFeedback(provisioned
          ? {
            kind: 'success',
            message: 'Your account is ready. Check your email and verify your address before signing in.',
          }
          : {
            kind: 'info',
            message: 'Your Firebase account was created and a verification email was sent, but trusted farmer-role provisioning has not completed. Access is blocked until the server-side process securely provisions your role. Do not retry registration.',
          })
      } else {
        try {
          await auth.resetPassword(email.trim())
        } catch (error) {
          if (!['auth/user-not-found', 'auth/user-disabled', 'auth/invalid-email'].includes(getErrorCode(error) ?? '')) {
            throw error
          }
        }
        setFeedback({
          kind: 'success',
          message: 'If an account exists for this email, password reset instructions will be sent.',
        })
      }
    } catch (error) {
      setFeedback({ kind: 'error', message: firebaseAuthErrorMessage(error) })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResendVerification() {
    setSubmitting(true)
    setFeedback(null)
    try {
      await auth.resendVerificationEmail()
      setFeedback({ kind: 'success', message: 'A new verification email has been sent.' })
    } catch (error) {
      setFeedback({ kind: 'error', message: firebaseAuthErrorMessage(error) })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRefreshAfterVerification() {
    setSubmitting(true)
    setFeedback(null)
    try {
      const role = await auth.refreshSession()
      navigate(roleDashboardPaths[role], { replace: true })
    } catch (error) {
      setFeedback({ kind: 'error', message: firebaseAuthErrorMessage(error) })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="account-page">
      <section className="account-card">
        <span className="account-card__icon" aria-hidden="true"><Icon size={23} /></span>
        <span className="section-kicker">SAMS account</span>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>

        <form className="account-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
          {mode === 'register' && (
            <FormField
              id="full-name"
              name="name"
              label="Full name"
              autoComplete="name"
              maxLength={120}
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              error={errors.fullName}
            />
          )}

          <FormField
            id="email"
            name="email"
            label="Email address"
            type="email"
            autoComplete={mode === 'login' ? 'username' : 'email'}
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
          />

          {mode !== 'forgot-password' && (
            <PasswordField
              id="password"
              label="Password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              visible={showPasswords}
              onToggle={() => setShowPasswords((visible) => !visible)}
              value={password}
              onChange={setPassword}
              error={errors.password}
              description={mode === 'register' ? `Minimum length: ${minimumPasswordLength} characters.` : undefined}
            />
          )}

          {mode === 'register' && (
            <PasswordField
              id="confirm-password"
              label="Confirm password"
              autoComplete="new-password"
              visible={showPasswords}
              onToggle={() => setShowPasswords((visible) => !visible)}
              value={confirmPassword}
              onChange={setConfirmPassword}
              error={errors.confirmPassword}
            />
          )}

          {mode === 'login' && (
            <div className="account-form__options">
              <label className="account-checkbox">
                <input
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(event) => setRememberSession(event.target.checked)}
                />
                <span>Remember this session</span>
              </label>
              <Link className="text-link" to="/forgot-password">Forgot password?</Link>
            </div>
          )}

          {feedback && (
            <div className={`account-feedback account-feedback--${feedback.kind}`} role={feedback.kind === 'error' ? 'alert' : 'status'}>
              {feedback.message}
            </div>
          )}

          <button className="button button--primary button--large account-form__submit" type="submit" disabled={submitting}>
            {submitting ? 'Please wait...' : mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Send reset email'}
          </button>
        </form>

        {mode === 'login' && auth.user && !auth.user.emailVerified && (
          <div className="account-verification">
            <p>Your email address is not verified yet.</p>
            <button type="button" className="text-link account-link-button" onClick={() => void handleResendVerification()} disabled={submitting}>
              Resend verification email
            </button>
            <button type="button" className="text-link account-link-button" onClick={() => void handleRefreshAfterVerification()} disabled={submitting}>
              I have verified my email
            </button>
          </div>
        )}

        {mode === 'login' && (
          <p className="account-card__switch">New to SAMS? <Link to="/register">Create an account</Link></p>
        )}
        {mode === 'register' && (
          <p className="account-card__switch">Already registered? <Link to="/login">Sign in</Link></p>
        )}
        {mode === 'forgot-password' && <Link className="account-card__switch" to="/login">Return to sign in</Link>}
        <Link className="account-card__back" to="/"><ArrowLeft size={15} aria-hidden="true" /> Back to home</Link>
      </section>
    </div>
  )
}

interface PasswordFieldProps {
  id: string
  label: string
  autoComplete: string
  visible: boolean
  onToggle: () => void
  value: string
  onChange: (value: string) => void
  error?: string
  description?: string
}

function PasswordField({
  id,
  label,
  autoComplete,
  visible,
  onToggle,
  value,
  onChange,
  error,
  description,
}: PasswordFieldProps) {
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="form-field">
      <label htmlFor={id}>{label}<span aria-hidden="true" className="form-field__required"> *</span></label>
      {description && <p id={descriptionId} className="form-field__description">{description}</p>}
      <div className="password-input">
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
        />
        <button
          className="password-input__toggle"
          type="button"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          onClick={onToggle}
        >
          {visible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
        </button>
      </div>
      {error && <p id={errorId} className="form-field__error">{error}</p>}
    </div>
  )
}

function validateForm(
  mode: AccountEntryPageProps['mode'],
  values: { fullName: string; email: string; password: string; confirmPassword: string },
): Record<string, string> {
  const errors: Record<string, string> = {}
  const normalizedEmail = values.email.trim()

  if (!normalizedEmail) errors.email = 'Enter your email address.'
  else if (!emailPattern.test(normalizedEmail)) errors.email = 'Enter a valid email address.'

  if (mode === 'register') {
    const name = values.fullName.trim()
    if (!name) errors.fullName = 'Enter your full name.'
    else if (name.length > 120) errors.fullName = 'Your name must be 120 characters or fewer.'
  }

  if (mode !== 'forgot-password') {
    if (!values.password) errors.password = 'Enter your password.'
    else if (mode === 'register' && values.password.length < minimumPasswordLength) {
      errors.password = `Use at least ${minimumPasswordLength} characters.`
    }
  }

  if (mode === 'register' && values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return errors
}

function safeReturnTo(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null

  try {
    const destination = new URL(value, window.location.origin)
    if (destination.origin !== window.location.origin) return null
    return `${destination.pathname}${destination.search}${destination.hash}`
  } catch {
    return null
  }
}

function getErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) return undefined
  return typeof error.code === 'string' ? error.code : undefined
}
