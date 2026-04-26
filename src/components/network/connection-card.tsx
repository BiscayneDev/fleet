import type { Connection } from '@/lib/fleet/types';

const PLATFORM_LABELS: Record<string, string> = {
  twitter: 'Twitter',
  linkedin: 'LinkedIn',
};

export function ConnectionCard({ connection }: { connection: Connection }) {
  return (
    <div className="connection-card">
      <div className="connection-card-header">
        <span className={`connection-platform-badge connection-platform-${connection.platform}`}>
          {PLATFORM_LABELS[connection.platform] ?? connection.platform}
        </span>
        <span className="connection-handle">@{connection.handle}</span>
      </div>
      <strong className="connection-name">{connection.displayName}</strong>
      {connection.company && (
        <p className="connection-detail">
          {connection.position ? `${connection.position} at ` : ''}{connection.company}
        </p>
      )}
      {connection.tags.length > 0 && (
        <div className="connection-tags">
          {connection.tags.map((tag) => (
            <span key={tag} className="connection-tag">{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}
