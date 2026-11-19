import { EmptyState } from '../components/common/EmptyState'
import { PageTitle } from '../components/common/PageTitle'

interface PublicPlaceholderPageProps {
  title: string
  description: string
}

export function PublicPlaceholderPage({ title, description }: PublicPlaceholderPageProps) {
  return (
    <div className="content-page">
      <PageTitle title={title} description={description} />
      <EmptyState
        title={`${title} is not connected yet`}
        description="This public entry point is prepared for a future phase. No live information is available in this foundation preview."
      />
    </div>
  )
}
