import Link from 'next/link'
import {
  ArrowRight,
  Inbox,
  Network as NetworkIcon,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'

import { Onboarding } from '@/components/home/onboarding'
import { CaptureForm } from '@/components/inbox/capture-form'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import { listProjects } from '@/lib/fs/project-store'
import { listArtifacts } from '@/lib/fs/artifact-store'
import { listWikiPages } from '@/lib/fs/wiki-store'
import { getNetworkStats } from '@/lib/fs/network-store'
import { gtmSteps } from '@/lib/gtm/steps'

async function getProjectGtmProgress(slug: string) {
  const artifacts = await listArtifacts(slug)
  const completed = gtmSteps.filter((step) =>
    artifacts.some((a) => a.type === step.artifactType),
  ).length
  return { completed, total: gtmSteps.length, artifacts }
}

function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

export default async function FleetHomePage() {
  const [projects, networkStats] = await Promise.all([
    listProjects(),
    getNetworkStats(),
  ])

  const projectsWithGtm = await Promise.all(
    projects.map(async (project) => {
      const [gtm, wikiPages] = await Promise.all([
        getProjectGtmProgress(project.slug),
        listWikiPages(project.slug),
      ])
      return { ...project, gtm, sourceCount: wikiPages.length }
    }),
  )

  const activeProjects = projectsWithGtm.filter((p) => p.status === 'active')
  const totalArtifacts = projectsWithGtm.reduce(
    (sum, p) => sum + p.gtm.artifacts.length,
    0,
  )
  const totalSources = projectsWithGtm.reduce(
    (sum, p) => sum + p.sourceCount,
    0,
  )
  const hasAnyGtm = projectsWithGtm.some((p) => p.gtm.completed > 0)
  const firstProject = projectsWithGtm[0] ?? null

  const needsOnboarding =
    projects.length === 0 ||
    totalSources === 0 ||
    networkStats.total === 0 ||
    !hasAnyGtm

  const onboardingSteps = [
    {
      key: 'project',
      title: 'Create your first project',
      subtitle:
        "Define what you're building, your goals, and desired outcomes.",
      href: '/projects',
      cta: 'Create',
      complete: projects.length > 0,
    },
    {
      key: 'capture',
      title: 'Capture some research',
      subtitle:
        'Paste competitor links, articles, or notes into your project.',
      href: firstProject ? `/projects/${firstProject.slug}` : '/projects',
      cta: 'Capture',
      complete: totalSources > 0,
    },
    {
      key: 'network',
      title: 'Import your network',
      subtitle:
        'Drop your LinkedIn or Twitter export to unlock network intelligence.',
      href: '/network',
      cta: 'Import',
      complete: networkStats.total > 0,
    },
    {
      key: 'gtm',
      title: 'Build your GTM',
      subtitle:
        'One click generates your complete go-to-market strategy.',
      href: firstProject ? `/projects/${firstProject.slug}/gtm` : '/projects',
      cta: 'Build',
      complete: hasAnyGtm,
    },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      {/* Onboarding (when not all steps done) */}
      {needsOnboarding && (
        <Onboarding
          steps={onboardingSteps}
          projectSlug={firstProject?.slug ?? null}
        />
      )}

      {/* Greeting */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Good {getTimeOfDay()}.
        </h1>
        <p className="text-sm text-muted-foreground">
          {projects.length === 0
            ? 'Create your first project to get started with Fleet.'
            : `${activeProjects.length} active project${activeProjects.length !== 1 ? 's' : ''} · ${totalSources} source${totalSources !== 1 ? 's' : ''} captured · ${totalArtifacts} artifact${totalArtifacts !== 1 ? 's' : ''} generated`}
        </p>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Projects" value={projects.length} href="/projects" />
        <StatTile label="Sources" value={totalSources} />
        <StatTile
          label="Connections"
          value={networkStats.total}
          href="/network"
        />
        <StatTile label="Artifacts" value={totalArtifacts} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <ActionCard
          href="/projects/quick-start"
          icon={Sparkles}
          title="Idea to GTM in 60s"
          description="One sentence to full strategy"
          accent
        />
        {firstProject ? (
          <ActionCard
            href={`/projects/${firstProject.slug}`}
            icon={Zap}
            title="Open War Room"
            description="Chat with your GTM agent"
          />
        ) : (
          <ActionCard
            href="/projects"
            icon={Zap}
            title="Create a project"
            description="Define what you're building"
          />
        )}
        <ActionCard
          href="/network"
          icon={NetworkIcon}
          title="Import network"
          description="LinkedIn or Twitter connections"
        />
        {firstProject ? (
          <ActionCard
            href={`/projects/${firstProject.slug}/gtm`}
            icon={Sparkles}
            title="Build GTM"
            description="Generate your go-to-market"
            accent
          />
        ) : (
          <ActionCard
            href="/inbox"
            icon={Inbox}
            title="Open inbox"
            description="Triage captured research"
          />
        )}
      </div>

      {/* Projects list */}
      {projectsWithGtm.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-foreground">Projects</h2>
            <Link
              href="/projects"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              View all →
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {projectsWithGtm.slice(0, 5).map((project) => (
              <li key={project.slug}>
                <Link
                  href={`/projects/${project.slug}`}
                  className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-accent/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="truncate text-sm font-medium text-foreground">
                        {project.title}
                      </span>
                      <Badge
                        variant={
                          project.status === 'active'
                            ? 'default'
                            : 'secondary'
                        }
                        className="h-5 text-[10px] tracking-wider uppercase"
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {project.sourceCount} sources ·{' '}
                      {project.gtm.artifacts.length} artifacts ·{' '}
                      GTM {project.gtm.completed}/{project.gtm.total}
                    </p>
                  </div>
                  <div className="hidden w-32 md:block">
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          'h-full transition-all',
                          project.gtm.completed === project.gtm.total
                            ? 'bg-[color:var(--success)]'
                            : 'bg-primary',
                        )}
                        style={{
                          width: `${(project.gtm.completed / project.gtm.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Bottom row: capture + network summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-5">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Quick capture
          </p>
          <CaptureForm />
        </Card>

        {networkStats.total > 0 ? (
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Network
              </p>
              <Link
                href="/network"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                View →
              </Link>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {networkStats.linkedin > 0 && (
                <Badge variant="secondary" className="font-normal">
                  {networkStats.linkedin} LinkedIn
                </Badge>
              )}
              {networkStats.twitter > 0 && (
                <Badge variant="secondary" className="font-normal">
                  {networkStats.twitter} Twitter
                </Badge>
              )}
            </div>
            {networkStats.topCompanies.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {networkStats.topCompanies.slice(0, 6).map((c) => (
                  <Badge
                    key={c.name}
                    variant="outline"
                    className="font-normal text-muted-foreground"
                  >
                    {c.name}{' '}
                    <span className="ml-1 text-[10px] opacity-60">
                      {c.count}
                    </span>
                  </Badge>
                ))}
              </div>
            )}
          </Card>
        ) : (
          <Card className="flex flex-col items-center justify-center gap-2 p-6 text-center">
            <div className="flex size-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
              <Users className="size-4" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Import your network
            </p>
            <p className="text-xs text-muted-foreground">
              Drop your LinkedIn or Twitter export to unlock network
              intelligence.
            </p>
            <Link
              href="/network"
              className="mt-1 text-xs font-medium text-primary transition-colors hover:opacity-80"
            >
              Go to Network →
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}

function StatTile({
  label,
  value,
  href,
}: {
  label: string
  value: number
  href?: string
}) {
  const inner = (
    <div className="rounded-lg border border-border bg-card/40 p-4 transition-colors hover:bg-card/70">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  )
  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    )
  }
  return inner
}

function ActionCard({
  href,
  icon: Icon,
  title,
  description,
  accent,
}: {
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  title: string
  description: string
  accent?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex flex-col gap-2 rounded-lg border p-4 transition-all',
        accent
          ? 'border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10'
          : 'border-border bg-card/40 hover:border-border hover:bg-card/70',
      )}
    >
      <div
        className={cn(
          'flex size-8 items-center justify-center rounded-md',
          accent
            ? 'bg-primary/15 text-primary'
            : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </Link>
  )
}
