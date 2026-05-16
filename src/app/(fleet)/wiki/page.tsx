import Link from 'next/link'
import { BookOpen, FileText } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/empty-state/empty-state'
import { listProjects } from '@/lib/fs/project-store'
import { listWikiPages } from '@/lib/fs/wiki-store'

export default async function GlobalWikiPage() {
  const projects = await listProjects()

  const projectsWithPages = await Promise.all(
    projects.map(async (project) => {
      const pages = await listWikiPages(project.slug)
      return { project, pages }
    }),
  )

  const allWithPages = projectsWithPages.filter((p) => p.pages.length > 0)

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <header className="space-y-1.5 border-b border-border pb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Knowledge Base
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Knowledge Base
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          All captured research and derived knowledge across your projects.
        </p>
      </header>

      {allWithPages.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No wiki pages yet"
          description="Capture links or notes inside a project — Fleet's LLM enriches them into wiki pages here."
        />
      ) : (
        <div className="space-y-6">
          {allWithPages.map(({ project, pages }) => (
            <Card key={project.slug} className="overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <h2 className="text-sm font-semibold text-foreground">
                  {project.title}
                </h2>
                <Link
                  href={`/projects/${project.slug}/wiki`}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  View all →
                </Link>
              </div>
              <ul className="divide-y divide-border">
                {pages.slice(0, 8).map((page) => (
                  <li key={page.slug}>
                    <Link
                      href={`/projects/${project.slug}/wiki/${page.slug}`}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/40"
                    >
                      <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate text-sm text-foreground">
                        {page.title}
                      </span>
                      <Badge
                        variant="outline"
                        className="font-normal text-muted-foreground"
                      >
                        {page.type}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
