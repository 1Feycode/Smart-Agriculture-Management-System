import { PageTitle } from '../components/common/PageTitle'

export function AboutPage() {
  return (
    <div className="content-page">
      <PageTitle title="About SAMS" description="A foundation for accessible, organized agricultural information." />
      <section className="content-panel">
        <h2>Purpose</h2>
        <p>
          The Smart Agriculture Management System is a web-based agricultural information platform designed to bring reliable, timely, and organized information into one place for farmers and related stakeholders.
        </p>
        <p>
          The project is intended to support access to crop, soil, fertilizer, weather, and market information, while creating room for communication with agricultural experts.
        </p>
        <p className="content-note">
          This foundation preview includes the application shell only. The information services and user workflows described here are not yet connected.
        </p>
      </section>
    </div>
  )
}
