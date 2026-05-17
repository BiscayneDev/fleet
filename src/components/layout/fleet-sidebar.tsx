'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  FolderOpen,
  Inbox,
  Users,
  BookOpen,
  Activity,
  ChevronRight,
  Plus,
  FileText,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { fleetNavItems, type FleetNavItem } from '@/lib/fleet/nav'

const NAV_ICONS: Record<FleetNavItem['key'], LucideIcon> = {
  home: Home,
  projects: FolderOpen,
  inbox: Inbox,
  network: Users,
  wiki: BookOpen,
  waitlists: Activity,
}

interface KBPage {
  slug: string
  title: string
  type: string
}

function useProjectSlug(pathname: string | null): string | null {
  if (!pathname) return null
  const match = pathname.match(/^\/projects\/([^/]+)/)
  return match ? match[1] : null
}

export function FleetSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const projectSlug = useProjectSlug(pathname)
  const [kbPages, setKbPages] = useState<KBPage[]>([])
  const [kbExpanded, setKbExpanded] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newPageTitle, setNewPageTitle] = useState('')

  const loadKBPages = useCallback(async (slug: string) => {
    try {
      const res = await fetch(`/api/wiki/${slug}/list`)
      if (res.ok) {
        const data = (await res.json()) as { pages?: KBPage[] }
        setKbPages(data.pages ?? [])
      }
    } catch {
      setKbPages([])
    }
  }, [])

  useEffect(() => {
    if (projectSlug) {
      void loadKBPages(projectSlug)
    } else {
      setKbPages([])
    }
  }, [projectSlug, loadKBPages])

  async function handleCreatePage() {
    if (!newPageTitle.trim() || !projectSlug) return
    const title = newPageTitle.trim()
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    try {
      const res = await fetch(`/api/wiki/${projectSlug}/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: `# ${title}\n\n` }),
      })
      if (!res.ok) {
        await fetch('/api/ingest/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectSlug,
            type: 'note',
            title,
            body: `# ${title}\n\n`,
          }),
        })
      }
      setNewPageTitle('')
      setCreating(false)
      await loadKBPages(projectSlug)
      router.push(`/projects/${projectSlug}/wiki/${slug}`)
    } catch {
      // silent
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-50 flex size-9 items-center justify-center rounded-md border border-border bg-card text-foreground shadow-sm md:hidden"
      >
        <Menu className="size-4" />
      </button>

      {mobileOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <Link
            href="/home"
            className="flex items-baseline gap-2"
            onClick={() => setMobileOpen(false)}
          >
            <span className="text-base font-semibold tracking-tight text-foreground">
              Fleet
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
              GTM
            </span>
          </Link>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="text-muted-foreground transition-colors hover:text-foreground md:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav
          aria-label="Fleet navigation"
          className="flex-1 overflow-y-auto px-2 py-3"
        >
          <ul className="space-y-0.5">
            {fleetNavItems.map((item) => {
              const Icon = NAV_ICONS[item.key]
              const active =
                pathname === item.href ||
                pathname?.startsWith(`${item.href}/`)
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                      active
                        ? 'bg-sidebar-accent text-foreground'
                        : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>

          {projectSlug && (
            <div className="mt-6 px-1">
              <button
                type="button"
                onClick={() => setKbExpanded(!kbExpanded)}
                className="flex w-full items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronRight
                  className={cn(
                    'size-3 transition-transform',
                    kbExpanded && 'rotate-90',
                  )}
                />
                Knowledge Base
              </button>

              {kbExpanded && (
                <div className="mt-2 space-y-0.5">
                  {kbPages.map((page) => {
                    const href = `/projects/${projectSlug}/wiki/${page.slug}`
                    const isActive = pathname === href
                    return (
                      <Link
                        key={page.slug}
                        href={href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'flex items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors',
                          isActive
                            ? 'bg-sidebar-accent text-foreground'
                            : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
                        )}
                      >
                        <FileText className="size-3 shrink-0 opacity-50" />
                        <span className="truncate">{page.title}</span>
                      </Link>
                    )
                  })}

                  {creating ? (
                    <input
                      className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                      value={newPageTitle}
                      onChange={(e) => setNewPageTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          void handleCreatePage()
                        } else if (e.key === 'Escape') {
                          setCreating(false)
                          setNewPageTitle('')
                        }
                      }}
                      onBlur={() => {
                        if (!newPageTitle.trim()) setCreating(false)
                      }}
                      placeholder="Page title…"
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCreating(true)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground"
                    >
                      <Plus className="size-3" />
                      New Page
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="border-t border-sidebar-border px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Local · Markdown · Yours
          </p>
        </div>
      </aside>
    </>
  )
}
