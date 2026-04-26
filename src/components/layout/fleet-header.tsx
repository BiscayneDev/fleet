export function FleetHeader() {
  return (
    <header className="fleet-header">
      <div className="fleet-header-group">
        <input
          aria-label="Command bar"
          className="fleet-command"
          placeholder="Search projects, network, and knowledge..."
          type="search"
        />
      </div>
    </header>
  );
}
