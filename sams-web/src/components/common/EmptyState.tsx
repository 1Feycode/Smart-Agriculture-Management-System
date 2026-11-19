import { useId, type ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  const titleId = useId()

  return (
    <section className="state-card" aria-labelledby={titleId}>
      <span className="state-card__mark" aria-hidden="true">—</span>
      <h2 id={titleId}>{title}</h2>
      <p>{description}</p>
      {action && <div className="state-card__action">{action}</div>}
    </section>
  )
}
