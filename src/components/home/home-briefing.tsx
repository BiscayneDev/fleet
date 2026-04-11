import type { ReactNode } from 'react';
import Link from 'next/link';

import { CaptureForm } from '@/components/inbox/capture-form';
import type { HomeBriefing } from '@/lib/fleet/home';

function HomeSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="fleet-panel fleet-stack">
      <div className="fleet-stack" style={{ gap: '0.35rem' }}>
        <p className="fleet-eyebrow">{eyebrow}</p>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <p style={{ color: 'var(--fleet-text-muted)', margin: 0 }}>{description}</p>
      </div>
      {children}
    </section>
  );
}

export function HomeBriefing({ briefing }: { briefing: HomeBriefing }) {
  return (
    <div className="fleet-stack">
      <section className="fleet-panel fleet-stack">
        <div className="fleet-stack" style={{ gap: '0.35rem' }}>
          <p className="fleet-eyebrow">Home</p>
          <h1 style={{ margin: 0 }}>Executive briefing</h1>
          <p style={{ color: 'var(--fleet-text-muted)', margin: 0 }}>
            A calm read on what matters now across projects, activity, and captured knowledge.
          </p>
        </div>
      </section>

      <div
        style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)',
        }}
      >
        <HomeSection
          eyebrow="Command"
          title="Search or capture without leaving context"
          description="Use the command bar for a quick scan, or drop raw notes and links here for later triage."
        >
          <p style={{ margin: 0 }}>The command bar in the header is always available when you need to jump between projects.</p>
          <CaptureForm />
        </HomeSection>

        <HomeSection
          eyebrow="Attention"
          title="What needs attention"
          description="A short list of projects asking for a decision, next action, or restart."
        >
          {briefing.attentionItems.length > 0 ? (
            <ul style={{ display: 'grid', gap: '0.75rem', listStyle: 'none', margin: 0, padding: 0 }}>
              {briefing.attentionItems.map((item) => (
                <li key={item.slug}>
                  <Link href={`/projects/${item.slug}`} style={{ display: 'grid', gap: '0.2rem' }}>
                    <strong>{item.title}</strong>
                    <span style={{ color: 'var(--fleet-text-muted)' }}>{item.detail}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0 }}>No urgent attention items. The portfolio looks steady.</p>
          )}
        </HomeSection>
      </div>

      <div
        style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        }}
      >
        <HomeSection
          eyebrow="Projects"
          title="Active projects"
          description="Prioritized so active work stays ahead of drafts, paused threads, and completed items."
        >
          {briefing.activeProjects.length > 0 ? (
            <ul style={{ display: 'grid', gap: '0.75rem', listStyle: 'none', margin: 0, padding: 0 }}>
              {briefing.activeProjects.map((project) => (
                <li key={project.slug}>
                  <Link href={`/projects/${project.slug}`} style={{ display: 'grid', gap: '0.25rem' }}>
                    <strong>{project.title}</strong>
                    <span style={{ color: 'var(--fleet-text-muted)', textTransform: 'capitalize' }}>
                      {project.status} · {project.summary}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0 }}>No projects yet. Create one to start building the briefing.</p>
          )}
        </HomeSection>

        <HomeSection
          eyebrow="Agents"
          title="Agent activity"
          description="Recent automation signals, with a bias toward active work that may need follow-through."
        >
          {briefing.agentActivity.length > 0 ? (
            <ul style={{ display: 'grid', gap: '0.75rem', listStyle: 'none', margin: 0, padding: 0 }}>
              {briefing.agentActivity.map((item) => (
                <li key={item.slug} style={{ display: 'grid', gap: '0.2rem' }}>
                  <strong>{item.projectTitle}</strong>
                  <span style={{ color: 'var(--fleet-text-muted)' }}>{item.detail}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0 }}>No recent agent activity recorded yet.</p>
          )}
        </HomeSection>

        <HomeSection
          eyebrow="Knowledge"
          title="Recent knowledge"
          description="Fresh context from recently updated projects so you can re-enter work quickly."
        >
          {briefing.recentKnowledge.length > 0 ? (
            <ul style={{ display: 'grid', gap: '0.75rem', listStyle: 'none', margin: 0, padding: 0 }}>
              {briefing.recentKnowledge.map((item) => (
                <li key={item.slug} style={{ display: 'grid', gap: '0.2rem' }}>
                  <strong>{item.projectTitle}</strong>
                  <span style={{ color: 'var(--fleet-text-muted)' }}>{item.detail}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0 }}>No recent knowledge yet. Update a project to see fresh context here.</p>
          )}
        </HomeSection>
      </div>
    </div>
  );
}
