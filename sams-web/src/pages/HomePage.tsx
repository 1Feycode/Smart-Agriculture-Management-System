import {
  ArrowRight,
  BarChart3,
  CloudSun,
  Droplets,
  Leaf,
  MapPin,
  ShieldCheck,
  Sprout,
  Wheat,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import fieldRows from '../assets/field-rows.svg'

const capabilities = [
  {
    icon: Wheat,
    title: 'Crop information',
    description: 'A clear entry point to organized crop and production guidance.',
    accent: 'green',
  },
  {
    icon: Droplets,
    title: 'Soil & inputs',
    description: 'A place for soil information and expert-reviewed guidance.',
    accent: 'amber',
  },
  {
    icon: BarChart3,
    title: 'Market insights',
    description: 'Designed to make agricultural price information easier to find.',
    accent: 'green',
  },
  {
    icon: CloudSun,
    title: 'Weather context',
    description: 'A future home for location-based weather information.',
    accent: 'amber',
  },
]

export function HomePage() {
  return (
    <>
      <section className="hero-section">
        <div className="hero-section__inner">
          <div className="hero-copy">
            <div className="eyebrow"><ShieldCheck size={15} aria-hidden="true" /> Agricultural information, thoughtfully connected</div>
            <h1>Make informed decisions.<br /><span>Grow with confidence.</span></h1>
            <p className="hero-copy__description">
              SAMS is being built to bring practical agricultural information and helpful workflows into one clear, accessible place.
            </p>
            <div className="hero-actions">
              <Link className="button button--primary button--large" to="/register">
                Get started <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link className="button button--secondary button--large" to="/crops">
                Explore crop information
              </Link>
            </div>
            <div className="hero-note">
              <span className="hero-note__dot" aria-hidden="true" />
              Foundation preview — live data and account features are not connected yet.
            </div>
          </div>

          <div className="hero-visual" aria-label="Illustration of SAMS information areas">
            <img className="hero-visual__rows" src={fieldRows} alt="" aria-hidden="true" />
            <div className="hero-visual__halo" aria-hidden="true" />
            <div className="hero-visual__center">
              <span className="hero-visual__leaf"><Leaf size={31} aria-hidden="true" /></span>
              <strong>Rooted in good information</strong>
              <span>Connecting people and agricultural knowledge</span>
            </div>
            {capabilities.map(({ icon: Icon, title, description, accent }, index) => (
              <article className={`feature-float feature-float--${index + 1}`} key={title}>
                <span className={`feature-float__icon feature-float__icon--${accent}`}><Icon size={20} aria-hidden="true" /></span>
                <strong>{title}</strong>
                <p>{description}</p>
              </article>
            ))}
            <div className="hero-location"><MapPin size={14} aria-hidden="true" /> Local knowledge matters</div>
          </div>
        </div>
      </section>

      <section className="capabilities-section" aria-labelledby="capabilities-title">
        <div className="section-heading">
          <span className="section-kicker">One connected foundation</span>
          <h2 id="capabilities-title">Built around the information that matters</h2>
          <p>Designed for farmers and the people who support them, with room for trusted agricultural knowledge to grow.</p>
        </div>
        <div className="capability-grid">
          {capabilities.map(({ icon: Icon, title, description }, index) => (
            <article className="capability-card" key={title}>
              <span className={`capability-card__icon capability-card__icon--${index % 2 ? 'amber' : 'green'}`}><Icon size={21} aria-hidden="true" /></span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="about" className="about-section" aria-labelledby="about-title">
        <div className="about-section__mark" aria-hidden="true"><Sprout size={29} /></div>
        <div>
          <span className="section-kicker">About SAMS</span>
          <h2 id="about-title">A clearer path to agricultural information</h2>
          <p>
            The Smart Agriculture Management System is a web-based platform intended to improve access to reliable, timely, and organized agricultural information. It is being designed for farmers, agricultural experts, data managers, and administrators.
          </p>
          <Link className="text-link" to="/about">Learn about the project <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </section>

      <section className="public-cta">
        <div>
          <span className="section-kicker">Start with what is public</span>
          <h2>Explore the crop information entry point</h2>
          <p>Crop content will be available as the information catalog is prepared and reviewed.</p>
        </div>
        <Link className="button button--light" to="/crops">Browse crop information <ArrowRight size={16} aria-hidden="true" /></Link>
      </section>
    </>
  )
}
