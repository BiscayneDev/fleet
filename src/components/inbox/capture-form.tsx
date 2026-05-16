'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Project {
  slug: string
  title: string
}

function isLikelyUrl(value: string): boolean {
  try {
    const url = new URL(value.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function CaptureForm({
  preselectedProject,
}: { readonly preselectedProject?: string } = {}) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>(
    preselectedProject ?? '',
  )
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isUrl = isLikelyUrl(content)
  const enrichmentReady = isUrl && Boolean(selectedProject)

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((data: { projects?: Project[] }) =>
        setProjects(data.projects ?? []),
      )
      .catch(() => undefined)
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!content.trim() || submitting) return

    setSubmitting(true)
    setStatus(null)
    setError(null)

    try {
      if (enrichmentReady) {
        setStatus('Researching link…')
        const res = await fetch('/api/ingest/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: content.trim(),
            projectSlug: selectedProject,
          }),
        })
        if (!res.ok) {
          const payload = await res.json().catch(() => null)
          setError(payload?.error ?? 'Failed to enrich link.')
          return
        }
        const result = (await res.json()) as { pages?: unknown[] }
        const count = result.pages?.length ?? 0
        setStatus(`Done — ${count} wiki page${count === 1 ? '' : 's'} created`)
        setContent('')
        setSelectedProject('')
        router.refresh()
        setTimeout(
          () => router.push(`/projects/${selectedProject}/wiki`),
          1000,
        )
      } else {
        const res = await fetch('/api/inbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: content.trim() }),
        })
        if (!res.ok) {
          const payload = await res.json().catch(() => null)
          setError(payload?.error ?? 'Failed to save.')
          return
        }
        setStatus('Saved')
        setContent('')
        router.refresh()
      }
    } catch {
      setError('Unable to reach the server. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        className={cn(
          'w-full resize-y rounded-md border border-input bg-background/60 px-3 py-2.5',
          'text-sm leading-relaxed text-foreground placeholder:text-muted-foreground',
          'shadow-xs transition-colors',
          'focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
        rows={3}
        placeholder="Paste a link or jot down a note…"
        value={content}
        onChange={(e) => {
          setContent(e.target.value)
          setStatus(null)
          setError(null)
        }}
        disabled={submitting}
      />

      {isUrl && !preselectedProject && projects.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Research into
          </label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            disabled={submitting}
            className={cn(
              'rounded-md border border-input bg-background/60 px-2.5 py-1 text-xs text-foreground',
              'focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
            )}
          >
            <option value="">— save to inbox only —</option>
            {projects.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="min-h-[1rem] text-xs">
          {error && <span className="text-destructive">{error}</span>}
          {!error && status && (
            <span className="text-muted-foreground">{status}</span>
          )}
          {!error && !status && (
            <span className="text-muted-foreground">
              {enrichmentReady
                ? 'Will enrich and create wiki pages'
                : 'Saved to today\'s inbox as a markdown block'}
            </span>
          )}
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={submitting || content.trim().length === 0}
        >
          {submitting
            ? status ?? 'Saving…'
            : enrichmentReady
              ? 'Research & enrich'
              : 'Capture'}
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </form>
  )
}
