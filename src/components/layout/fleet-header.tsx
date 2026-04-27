'use client';

export function FleetHeader({ onSearchOpen }: { onSearchOpen?: () => void }) {
  return (
    <header className="fleet-header">
      <div className="fleet-header-group">
        <button
          className="fleet-command"
          onClick={onSearchOpen}
          type="button"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="fleet-command-text">Search Fleet...</span>
          <kbd className="fleet-command-kbd">
            <span>&#8984;</span>K
          </kbd>
        </button>
      </div>
    </header>
  );
}
