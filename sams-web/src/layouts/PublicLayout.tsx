import { Outlet } from 'react-router-dom'
import { AppFooter } from '../components/layout/AppFooter'
import { AppHeader } from '../components/layout/AppHeader'

export function PublicLayout() {
  return (
    <div className="public-layout">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <AppHeader />
      <main id="main-content" className="public-main">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  )
}
