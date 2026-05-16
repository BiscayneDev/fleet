'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface OnboardingStep {
  readonly key: string
  readonly title: string
  readonly subtitle: string
  readonly href: string
  readonly cta: string
  readonly complete: boolean
}

interface OnboardingProps {
  readonly steps: OnboardingStep[]
  readonly projectSlug: string | null
}

export function Onboarding({ steps, projectSlug }: OnboardingProps) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('fleet-onboarding-dismissed')
    if (stored === 'true') setDismissed(true)
  }, [])

  if (dismissed) return null

  const completedCount = steps.filter((s) => s.complete).length
  if (completedCount === steps.length) return null

  function handleDismiss() {
    localStorage.setItem('fleet-onboarding-dismissed', 'true')
    setDismissed(true)
  }

  return (
    <section className="rounded-xl border border-border bg-card/40 p-6">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Welcome to Fleet
          </h2>
          <p className="text-sm text-muted-foreground">
            Get your GTM strategy built in 4 steps. Each step takes under a
            minute.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {completedCount} / {steps.length}
          </span>
          <button
            onClick={handleDismiss}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip setup
          </button>
        </div>
      </header>

      <ol className="divide-y divide-border/50 rounded-lg border border-border/50 bg-background/40">
        {steps.map((step, i) => {
          const href =
            step.key === 'capture' && projectSlug
              ? `/projects/${projectSlug}`
              : step.key === 'gtm' && projectSlug
                ? `/projects/${projectSlug}/gtm`
                : step.href

          return (
            <li
              key={step.key}
              className={cn(
                'flex items-center gap-4 px-4 py-3 transition-colors',
                !step.complete && 'hover:bg-accent/40',
              )}
            >
              <div
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                  step.complete
                    ? 'bg-primary/15 text-primary'
                    : 'border border-border bg-card text-muted-foreground',
                )}
              >
                {step.complete ? (
                  <Check className="size-3.5" strokeWidth={3} />
                ) : (
                  i + 1
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'text-sm font-medium',
                    step.complete
                      ? 'text-muted-foreground line-through'
                      : 'text-foreground',
                  )}
                >
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground">{step.subtitle}</p>
              </div>
              {step.complete ? (
                <span className="text-xs text-muted-foreground">Done</span>
              ) : (
                <Button asChild variant="secondary" size="sm">
                  <Link href={href}>{step.cta}</Link>
                </Button>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
