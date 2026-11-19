import type { ReactNode } from 'react'

interface ErrorStateProps {
  title?: string
  message: string
  action?: ReactNode
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  action,
}: ErrorStateProps) {
  return (
    <section className="state-card state-card--error" role="alert">
      <h2>{title}</h2>
      <p>{message}</p>
      {action && <div className="state-card__action">{action}</div>}
    </section>
  )
}
