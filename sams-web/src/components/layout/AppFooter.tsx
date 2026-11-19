import { Leaf } from 'lucide-react'
import { Link } from 'react-router-dom'

export function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer__main">
        <Link className="brand brand--footer" to="/">
          <span className="brand__mark" aria-hidden="true"><Leaf size={19} /></span>
          <span className="brand__name">
            <strong>SAMS</strong>
            <small>Smart Agriculture Management System</small>
          </span>
        </Link>
        <p>Clearer access to agricultural information for the people who grow our food.</p>
        <nav aria-label="Footer navigation">
          <Link to="/">Home</Link>
          <Link to="/#about">About</Link>
          <Link to="/crops">Crop information</Link>
        </nav>
      </div>
      <div className="app-footer__bottom">
        <span>© {new Date().getFullYear()} SAMS</span>
        <span>Built for accessible agricultural information.</span>
      </div>
    </footer>
  )
}
