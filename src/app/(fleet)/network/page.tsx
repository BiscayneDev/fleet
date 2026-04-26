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
      <header className="fleet-panel fleet-stack">
        <p className="fleet-eyebrow">Network Intelligence</p>
        <h1 style={{ margin: 0 }}>Your Network</h1>
        <p style={{ color: 'var(--fleet-text-muted)', margin: 0, fontSize: '0.85rem' }}>
          Import your professional network and let Fleet find GTM opportunities hiding in your connections.
        </p>
      </header>

      {/* Import section */}
      <ImportDropzone />

      {hasConnections && (
        <>
          {/* Stats */}
          <NetworkStats
            total={stats.total}
            twitter={stats.twitter}
            linkedin={stats.linkedin}
            topCompanies={stats.topCompanies}
          />

          {/* Analyze */}
          <article className="fleet-panel">
            <AnalyzeButton />
          </article>

          {/* Import history */}
          {imports.length > 0 && (
            <article className="fleet-panel fleet-stack">
              <h2 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--fleet-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Import History
              </h2>
              <div style={{ display: 'grid', gap: '0.35rem' }}>
                {imports.map((imp) => (
                  <div
                    key={imp.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.8rem',
                      padding: '0.4rem 0',
                      borderBottom: '1px solid var(--fleet-border)',
                    }}
                  >
                    <span>
                      <span className={`connection-platform-badge connection-platform-${imp.platform}`} style={{ marginRight: '0.5rem' }}>
                        {imp.platform === 'linkedin' ? 'LinkedIn' : 'Twitter'}
                      </span>
                      {imp.connectionCount} connections ({imp.newCount} new)
                    </span>
                    <span style={{ color: 'var(--fleet-text-muted)', fontSize: '0.75rem' }}>
                      {new Date(imp.importedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          )}

          {/* Connection list */}
          <article className="fleet-panel fleet-stack">
            <h2 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--fleet-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Connections ({connections.length})
            </h2>
            <div className="connection-grid">
              {connections.map((conn) => (
                <ConnectionCard key={conn.id} connection={conn} />
              ))}
            </div>
          </article>
        </>
      )}

      {!hasConnections && (
        <article className="fleet-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>How to export your network</h2>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr', maxWidth: '600px', margin: '1rem auto 0', textAlign: 'left' }}>
            <div style={{ background: 'var(--fleet-bg)', borderRadius: '0.75rem', padding: '1rem', border: '1px solid var(--fleet-border)' }}>
              <h3 style={{ margin: '0 0 0.35rem', fontSize: '0.85rem', color: '#0077b5' }}>LinkedIn</h3>
              <ol style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--fleet-text-muted)', display: 'grid', gap: '0.2rem' }}>
                <li>Settings &amp; Privacy</li>
                <li>Data Privacy</li>
                <li>Get a copy of your data</li>
                <li>Select &quot;Connections&quot;</li>
                <li>Download the CSV</li>
              </ol>
            </div>
            <div style={{ background: 'var(--fleet-bg)', borderRadius: '0.75rem', padding: '1rem', border: '1px solid var(--fleet-border)' }}>
              <h3 style={{ margin: '0 0 0.35rem', fontSize: '0.85rem', color: '#1d9bf0' }}>Twitter / X</h3>
              <ol style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--fleet-text-muted)', display: 'grid', gap: '0.2rem' }}>
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
