import { EmptyState } from '../components/common/EmptyState'
import type { DashboardRole } from '../types/navigation'
import { useLocation } from 'react-router-dom'

interface DashboardPlaceholderPageProps {
  role: DashboardRole
}

export function DashboardPlaceholderPage({ role }: DashboardPlaceholderPageProps) {
  const { pathname } = useLocation()
  const basePath = role === 'data-manager' ? '/data' : role === 'administrator' ? '/admin' : `/${role}`
  const overview = pathname === basePath

  return (
    <EmptyState
      title={overview ? 'Your workspace is ready' : 'This module is a placeholder'}
      description={`The ${role.replace('-', ' ')} workspace layout is prepared. No role data, business workflows, or authentication are connected in this phase.`}
    />
  )
}
