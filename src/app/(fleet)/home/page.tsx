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

      {/* Header */}
      <header className="fleet-panel fleet-stack">
        <p className="fleet-eyebrow">Command Center</p>
        <h1 style={{ margin: 0, fontSize: '1.3rem' }}>Good {getTimeOfDay()}.</h1>
        <p style={{ color: 'var(--fleet-text-muted)', margin: 0, fontSize: '0.85rem' }}>
          {projects.length === 0
            ? 'Create your first project to get started with Fleet.'
            : `${activeProjects.length} active project${activeProjects.length !== 1 ? 's' : ''}, ${totalSources} sources captured, ${totalArtifacts} artifacts generated.`}
        </p>
      </header>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <StatCard label="Projects" value={String(projects.length)} href="/projects" />
        <StatCard label="Sources" value={String(totalSources)} />
        <StatCard label="Connections" value={String(networkStats.total)} href="/network" />
        <StatCard label="Artifacts" value={String(totalArtifacts)} />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 320px' }}>
        {/* Left: Projects with GTM progress */}
        <div className="fleet-stack">
          <article className="fleet-panel fleet-stack">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '0.9rem' }}>Projects</h2>
              <Link
                href="/projects"
                style={{ fontSize: '0.75rem', color: 'var(--fleet-accent)', fontWeight: 600 }}
              >
                View all
              </Link>
            </div>

            {projectsWithGtm.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {projectsWithGtm.slice(0, 5).map((project) => (
                  <Link
                    key={project.slug}
                    href={`/projects/${project.slug}`}
                    style={{
                      display: 'grid',
                      gap: '0.35rem',
                      background: 'var(--fleet-bg)',
                      border: '1px solid var(--fleet-border)',
                      borderRadius: '0.5rem',
                      padding: '0.65rem 0.75rem',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'border-color 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.85rem' }}>{project.title}</strong>
                      <span style={{
                        fontSize: '0.6rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        color: project.status === 'active' ? '#22c55e' : 'var(--fleet-text-muted)',
                      }}>
                        {project.status}
                      </span>
                    </div>

                    {/* GTM progress bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        flex: 1,
                        height: '4px',
                        background: 'var(--fleet-panel-muted)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${(project.gtm.completed / project.gtm.total) * 100}%`,
                          height: '100%',
                          background: project.gtm.completed === project.gtm.total
                            ? '#22c55e'
                            : 'linear-gradient(90deg, var(--fleet-accent) 0%, #818cf8 100%)',
                          borderRadius: '2px',
                          transition: 'width 0.3s',
                        }} />
                      </div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--fleet-text-muted)', whiteSpace: 'nowrap' }}>
                        GTM {project.gtm.completed}/{project.gtm.total}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem', color: 'var(--fleet-text-muted)' }}>
                      <span>{project.sourceCount} sources</span>
                      <span>{project.gtm.artifacts.length} artifacts</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--fleet-text-muted)', fontSize: '0.85rem' }}>
                <p style={{ margin: '0 0 0.5rem' }}>No projects yet.</p>
                <Link
                  href="/projects"
                  style={{ color: 'var(--fleet-accent)', fontWeight: 600 }}
                >
                  Create your first project
                </Link>
              </div>
            )}
          </article>
        </div>

        {/* Right: Quick actions + capture */}
        <div className="fleet-stack">
          {/* Quick capture */}
          <article className="fleet-panel">
            <CaptureForm />
          </article>

          {/* Network summary */}
          {networkStats.total > 0 && (
            <article className="fleet-panel fleet-stack">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '0.85rem' }}>Network</h3>
                <Link
                  href="/network"
                  style={{ fontSize: '0.72rem', color: 'var(--fleet-accent)', fontWeight: 600 }}
                >
                  View
                </Link>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {networkStats.linkedin > 0 && (
                  <span style={{
                    fontSize: '0.7rem',
                    background: 'rgba(0, 119, 181, 0.12)',
                    color: '#0077b5',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.75rem',
                    fontWeight: 600,
                  }}>
                    {networkStats.linkedin} LinkedIn
                  </span>
                )}
                {networkStats.twitter > 0 && (
                  <span style={{
                    fontSize: '0.7rem',
                    background: 'rgba(29, 155, 240, 0.12)',
                    color: '#1d9bf0',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.75rem',
                    fontWeight: 600,
                  }}>
                    {networkStats.twitter} Twitter
                  </span>
                )}
              </div>
              {networkStats.topCompanies.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {networkStats.topCompanies.slice(0, 4).map((c) => (
                    <span key={c.name} style={{
                      fontSize: '0.65rem',
                      background: 'var(--fleet-panel-muted)',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '0.5rem',
                      color: 'var(--fleet-text-muted)',
                    }}>
                      {c.name} ({c.count})
                    </span>
                  ))}
                </div>
              )}
            </article>
          )}

          {/* Import CTA if no network */}
          {networkStats.total === 0 && (
            <article className="fleet-panel" style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>Import your network</p>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--fleet-text-muted)' }}>
                Drop your LinkedIn or Twitter export to unlock network intelligence.
              </p>
              <Link
                href="/network"
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--fleet-accent)',
                  fontWeight: 600,
                }}
              >
                Go to Network
              </Link>
            </article>
          )}
        </div>
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
  const content = (
    <div style={{
      flex: 1,
      background: 'var(--fleet-panel)',
      border: '1px solid var(--fleet-border)',
      borderRadius: '0.5rem',
      padding: '0.5rem 0.75rem',
      boxShadow: 'var(--fleet-shadow)',
      transition: 'border-color 0.15s',
    }}>
      <p style={{ margin: 0, fontSize: '0.6rem', color: 'var(--fleet-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
        {label}
      </p>
      <p style={{ margin: '0.1rem 0 0', fontSize: '1.1rem', fontWeight: 700 }}>{value}</p>
    </div>
  );

  if (href) {
    return <Link href={href} style={{ flex: 1, textDecoration: 'none', color: 'inherit' }}>{content}</Link>;
  }

  return content;
}
