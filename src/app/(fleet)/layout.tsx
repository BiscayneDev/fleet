'use client'

import type { ReactNode } from 'react'

import { FleetHeader } from '@/components/layout/fleet-header'
import { FleetSearchDialog } from '@/components/layout/fleet-search-dialog'
import { FleetSidebar } from '@/components/layout/fleet-sidebar'

export default function FleetLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <FleetSidebar />
      <div className="flex min-h-screen flex-col md:pl-60">
        <FleetHeader />
        <main className="flex-1">{children}</main>
      </div>
      <FleetSearchDialog />
    </div>
  )
}
