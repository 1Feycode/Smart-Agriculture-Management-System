import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="content-page not-found-page">
      <span className="not-found-page__code">404</span>
      <h1>We couldn't find that page</h1>
      <p>The address may be incorrect, or the page may not be part of this foundation yet.</p>
      <Link className="button button--primary" to="/">Go to SAMS home</Link>
    </div>
  )
}
