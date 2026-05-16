import {
  listConnections,
  getNetworkStats,
  listImports,
} from '@/lib/fs/network-store'
import { ConnectionCard } from '@/components/network/connection-card'
import { NetworkStats } from '@/components/network/network-stats'
import { ImportDropzone } from '@/components/network/import-dropzone'
import { AnalyzeButton } from '@/components/network/analyze-button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function NetworkPage() {
  const [connections, stats, imports] = await Promise.all([
    listConnections(),
    getNetworkStats(),
    listImports(),
  ])

  const hasConnections = connections.length > 0

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <header className="space-y-1.5 border-b border-border pb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Network
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Network
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Import your professional network and let Fleet find GTM
          opportunities hiding in your connections.
        </p>
      </header>

      <ImportDropzone />

      {hasConnections ? (
        <>
          <NetworkStats
            total={stats.total}
            twitter={stats.twitter}
            linkedin={stats.linkedin}
            topCompanies={stats.topCompanies}
          />

          <Card className="p-5">
            <AnalyzeButton />
          </Card>

          {imports.length > 0 && (
            <Card className="overflow-hidden p-0">
              <div className="border-b border-border px-5 py-3">
                <h2 className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Import history
                </h2>
              </div>
              <ul className="divide-y divide-border">
                {imports.map((imp) => (
                  <li
                    key={imp.id}
                    className="flex items-center justify-between gap-4 px-5 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="secondary"
                        className="capitalize font-normal"
                      >
                        {imp.platform === 'linkedin' ? 'LinkedIn' : 'Twitter'}
                      </Badge>
                      <span className="text-sm text-foreground">
                        {imp.connectionCount} connections
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({imp.newCount} new)
                      </span>
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {new Date(imp.importedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              Connections{' '}
              <span className="text-muted-foreground">
                ({connections.length})
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {connections.map((conn) => (
                <ConnectionCard key={conn.id} connection={conn} />
              ))}
            </div>
          </section>
        </>
      ) : (
        <Card className="p-8">
          <h2 className="mb-5 text-center text-sm font-semibold text-foreground">
            How to export your network
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="border-border/60 bg-card/50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#0a66c2]" />
                <h3 className="text-sm font-semibold text-foreground">
                  LinkedIn
                </h3>
              </div>
              <ol className="space-y-1 text-sm text-muted-foreground">
                <li>1. Settings &amp; Privacy</li>
                <li>2. Data Privacy</li>
                <li>3. Get a copy of your data</li>
                <li>4. Select &quot;Connections&quot;</li>
                <li>5. Download the CSV</li>
              </ol>
            </Card>
            <Card className="border-border/60 bg-card/50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#1d9bf0]" />
                <h3 className="text-sm font-semibold text-foreground">
                  Twitter / X
                </h3>
              </div>
              <ol className="space-y-1 text-sm text-muted-foreground">
                <li>1. Settings &amp; Privacy</li>
                <li>2. Your Account</li>
                <li>3. Download an archive</li>
                <li>
                  4. Find{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    following.js
                  </code>
                </li>
                <li>5. Drop it here</li>
              </ol>
            </Card>
          </div>
        </Card>
      )}
    </div>
  )
}
