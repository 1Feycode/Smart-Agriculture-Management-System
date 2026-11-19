import { useState } from 'react'
import { LogOut, UserRound } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Breadcrumbs, type BreadcrumbItem } from '../components/common/Breadcrumbs'
import { PageTitle } from '../components/common/PageTitle'
import { MobileNavigation } from '../components/layout/MobileNavigation'
import { Sidebar } from '../components/layout/Sidebar'
import { useAuth } from '../hooks/useAuth'
import { dashboardNavigation, type DashboardRole } from '../types/navigation'
import { roleLabels } from '../types/user'
import { firebaseAuthErrorMessage } from '../services/authService'
import { formatLabel } from '../utils/formatLabel'

interface DashboardLayoutProps {
  role: DashboardRole
}

export function DashboardLayout({ role }: DashboardLayoutProps) {
  const location = useLocation()
  const { profile, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const navigation = dashboardNavigation[role]
  const currentItem = navigation.items
    .filter((item) => location.pathname === item.href || location.pathname.startsWith(`${item.href}/`))
    .sort((left, right) => right.href.length - left.href.length)[0]
  const pageTitle = currentItem?.label ?? formatLabel(location.pathname.slice(navigation.basePath.length))
  const breadcrumbs: BreadcrumbItem[] = [
    { label: navigation.label, href: navigation.basePath },
    { label: location.pathname === navigation.basePath ? 'Overview' : pageTitle },
  ]

  async function handleLogout() {
    setLoggingOut(true)
    setLogoutError(null)
    try {
      await logout()
    } catch (error) {
      setLogoutError(firebaseAuthErrorMessage(error))
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="dashboard-layout">
      <a className="skip-link" href="#dashboard-content">Skip to content</a>
      <Sidebar role={role} items={navigation.items} />
      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <MobileNavigation role={role} items={navigation.items} />
          <div className="dashboard-topbar__context">
            <span className="dashboard-topbar__eyebrow">Workspace</span>
            <span>{navigation.label}</span>
          </div>
          <Link className="profile-placeholder" to="/profile" aria-label="View your profile">
            <span className="profile-placeholder__avatar" aria-hidden="true"><UserRound size={18} /></span>
            <span><strong>{profile?.displayName || 'Profile'}</strong><small>{roleLabels[role]}</small></span>
          </Link>
          <button className="button button--secondary dashboard-logout" type="button" onClick={() => void handleLogout()} disabled={loggingOut}>
            <LogOut size={16} aria-hidden="true" />
            {loggingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </header>
        <main id="dashboard-content" className="dashboard-content">
          {logoutError && <p className="account-feedback account-feedback--error" role="alert">{logoutError}</p>}
          <Breadcrumbs items={breadcrumbs} />
          <PageTitle title={pageTitle} description="A foundation shell for future SAMS workflows." />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
