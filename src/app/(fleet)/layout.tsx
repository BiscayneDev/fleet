import type { ReactNode } from 'react';

import { FleetHeader } from '@/components/layout/fleet-header';
import { FleetRightRail } from '@/components/layout/fleet-right-rail';
import { FleetSidebar } from '@/components/layout/fleet-sidebar';

export default function FleetLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fleet-shell">
      <FleetSidebar />
      <div className="fleet-main">
        <FleetHeader />
        <main className="fleet-content">{children}</main>
      </div>
      <FleetRightRail />
    </div>
  );
}
