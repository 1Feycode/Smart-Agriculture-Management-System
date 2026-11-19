import { Link } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      <ol>
        {items.map((item, index) => {
          const current = index === items.length - 1

          return (
            <li key={`${item.label}-${index}`}>
              {current || !item.href ? (
                <span aria-current={current ? 'page' : undefined}>{item.label}</span>
              ) : (
                <Link to={item.href}>{item.label}</Link>
              )}
              {!current && <span aria-hidden="true" className="breadcrumbs__separator">/</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
