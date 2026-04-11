'use client';

import { useFleetShellStore } from '@/stores/fleet-shell-store';

export function FleetHeader() {
  const toggleSidebar = useFleetShellStore((state) => state.toggleSidebar);
  const toggleRightRail = useFleetShellStore((state) => state.toggleRightRail);

  return (
    <header className="fleet-header">
      <div className="fleet-header-group">
        <button className="fleet-button" onClick={toggleSidebar} type="button">
          Toggle sidebar
        </button>
        <div>
          <p className="fleet-eyebrow">Cabinet-style shell</p>
          <h2>Fleet</h2>
        </div>
      </div>

      <div className="fleet-header-group">
        <input aria-label="Command bar" className="fleet-command" placeholder="Search projects, inbox, and knowledge…" type="search" />
        <button className="fleet-button" onClick={toggleRightRail} type="button">
          Toggle rail
        </button>
      </div>
    </header>
  );
}
