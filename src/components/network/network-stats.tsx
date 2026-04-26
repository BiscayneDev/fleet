interface NetworkStatsProps {
  total: number;
  twitter: number;
  linkedin: number;
  topCompanies: Array<{ name: string; count: number }>;
}

export function NetworkStats({ total, twitter, linkedin, topCompanies }: NetworkStatsProps) {
  return (
    <div className="network-stats">
      <div className="network-stats-row">
        <div className="network-stat-box">
          <span className="network-stat-label">Total</span>
          <span className="network-stat-value">{total}</span>
        </div>
        <div className="network-stat-box">
          <span className="network-stat-label">LinkedIn</span>
          <span className="network-stat-value">{linkedin}</span>
        </div>
        <div className="network-stat-box">
          <span className="network-stat-label">Twitter</span>
          <span className="network-stat-value">{twitter}</span>
        </div>
      </div>
      {topCompanies.length > 0 && (
        <div className="network-companies">
          <span className="network-companies-label">Top companies:</span>
          {topCompanies.slice(0, 5).map((c) => (
            <span key={c.name} className="network-company-pill">
              {c.name} ({c.count})
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
