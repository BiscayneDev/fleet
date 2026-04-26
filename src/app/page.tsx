'use client';

import Link from 'next/link';

const steps = [
  {
    number: '01',
    title: 'Capture',
    description: 'Stumble on a competitor on Twitter? A relevant blog post? Toss the link into Fleet. It gets scraped, enriched by AI, and added to your project context.',
  },
  {
    number: '02',
    title: 'Connect',
    description: 'Import your LinkedIn and Twitter network. Fleet maps your connections to your GTM — warm intros, co-marketing partners, and potential customers hiding in your existing network.',
  },
  {
    number: '03',
    title: 'Strategize',
    description: 'Chat with your GTM agent. It knows everything — your research, your network, your goals. It produces real deliverables: positioning, competitive analysis, launch plans.',
  },
];

export default function FleetLanding() {
  return (
    <div className="fleet-landing">
      <div aria-hidden="true" className="fleet-grid" />
      <div aria-hidden="true" className="fleet-glow" />

      {/* Nav */}
      <nav className="fleet-nav">
        <div className="fleet-nav-inner">
          <Link href="/" className="fleet-logo">
            Fleet<span className="fleet-logo-tag">GTM</span>
          </Link>
          <Link href="/home" className="fleet-nav-cta">
            Launch Fleet
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="fleet-hero">
        <div className="fleet-hero-inner">
          <p className="fleet-badge">GTM Intelligence for Founders</p>
          <h1 className="fleet-title">
            Your go-to-market<br />
            <span className="fleet-title-accent">gets smarter every day</span>
          </h1>
          <p className="fleet-subtitle">
            Capture research, connect your network, and let AI build your launch strategy.
            Fleet turns scattered links and connections into a competitive GTM playbook.
          </p>
          <div className="fleet-cta">
            <Link href="/home" className="fleet-button-primary">
              Get Started
            </Link>
            <Link href="/home" className="fleet-button-secondary">
              See how it works
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="fleet-steps">
        <div className="fleet-steps-inner">
          {steps.map((step) => (
            <div key={step.number} className="fleet-step">
              <span className="fleet-step-number">{step.number}</span>
              <h3 className="fleet-step-title">{step.title}</h3>
              <p className="fleet-step-desc">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Value prop */}
      <section className="fleet-value">
        <div className="fleet-value-inner">
          <h2 className="fleet-value-title">
            Not another AI chatbot.
          </h2>
          <p className="fleet-value-desc">
            ChatGPT gives generic advice because it doesn{"'"}t know your project.
            Fleet has your accumulated research, your network, your competitive landscape —
            and it gets smarter with every link you capture.
            The output is grounded in <em>your</em> context, not the internet{"'"}s.
          </p>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="fleet-bottom-cta">
        <div className="fleet-bottom-cta-inner">
          <h2>Ready to launch?</h2>
          <p>Your GTM strategy starts with one link.</p>
          <Link href="/home" className="fleet-button-primary">
            Get Started Free
          </Link>
        </div>
      </section>

      <footer className="fleet-footer">
        <p>Built by <strong>Shipyard</strong></p>
      </footer>

      <style>{`
        .fleet-landing {
          min-height: 100vh;
          background: var(--fleet-bg);
          color: var(--fleet-text);
          overflow-x: hidden;
        }

        .fleet-grid {
          position: fixed;
          inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
        }

        .fleet-glow {
          position: fixed;
          top: -30%;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 600px;
          background: radial-gradient(ellipse, rgba(56, 189, 248, 0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .fleet-nav {
          position: relative;
          z-index: 10;
          border-bottom: 1px solid rgba(30, 41, 59, 0.5);
        }

        .fleet-nav-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .fleet-logo {
          font-size: 1.2rem;
          font-weight: 800;
          color: var(--fleet-accent);
          letter-spacing: -0.02em;
        }

        .fleet-logo-tag {
          font-size: 0.55rem;
          color: var(--fleet-text-muted);
          margin-left: 0.3rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          vertical-align: super;
        }

        .fleet-nav-cta {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--fleet-bg);
          background: var(--fleet-accent);
          padding: 0.45rem 1rem;
          border-radius: 0.4rem;
          transition: opacity 0.15s;
        }

        .fleet-nav-cta:hover {
          opacity: 0.85;
        }

        .fleet-hero {
          position: relative;
          z-index: 10;
          padding: 8rem 2rem 5rem;
          text-align: center;
        }

        .fleet-hero-inner {
          max-width: 720px;
          margin: 0 auto;
        }

        .fleet-badge {
          display: inline-block;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--fleet-accent);
          background: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.2);
          border-radius: 2rem;
          padding: 0.35rem 0.85rem;
          margin: 0 0 1.5rem;
        }

        .fleet-title {
          font-size: 3.2rem;
          font-weight: 800;
          margin: 0 0 1.5rem;
          line-height: 1.1;
          letter-spacing: -0.03em;
        }

        .fleet-title-accent {
          background: linear-gradient(135deg, var(--fleet-accent) 0%, #818cf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .fleet-subtitle {
          font-size: 1.1rem;
          color: var(--fleet-text-muted);
          margin: 0 0 2.5rem;
          line-height: 1.7;
          max-width: 560px;
          margin-left: auto;
          margin-right: auto;
        }

        .fleet-cta {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
        }

        .fleet-button-primary {
          background: var(--fleet-accent);
          color: var(--fleet-bg);
          font-weight: 700;
          padding: 0.75rem 1.75rem;
          border-radius: 0.5rem;
          font-size: 0.9rem;
          transition: opacity 0.15s, transform 0.15s;
        }

        .fleet-button-primary:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .fleet-button-secondary {
          color: var(--fleet-text-muted);
          font-weight: 500;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-size: 0.9rem;
          border: 1px solid var(--fleet-border);
          transition: color 0.15s, border-color 0.15s;
        }

        .fleet-button-secondary:hover {
          color: var(--fleet-text);
          border-color: var(--fleet-text-muted);
        }

        /* Steps */
        .fleet-steps {
          position: relative;
          z-index: 10;
          padding: 2rem 2rem 6rem;
        }

        .fleet-steps-inner {
          max-width: 1000px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .fleet-step {
          background: var(--fleet-panel);
          border: 1px solid var(--fleet-border);
          border-radius: 0.75rem;
          padding: 1.5rem;
          transition: border-color 0.2s, transform 0.2s;
        }

        .fleet-step:hover {
          border-color: rgba(56, 189, 248, 0.3);
          transform: translateY(-2px);
        }

        .fleet-step-number {
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--fleet-accent);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .fleet-step-title {
          font-size: 1.15rem;
          font-weight: 700;
          margin: 0.5rem 0;
        }

        .fleet-step-desc {
          color: var(--fleet-text-muted);
          font-size: 0.82rem;
          margin: 0;
          line-height: 1.65;
        }

        /* Value prop */
        .fleet-value {
          position: relative;
          z-index: 10;
          padding: 4rem 2rem 5rem;
          text-align: center;
        }

        .fleet-value-inner {
          max-width: 640px;
          margin: 0 auto;
        }

        .fleet-value-title {
          font-size: 1.8rem;
          font-weight: 800;
          margin: 0 0 1rem;
          letter-spacing: -0.02em;
        }

        .fleet-value-desc {
          color: var(--fleet-text-muted);
          font-size: 0.95rem;
          margin: 0;
          line-height: 1.75;
        }

        .fleet-value-desc em {
          color: var(--fleet-accent);
          font-style: normal;
          font-weight: 600;
        }

        .fleet-bottom-cta {
          position: relative;
          z-index: 10;
          padding: 3rem 2rem 5rem;
          text-align: center;
        }

        .fleet-bottom-cta-inner {
          max-width: 500px;
          margin: 0 auto;
        }

        .fleet-bottom-cta h2 {
          font-size: 1.6rem;
          font-weight: 700;
          margin: 0 0 0.35rem;
        }

        .fleet-bottom-cta p {
          color: var(--fleet-text-muted);
          margin: 0 0 1.5rem;
          font-size: 0.9rem;
        }

        .fleet-footer {
          position: relative;
          z-index: 10;
          border-top: 1px solid var(--fleet-border);
          padding: 1.5rem 2rem;
          text-align: center;
          color: var(--fleet-text-muted);
          font-size: 0.78rem;
        }

        .fleet-footer p { margin: 0; }
        .fleet-footer strong { color: var(--fleet-text); font-weight: 600; }

        @media (max-width: 768px) {
          .fleet-title { font-size: 2.2rem; }
          .fleet-subtitle { font-size: 0.95rem; }
          .fleet-hero { padding: 5rem 1.5rem 3rem; }
          .fleet-steps-inner { grid-template-columns: 1fr; }
          .fleet-cta { flex-direction: column; align-items: center; }
        }
      `}</style>
    </div>
  );
}
