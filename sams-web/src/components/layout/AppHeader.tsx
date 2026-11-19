import { useState } from 'react'
import { ArrowRight, Leaf, Menu, X } from 'lucide-react'
import { Link } from 'react-router-dom'

const publicLinks = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/#about' },
  { label: 'Crop information', href: '/crops' },
]

export function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link aria-label="SAMS home" className="brand" to="/" onClick={() => setMenuOpen(false)}>
          <span className="brand__mark" aria-hidden="true"><Leaf size={21} /></span>
          <span className="brand__name">
            <strong>SAMS</strong>
            <small>Smart Agriculture Management System</small>
          </span>
        </Link>

        <nav className="app-header__nav" aria-label="Main navigation">
          {publicLinks.map((item) => <Link key={item.href} to={item.href}>{item.label}</Link>)}
        </nav>

        <div className="app-header__actions">
          <Link className="header-signin" to="/login">Sign in</Link>
          <Link className="button button--primary header-register" to="/register">
            Get started <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-public-navigation"
          onClick={() => setMenuOpen((isOpen) => !isOpen)}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {menuOpen && (
        <nav id="mobile-public-navigation" className="mobile-public-nav" aria-label="Mobile navigation">
          {publicLinks.map((item) => (
            <Link key={item.href} to={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
          <Link to="/login" onClick={() => setMenuOpen(false)}>Sign in</Link>
          <Link to="/register" onClick={() => setMenuOpen(false)}>Create an account</Link>
        </nav>
      )}
    </header>
  )
}
