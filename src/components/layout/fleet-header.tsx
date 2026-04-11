export function FleetHeader() {
  return (
    <header className="fleet-header">
      <div className="fleet-header-group">
        <div>
          <p className="fleet-eyebrow">Cabinet-style shell</p>
          <h2>Fleet</h2>
        </div>
      </div>

      <div className="fleet-header-group">
        <input aria-label="Command bar" className="fleet-command" placeholder="Search projects, inbox, and knowledge…" type="search" />
      </div>
    </header>
  );
}
