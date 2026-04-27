import Link from 'next/link';

import { listProjects } from '@/lib/fs/project-store';
import { listArtifacts } from '@/lib/fs/artifact-store';
import { listWikiPages } from '@/lib/fs/wiki-store';
import { getNetworkStats } from '@/lib/fs/network-store';
import { gtmSteps } from '@/lib/gtm/steps';
import { CaptureForm } from '@/components/inbox/capture-form';
import { Onboarding } from '@/components/home/onboarding';

async function getProjectGtmProgress(slug: string) {
  const artifacts = await listArtifacts(slug);
  const completed = gtmSteps.filter((step) =>
    artifacts.some((a) => a.type === step.artifactType),
  ).length;
  return { completed, total: gtmSteps.length, artifacts };
}

export default async function FleetHomePage() {
  const [projects, networkStats] = await Promise.all([
    listProjects(),
    getNetworkStats(),
  ]);

  const projectsWithGtm = await Promise.all(
    projects.map(async (project) => {
      const [gtm, wikiPages] = await Promise.all([
        getProjectGtmProgress(project.slug),
        listWikiPages(project.slug),
      ]);
      return { ...project, gtm, sourceCount: wikiPages.length };
    }),
  );

  const activeProjects = projectsWithGtm.filter((p) => p.status === 'active');
  const totalArtifacts = projectsWithGtm.reduce((sum, p) => sum + p.gtm.artifacts.length, 0);
  const totalSources = projectsWithGtm.reduce((sum, p) => sum + p.sourceCount, 0);

  const hasAnyGtm = projectsWithGtm.some((p) => p.gtm.completed > 0);
  const firstProject = projectsWithGtm[0] ?? null;

  const needsOnboarding = projects.length === 0 || totalSources === 0 || networkStats.total === 0 || !hasAnyGtm;

  const onboardingSteps = [
    {
      key: 'project',
      title: 'Create your first project',
      subtitle: 'Define what you\'re building, your goals, and desired outcomes.',
      href: '/projects',
      cta: 'Create Project',
      complete: projects.length > 0,
    },
    {
      key: 'capture',
      title: 'Capture some research',
      subtitle: 'Paste competitor links, articles, or notes into your project.',
      href: firstProject ? `/projects/${firstProject.slug}` : '/projects',
      cta: 'Start Capturing',
      complete: totalSources > 0,
    },
    {
      key: 'network',
      title: 'Import your network',
      subtitle: 'Drop your LinkedIn or Twitter export to unlock network intelligence.',
      href: '/network',
      cta: 'Import Network',
      complete: networkStats.total > 0,
    },
    {
      key: 'gtm',
      title: 'Build your GTM',
      subtitle: 'One click generates your complete go-to-market strategy.',
      href: firstProject ? `/projects/${firstProject.slug}/gtm` : '/projects',
      cta: 'Build GTM',
      complete: hasAnyGtm,
    },
  ];

  return (
    <section className="fleet-stack">
      {/* Onboarding */}
      {needsOnboarding && (
        <Onboarding steps={onboardingSteps} projectSlug={firstProject?.slug ?? null} />
      )}

      {/* Hero header */}
      <header className="home-hero">
        <div className="home-hero-text">
          <h1 className="home-hero-title">Good {getTimeOfDay()}.</h1>
          <p className="home-hero-subtitle">
            {projects.length === 0
              ? 'Create your first project to get started with Fleet.'
              : `${activeProjects.length} active project${activeProjects.length !== 1 ? 's' : ''}, ${totalSources} sources captured, ${totalArtifacts} artifacts generated.`}
          </p>
        </div>
      </header>

      {/* Stats row */}
      <div className="home-stats-row">
        <StatCard label="Projects" value={String(projects.length)} href="/projects" />
        <StatCard label="Sources" value={String(totalSources)} />
        <StatCard label="Connections" value={String(networkStats.total)} href="/network" />
        <StatCard label="Artifacts" value={String(totalArtifacts)} />
      </div>

      {/* Quick actions */}
      <div className="home-actions">
        <Link href="/projects/quick-start" className="home-action-card home-action-accent">
          <span className="home-action-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </span>
          <span className="home-action-label">Idea to GTM in 60s</span>
          <span className="home-action-desc">One sentence to full strategy</span>
        </Link>
        {firstProject && (
          <Link href={`/projects/${firstProject.slug}`} className="home-action-card">
            <span className="home-action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </span>
            <span className="home-action-label">Open War Room</span>
            <span className="home-action-desc">Chat with your GTM agent</span>
          </Link>
        )}
        <Link href="/network" className="home-action-card">
          <span className="home-action-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <span className="home-action-label">Import Network</span>
          <span className="home-action-desc">LinkedIn or Twitter connections</span>
        </Link>
        {firstProject && (
          <Link href={`/projects/${firstProject.slug}/gtm`} className="home-action-card home-action-accent">
            <span className="home-action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </span>
            <span className="home-action-label">Build GTM</span>
            <span className="home-action-desc">Generate your go-to-market</span>
          </Link>
        )}
      </div>

      {/* Projects list */}
      {projectsWithGtm.length > 0 && (
        <div className="fleet-panel fleet-stack">
          <div className="home-section-header">
            <h2 className="fleet-heading-sm">Projects</h2>
            <Link href="/projects" className="home-view-all">View all →</Link>
          </div>

          <div className="home-project-list">
            {projectsWithGtm.slice(0, 5).map((project) => (
              <Link
                key={project.slug}
                href={`/projects/${project.slug}`}
                className="home-project-card fleet-panel-interactive"
              >
                <div className="home-project-top">
                  <strong className="home-project-title">{project.title}</strong>
                  <span className={`fleet-badge ${project.status === 'active' ? 'fleet-badge-active' : project.status === 'draft' ? 'fleet-badge-draft' : 'fleet-badge-paused'}`}>
                    {project.status === 'active' && <span className="fleet-badge-dot" />}
                    {project.status}
                  </span>
                </div>

                {/* GTM progress bar */}
                <div className="home-project-progress">
                  <div className="home-project-progress-track">
                    <div
                      className="home-project-progress-fill"
                      style={{
                        width: `${(project.gtm.completed / project.gtm.total) * 100}%`,
                        background: project.gtm.completed === project.gtm.total
                          ? 'var(--fleet-success)'
                          : 'linear-gradient(90deg, var(--fleet-accent) 0%, #818cf8 100%)',
                      }}
                    />
                  </div>
                  <span className="home-project-progress-label">
                    GTM {project.gtm.completed}/{project.gtm.total}
                  </span>
                </div>

                <div className="home-project-meta">
                  <span>{project.sourceCount} sources</span>
                  <span>{project.gtm.artifacts.length} artifacts</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Network + Capture row */}
      <div className="home-bottom-row">
        {/* Quick capture */}
        <article className="fleet-panel">
          <p className="fleet-eyebrow" style={{ marginBottom: '0.5rem' }}>Quick Capture</p>
          <CaptureForm />
        </article>

        {/* Network summary */}
        {networkStats.total > 0 ? (
          <article className="fleet-panel fleet-stack">
            <div className="home-section-header">
              <h3 className="fleet-heading-sm">Network</h3>
              <Link href="/network" className="home-view-all">View →</Link>
            </div>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {networkStats.linkedin > 0 && (
                <span className="fleet-badge" style={{ background: 'rgba(0, 119, 181, 0.12)', color: '#0077b5' }}>
                  {networkStats.linkedin} LinkedIn
                </span>
              )}
              {networkStats.twitter > 0 && (
                <span className="fleet-badge" style={{ background: 'rgba(29, 155, 240, 0.12)', color: '#1d9bf0' }}>
                  {networkStats.twitter} Twitter
                </span>
              )}
            </div>
            {networkStats.topCompanies.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                {networkStats.topCompanies.slice(0, 6).map((c) => (
                  <span key={c.name} className="fleet-badge fleet-badge-paused">
                    {c.name} ({c.count})
                  </span>
                ))}
              </div>
            )}
          </article>
        ) : (
          <article className="fleet-panel" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
            <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600 }}>Import your network</p>
            <p className="fleet-caption" style={{ margin: 0 }}>
              Drop your LinkedIn or Twitter export to unlock network intelligence.
            </p>
            <Link href="/network" style={{ fontSize: '0.75rem', color: 'var(--fleet-accent)', fontWeight: 600, marginTop: '0.25rem' }}>
              Go to Network →
            </Link>
          </article>
        )}
      </div>
    </section>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function StatCard({ label, value, href }: { label: string; value: string; href?: string }) {
  const inner = (
    <div className="home-stat-card">
      <p className="home-stat-label">{label}</p>
      <p className="home-stat-value">{value}</p>
    </div>
  );

  if (href) {
    return <Link href={href} className="home-stat-link">{inner}</Link>;
  }

  return inner;
}
