import type { ReactNode } from 'react'

interface PageTitleProps {
  title: string
  description?: string
  action?: ReactNode
}

export function PageTitle({ title, description, action }: PageTitleProps) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="page-title__action">{action}</div>}
    </div>
  )
}
