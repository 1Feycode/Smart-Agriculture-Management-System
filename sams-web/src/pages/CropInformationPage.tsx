import { Link } from 'react-router-dom'
import { EmptyState } from '../components/common/EmptyState'
import { PageTitle } from '../components/common/PageTitle'

export function CropInformationPage() {
  return (
    <div className="content-page">
      <PageTitle
        title="Crop information"
        description="A public entry point for crop and production information."
      />
      <EmptyState
        title="Crop information is being prepared"
        description="The crop catalog is not connected in this foundation phase. No crop records are being shown yet."
        action={<Link className="button button--secondary" to="/">Return to home</Link>}
      />
    </div>
  )
}
