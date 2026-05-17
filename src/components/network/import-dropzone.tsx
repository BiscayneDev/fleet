'use client'

import { useState, useRef, type DragEvent, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

function detectPlatform(
  filename: string,
  content: string,
): 'linkedin' | 'twitter' | null {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.csv') || lower.includes('connections')) return 'linkedin'
  if (lower.includes('following') || lower.endsWith('.js')) return 'twitter'
  if (content.includes('First Name') && content.includes('Last Name'))
    return 'linkedin'
  if (content.includes('YTD.following') || content.includes('accountId'))
    return 'twitter'
  return null
}

export function ImportDropzone() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [importing, setImporting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setImporting(true)
    setError(null)
    setStatus('Reading file…')

    try {
      const content = await file.text()
      const platform = detectPlatform(file.name, content)

      if (!platform) {
        setError(
          'Could not detect platform. Use a LinkedIn Connections.csv or Twitter following.js file.',
        )
        return
      }

      setStatus(
        `Importing ${platform === 'linkedin' ? 'LinkedIn' : 'Twitter'} connections…`,
      )

      const response = await fetch('/api/network/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, content, filename: file.name }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setError(data?.error ?? 'Import failed')
        return
      }

      const data = (await response.json()) as { summary?: string }
      setStatus(data.summary ?? 'Imported')
      router.refresh()
    } catch {
      setError('Failed to import file')
    } finally {
      setImporting(false)
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) void handleFile(file)
  }

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
  }

  return (
    <div
      className={cn(
        'group relative cursor-pointer rounded-xl border border-dashed border-border bg-card/30 px-6 py-12 text-center transition-all',
        'hover:border-primary/50 hover:bg-card/50',
        dragging && 'border-primary/70 bg-primary/5',
        importing && 'pointer-events-none opacity-80',
      )}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileRef.current?.click()}
      role="button"
      tabIndex={0}
    >
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.js,.json"
        onChange={handleFileSelect}
        className="sr-only"
      />

      <div className="mx-auto flex max-w-md flex-col items-center gap-3">
        {importing ? (
          <Loader2 className="size-6 animate-spin text-primary" />
        ) : (
          <div className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary">
            <Upload className="size-4" />
          </div>
        )}

        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {importing ? status : 'Drop your network export here'}
          </p>
          {!importing && (
            <p className="text-xs text-muted-foreground">
              LinkedIn{' '}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                Connections.csv
              </code>{' '}
              or Twitter{' '}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                following.js
              </code>
            </p>
          )}
        </div>

        {status && !importing && (
          <p className="text-xs text-[color:var(--success)]">{status}</p>
        )}
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    </div>
  )
}
