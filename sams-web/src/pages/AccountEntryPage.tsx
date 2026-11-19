import { ArrowLeft, LockKeyhole, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'

interface AccountEntryPageProps {
  mode: 'login' | 'register' | 'forgot-password'
}

const pageCopy = {
  login: {
    title: 'Welcome back',
    description: 'Sign-in is an entry point for the future account experience.',
    icon: LockKeyhole,
    action: 'Create an account',
    actionHref: '/register',
  },
  register: {
    title: 'Join SAMS',
    description: 'Account registration will be introduced in a later development phase.',
    icon: UserPlus,
    action: 'Already have an account? Sign in',
    actionHref: '/login',
  },
  'forgot-password': {
    title: 'Reset your password',
    description: 'Password recovery will be available when authentication is implemented.',
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

  return (
    <div className="account-page">
      <section className="account-card">
        <span className="account-card__icon" aria-hidden="true"><Icon size={23} /></span>
        <span className="section-kicker">SAMS account</span>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
        <div className="account-card__notice" role="status">
          This is a placeholder screen. Authentication is intentionally not active in Phase 1.
        </div>
        <Link className="text-link" to={copy.actionHref}>{copy.action}</Link>
        <Link className="account-card__back" to="/"><ArrowLeft size={15} aria-hidden="true" /> Back to home</Link>
      </section>
    </div>
  )
}
