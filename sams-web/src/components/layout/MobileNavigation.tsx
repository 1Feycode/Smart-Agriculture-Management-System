import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { dashboardNavigation, type DashboardRole, type NavigationItem } from '../../types/navigation'

interface MobileNavigationProps {
  role: DashboardRole
  items: NavigationItem[]
}

export function MobileNavigation({ role, items }: MobileNavigationProps) {
  const [open, setOpen] = useState(false)
  const basePath = dashboardNavigation[role].basePath

  return (
    <div className="mobile-navigation">
      <button
        className="menu-toggle menu-toggle--dashboard"
        type="button"
        aria-label={open ? 'Close dashboard navigation' : 'Open dashboard navigation'}
        aria-expanded={open}
        aria-controls="dashboard-mobile-menu"
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        {open ? <X size={21} /> : <Menu size={21} />}
      </button>
      {open && (
        <nav id="dashboard-mobile-menu" className="mobile-navigation__menu" aria-label={`${dashboardNavigation[role].label} navigation`}>
          {items.map(({ label, href, icon: Icon }) => (
            <NavLink
              key={href}
              to={href}
              end={href === basePath}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `sidebar__link${isActive ? ' is-active' : ''}`}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
