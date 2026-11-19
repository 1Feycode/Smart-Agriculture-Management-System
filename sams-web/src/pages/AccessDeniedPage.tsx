import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { firebaseAuthErrorMessage } from '../services/authService'
import { roleDashboardPaths } from '../types/user'

export function AccessDeniedPage() {
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const message = getAccessMessage(location.state) ?? auth.accessError ?? 'Your account does not have access to this page.'

  async function resendVerification() {
    try {
      await auth.resendVerificationEmail()
      setFeedback({ kind: 'success', message: 'A new verification email has been sent.' })
    } catch (error) {
      setFeedback({ kind: 'error', message: firebaseAuthErrorMessage(error) })
    }
  }

  async function refreshVerifiedSession() {
    try {
      const role = await auth.refreshSession()
      navigate(roleDashboardPaths[role], { replace: true })
    } catch (error) {
      setFeedback({ kind: 'error', message: firebaseAuthErrorMessage(error) })
    }
  }

  async function signOut() {
    try {
      await auth.logout()
      navigate('/', { replace: true })
    } catch (error) {
      setFeedback({ kind: 'error', message: firebaseAuthErrorMessage(error) })
    }
  }

  return (
    <div className="account-page">
      <section className="account-card">
        <span className="section-kicker">Account access</span>
        <h1>Access unavailable</h1>
        <p>{message}</p>
        {!auth.role && (
          <div className="account-card__notice" role="status">
            SAMS checks your active account profile before granting access. Contact the project owner if your profile is missing or inactive.
          </div>
        )}
        {auth.role && <Link className="button button--primary" to={roleDashboardPaths[auth.role]}>Go to your dashboard</Link>}
        {!auth.user && <Link className="button button--primary" to="/login">Sign in</Link>}
        {auth.user && (
          <button className="button button--secondary" type="button" onClick={() => void signOut()}>
            Sign out
          </button>
        )}
        {auth.user && !auth.user.emailVerified && (
          <div className="account-verification">
            <button type="button" className="text-link account-link-button" onClick={() => void resendVerification()}>
              Resend verification email
            </button>
            <button type="button" className="text-link account-link-button" onClick={() => void refreshVerifiedSession()}>
              I have verified my email
            </button>
          </div>
        )}
        {feedback && (
          <div className={`account-feedback account-feedback--${feedback.kind}`} role={feedback.kind === 'error' ? 'alert' : 'status'}>
            {feedback.message}
          </div>
        )}
        <Link className="account-card__back" to="/">Back to home</Link>
      </section>
    </div>
  )
}

function getAccessMessage(state: unknown): string | undefined {
  if (typeof state !== 'object' || state === null || !('message' in state)) return undefined
  return typeof state.message === 'string' ? state.message : undefined
}
