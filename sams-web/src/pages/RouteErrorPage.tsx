import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { ErrorState } from '../components/common/ErrorState'

export function RouteErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `The requested page could not be loaded (${error.status}).`
    : 'An unexpected page error occurred. Please return home and try again.'

  return (
    <div className="content-page">
      <ErrorState
        title="Page unavailable"
        message={message}
        action={<Link className="button button--secondary" to="/">Return to home</Link>}
      />
    </div>
  )
}
