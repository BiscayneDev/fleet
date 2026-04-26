'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface QuickStats {
  projects: number;
  connections: number;
}

export function FleetRightRail() {
  const [stats, setStats] = useState<QuickStats | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then((r) => r.json()).catch(() => ({ projects: [] })),
      fetch('/api/network').then((r) => r.json()).catch(() => ({ stats: { total: 0 } })),
    ]).then(([projectData, networkData]) => {
      setStats({
        projects: projectData.projects?.length ?? 0,
        connections: networkData.stats?.total ?? 0,
      });
    });
  }, []);

  return (
    <aside className="fleet-right-rail">
      <div style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <p style={{
            fontSize: '0.65rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--fleet-text-muted)',
            margin: '0 0 0.5rem',
          }}>
            Quick Stats
          </p>
          {stats && (
            <div style={{ display: 'grid', gap: '0.35rem' }}>
              <Link href="/projects" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.4rem 0',
                  fontSize: '0.8rem',
                  borderBottom: '1px solid var(--fleet-border)',
                }}>
                  <span style={{ color: 'var(--fleet-text-muted)' }}>Projects</span>
                  <span style={{ fontWeight: 600 }}>{stats.projects}</span>
                </div>
              </Link>
              <Link href="/network" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.4rem 0',
                  fontSize: '0.8rem',
                  borderBottom: '1px solid var(--fleet-border)',
                }}>
                  <span style={{ color: 'var(--fleet-text-muted)' }}>Connections</span>
                  <span style={{ fontWeight: 600 }}>{stats.connections}</span>
                </div>
              </Link>
            </div>
          )}
        </div>

        <div>
          <p style={{
            fontSize: '0.65rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--fleet-text-muted)',
            margin: '0 0 0.5rem',
          }}>
            Quick Actions
          </p>
          <div style={{ display: 'grid', gap: '0.3rem' }}>
            <Link
              href="/projects"
              style={{
                fontSize: '0.78rem',
                color: 'var(--fleet-accent)',
                textDecoration: 'none',
                padding: '0.3rem 0',
              }}
            >
              + New Project
            </Link>
            <Link
              href="/network"
              style={{
                fontSize: '0.78rem',
                color: 'var(--fleet-accent)',
                textDecoration: 'none',
                padding: '0.3rem 0',
              }}
            >
              + Import Network
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
