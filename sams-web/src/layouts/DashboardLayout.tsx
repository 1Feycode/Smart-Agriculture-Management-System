import { UserRound } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import { Breadcrumbs, type BreadcrumbItem } from '../components/common/Breadcrumbs'
import { PageTitle } from '../components/common/PageTitle'
import { MobileNavigation } from '../components/layout/MobileNavigation'
import { Sidebar } from '../components/layout/Sidebar'
import { dashboardNavigation, type DashboardRole } from '../types/navigation'
import { formatLabel } from '../utils/formatLabel'

interface DashboardLayoutProps {
  role: DashboardRole
}

export function DashboardLayout({ role }: DashboardLayoutProps) {
  const location = useLocation()
  const navigation = dashboardNavigation[role]
  const currentItem = navigation.items
    .filter((item) => location.pathname === item.href || location.pathname.startsWith(`${item.href}/`))
    .sort((left, right) => right.href.length - left.href.length)[0]
  const pageTitle = currentItem?.label ?? formatLabel(location.pathname.slice(navigation.basePath.length))
  const breadcrumbs: BreadcrumbItem[] = [
    { label: navigation.label, href: navigation.basePath },
    { label: location.pathname === navigation.basePath ? 'Overview' : pageTitle },
  ]

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
          <div className="profile-placeholder" aria-label="User profile placeholder">
            <span className="profile-placeholder__avatar" aria-hidden="true"><UserRound size={18} /></span>
            <span><strong>Profile</strong><small>Not connected</small></span>
          </div>
        </header>
        <main id="dashboard-content" className="dashboard-content">
          <Breadcrumbs items={breadcrumbs} />
          <PageTitle title={pageTitle} description="A foundation shell for future SAMS workflows." />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
