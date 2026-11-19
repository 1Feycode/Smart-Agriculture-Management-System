import { Leaf } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { dashboardNavigation, type DashboardRole, type NavigationItem } from '../../types/navigation'

interface SidebarProps {
  role: DashboardRole
  items: NavigationItem[]
}

export function Sidebar({ role, items }: SidebarProps) {
  const basePath = dashboardNavigation[role].basePath

  return (
    <aside className="sidebar">
      <Link to="/" className="brand brand--sidebar" aria-label="SAMS home">
        <span className="brand__mark" aria-hidden="true"><Leaf size={20} /></span>
        <span className="brand__name"><strong>SAMS</strong><small>{dashboardNavigation[role].label}</small></span>
      </Link>
      <nav className="sidebar__nav" aria-label={`${dashboardNavigation[role].label} navigation`}>
        {items.map(({ label, href, icon: Icon }) => (
          <NavLink
            key={href}
            to={href}
            end={href === basePath}
            className={({ isActive }) => `sidebar__link${isActive ? ' is-active' : ''}`}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar__note">
        <span className="sidebar__note-icon" aria-hidden="true"><Leaf size={17} /></span>
        <p>Thoughtful tools for more informed agriculture.</p>
      </div>
    </aside>
  )
}
