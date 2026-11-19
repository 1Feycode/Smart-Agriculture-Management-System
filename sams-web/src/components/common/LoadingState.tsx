interface LoadingStateProps {
  label?: string
}

export function LoadingState({ label = 'Loading content' }: LoadingStateProps) {
  return (
    <div className="state-card" role="status" aria-live="polite">
      <span className="loading-spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}
