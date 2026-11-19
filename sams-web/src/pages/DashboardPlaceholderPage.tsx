import { EmptyState } from '../components/common/EmptyState'
import type { DashboardRole } from '../types/navigation'
import { useLocation } from 'react-router-dom'
import { dashboardNavigation } from '../types/navigation'

interface DashboardPlaceholderPageProps {
  role: DashboardRole
}

export function DashboardPlaceholderPage({ role }: DashboardPlaceholderPageProps) {
  const { pathname } = useLocation()
  const basePath = dashboardNavigation[role].basePath
  const overview = pathname === basePath

  return (
    <EmptyState
      title={overview ? 'Your workspace is ready' : 'This module is a placeholder'}
      description={`The ${dashboardNavigation[role].label} workspace is protected by your authenticated account. Business workflows remain placeholders for a future phase.`}
    />
  )
}
