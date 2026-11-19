import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string | number
  hint?: string
  icon?: LucideIcon
}

export function MetricCard({ label, value, hint, icon: Icon }: MetricCardProps) {
  return (
    <article className="metric-card">
      {Icon && (
        <span className="metric-card__icon" aria-hidden="true">
          <Icon size={19} />
        </span>
      )}
      <p className="metric-card__label">{label}</p>
      <p className="metric-card__value">{value}</p>
      {hint && <p className="metric-card__hint">{hint}</p>}
    </article>
  )
}
