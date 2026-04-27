import { listConnections, getNetworkStats, listImports } from '@/lib/fs/network-store';
import { ConnectionCard } from '@/components/network/connection-card';
import { NetworkStats } from '@/components/network/network-stats';
import { ImportDropzone } from '@/components/network/import-dropzone';
import { AnalyzeButton } from '@/components/network/analyze-button';

export default async function NetworkPage() {
  const [connections, stats, imports] = await Promise.all([
    listConnections(),
    getNetworkStats(),
    listImports(),
  ]);

  const hasConnections = connections.length > 0;

  return (
    <section className="fleet-stack">
      <header className="project-header">
        <h1 className="project-header-title">Network</h1>
        <p className="project-header-summary">
          Import your professional network and let Fleet find GTM opportunities hiding in your connections.
        </p>
      </header>

      <ImportDropzone />

      {hasConnections && (
        <>
          <NetworkStats
            total={stats.total}
            twitter={stats.twitter}
            linkedin={stats.linkedin}
            topCompanies={stats.topCompanies}
          />

          <article className="fleet-panel">
            <AnalyzeButton />
          </article>

          {imports.length > 0 && (
            <article className="fleet-panel fleet-stack">
              <h2 className="fleet-eyebrow">Import History</h2>
              <div className="fleet-stack" style={{ gap: '0.25rem' }}>
                {imports.map((imp) => (
                  <div key={imp.id} className="import-history-row">
                    <span>
                      <span className={`connection-platform-badge connection-platform-${imp.platform}`}>
                        {imp.platform === 'linkedin' ? 'LinkedIn' : 'Twitter'}
                      </span>
                      <span className="fleet-body"> {imp.connectionCount} connections ({imp.newCount} new)</span>
                    </span>
                    <span className="fleet-caption">
                      {new Date(imp.importedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          )}

          <article className="fleet-panel fleet-stack">
            <h2 className="fleet-eyebrow">Connections ({connections.length})</h2>
            <div className="connection-grid">
              {connections.map((conn) => (
                <ConnectionCard key={conn.id} connection={conn} />
              ))}
            </div>
          </article>
        </>
      )}

      {!hasConnections && (
        <article className="fleet-panel" style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 className="fleet-heading-sm" style={{ marginBottom: '0.75rem' }}>How to export your network</h2>
          <div className="export-instructions">
            <div className="export-card">
              <h3 className="export-card-title" style={{ color: '#0077b5' }}>LinkedIn</h3>
              <ol className="export-card-steps">
                <li>Settings &amp; Privacy</li>
                <li>Data Privacy</li>
                <li>Get a copy of your data</li>
                <li>Select &quot;Connections&quot;</li>
                <li>Download the CSV</li>
              </ol>
            </div>
            <div className="export-card">
              <h3 className="export-card-title" style={{ color: '#1d9bf0' }}>Twitter / X</h3>
              <ol className="export-card-steps">
                <li>Settings &amp; Privacy</li>
                <li>Your Account</li>
                <li>Download an archive</li>
                <li>Find <code>following.js</code></li>
                <li>Drop it here</li>
              </ol>
            </div>
          </div>
        </article>
      )}
    </section>
  );
}
