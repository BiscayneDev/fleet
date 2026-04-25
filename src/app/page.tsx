'use client';

import Link from 'next/link';

const features = [
  {
    key: 'projects',
    label: 'Projects',
    description: 'Organize your work into projects with briefs, tasks, and timelines.',
    icon: '📁',
  },
  {
    key: 'inbox',
    label: 'Inbox',
    description: 'Capture ideas, tasks, and inspirations from anywhere.',
    icon: '📥',
  },
  {
    key: 'wiki',
    label: 'Wiki',
    description: 'Build a knowledge base that compounds over time with LLM-powered notes.',
    icon: '📚',
  },
  {
    key: 'agents',
    label: 'Agents',
    description: 'AI agents that work on your projects autonomously.',
    icon: '🤖',
  },
  {
    key: 'gmail',
    label: 'Gmail',
    description: 'Connect your email to surface relevant messages in context.',
    icon: '📧',
  },
  {
    key: 'calendar',
    label: 'Calendar',
    description: 'Sync your schedule to never miss important meetings.',
    icon: '📅',
  },
  {
    key: 'artifacts',
    label: 'Artifacts',
    description: 'Store and organize outputs — documents, code, images, and more.',
    icon: '🎨',
  },
];

export default function FleetLanding() {
  return (
    <div className="fleet-landing">
      {/* Background */}
      <div aria-hidden="true" className="fleet-grid" />
      <div aria-hidden="true" className="fleet-glow" />

      {/* Nav */}
      <nav className="fleet-nav">
        <div className="fleet-nav-inner">
          <Link href="/" className="fleet-logo">
            Fleet
          </Link>
          <div className="fleet-nav-links">
            <Link href="/home" className="fleet-nav-link">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="fleet-hero">
        <div className="fleet-hero-inner">
          <p className="fleet-eyebrow">Fleet</p>
          <h1 className="fleet-title">
            Your personal project OS
          </h1>
          <p className="fleet-subtitle">
            Everything you need to bring a new product or project to market and crush your GTM.
          </p>
          <div className="fleet-cta">
            <Link href="/home" className="fleet-button-primary">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="fleet-features">
        <div className="fleet-features-inner">
          <h2 className="fleet-section-title">Everything you need</h2>
          <div className="fleet-feature-grid">
            {features.map((feature) => (
              <div key={feature.key} className="fleet-feature-card">
                <span className="fleet-feature-icon">{feature.icon}</span>
                <h3 className="fleet-feature-label">{feature.label}</h3>
                <p className="fleet-feature-desc">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="fleet-bottom-cta">
        <div className="fleet-bottom-cta-inner">
          <h2>Ready to ship?</h2>
          <p>Start your first project today.</p>
          <Link href="/home" className="fleet-button-primary">
            Get Started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="fleet-footer">
        <p>© 2026 Fleet. Built by Shipyard.</p>
      </footer>

      <style>{`
        .fleet-landing {
          min-height: 100vh;
          background: var(--fleet-bg);
          color: var(--fleet-text);
          font-family: Arial, Helvetica, sans-serif;
        }

        .fleet-grid {
          position: fixed;
          inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 24px 24px;
          pointer-events: none;
        }

        .fleet-glow {
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse_at_center, rgba(56, 189, 248, 0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        .fleet-nav {
          position: relative;
          z-index: 10;
          border-bottom: 1px solid var(--fleet-border);
        }

        .fleet-nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .fleet-logo {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--fleet-accent);
        }

        .fleet-nav-links {
          display: flex;
          gap: 1.5rem;
        }

        .fleet-nav-link {
          color: var(--fleet-text-muted);
          font-size: 0.875rem;
        }

        .fleet-nav-link:hover {
          color: var(--fleet-text);
        }

        .fleet-hero {
          position: relative;
          z-index: 10;
          padding: 6rem 2rem 4rem;
          text-align: center;
        }

        .fleet-hero-inner {
          max-width: 800px;
          margin: 0 auto;
        }

        .fleet-eyebrow {
          color: var(--fleet-accent);
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin: 0 0 1rem;
        }

        .fleet-title {
          font-size: 3.5rem;
          font-weight: 700;
          margin: 0 0 1.5rem;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .fleet-subtitle {
          font-size: 1.25rem;
          color: var(--fleet-text-muted);
          margin: 0 0 2.5rem;
          line-height: 1.6;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .fleet-cta {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .fleet-button-primary {
          background: var(--fleet-accent);
          color: #000;
          font-weight: 600;
          padding: 0.875rem 2rem;
          border-radius: 0.75rem;
          font-size: 1rem;
          transition: opacity 0.2s;
        }

        .fleet-button-primary:hover {
          opacity: 0.9;
        }

        .fleet-features {
          position: relative;
          z-index: 10;
          padding: 4rem 2rem 6rem;
        }

        .fleet-features-inner {
          max-width: 1200px;
          margin: 0 auto;
        }

        .fleet-section-title {
          font-size: 2rem;
          font-weight: 600;
          text-align: center;
          margin: 0 0 3rem;
        }

        .fleet-feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .fleet-feature-card {
          background: var(--fleet-panel);
          border: 1px solid var(--fleet-border);
          border-radius: 1rem;
          padding: 1.5rem;
        }

        .fleet-feature-icon {
          font-size: 1.5rem;
          display: block;
          margin-bottom: 0.75rem;
        }

        .fleet-feature-label {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 0.5rem;
        }

        .fleet-feature-desc {
          color: var(--fleet-text-muted);
          font-size: 0.875rem;
          margin: 0;
          line-height: 1.5;
        }

        .fleet-bottom-cta {
          position: relative;
          z-index: 10;
          padding: 4rem 2rem 6rem;
          text-align: center;
        }

        .fleet-bottom-cta-inner {
          max-width: 600px;
          margin: 0 auto;
        }

        .fleet-bottom-cta h2 {
          font-size: 2rem;
          font-weight: 600;
          margin: 0 0 0.5rem;
        }

        .fleet-bottom-cta p {
          color: var(--fleet-text-muted);
          margin: 0 0 2rem;
        }

        .fleet-footer {
          position: relative;
          z-index: 10;
          border-top: 1px solid var(--fleet-border);
          padding: 2rem;
          text-align: center;
          color: var(--fleet-text-muted);
          font-size: 0.875rem;
        }

        .fleet-footer p {
          margin: 0;
        }

        @media (max-width: 768px) {
          .fleet-title {
            font-size: 2.5rem;
          }
          
          .fleet-subtitle {
            font-size: 1rem;
          }

          .fleet-hero {
            padding: 4rem 1.5rem 3rem;
          }

          .fleet-features,
          .fleet-bottom-cta {
            padding: 3rem 1.5rem 4rem;
          }
        }
      `}</style>
    </div>
  );
}