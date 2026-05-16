import type { ReactNode, ComponentType, SVGProps } from 'react'

import { cn } from '@/lib/utils'

interface EmptyStateProps {
  readonly icon?: ComponentType<SVGProps<SVGSVGElement>>
  readonly title: string
  readonly description?: string
  readonly actions?: ReactNode
  /** A subtle visual under the description — e.g. a preview sketch. */
  readonly preview?: ReactNode
  readonly className?: string
}

/**
 * Fleet's empty-state primitive. Used whenever a list/page has no data.
 * Keep it spacious, opinionated, and visually anchored — empty states are
 * the #1 signal of "shipped vs MVP".
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
  preview,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center',
        className,
      )}
    >
      {Icon && (
        <div className="mb-5 flex size-12 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
          <Icon className="size-5" />
        </div>
      )}
      <h2 className="text-base font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {description && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {actions && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {actions}
        </div>
      )}
      {preview && (
        <div className="mt-10 w-full opacity-40 transition-opacity hover:opacity-60">
          {preview}
        </div>
      )}
    </div>
  )
}
