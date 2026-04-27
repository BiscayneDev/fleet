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
      <div className="rail-sections">
        <div className="rail-section">
          <p className="rail-section-title">Quick Stats</p>
          {stats ? (
            <div className="rail-stat-list">
              <Link href="/projects" className="rail-stat-row">
                <span className="rail-stat-label">Projects</span>
                <span className="rail-stat-value">{stats.projects}</span>
              </Link>
              <Link href="/network" className="rail-stat-row">
                <span className="rail-stat-label">Connections</span>
                <span className="rail-stat-value">{stats.connections}</span>
              </Link>
            </div>
          ) : (
            <div className="rail-stat-list">
              <div className="rail-skeleton" />
              <div className="rail-skeleton" />
            </div>
          )}
        </div>

        <div className="rail-section">
          <p className="rail-section-title">Quick Actions</p>
          <div className="rail-action-list">
            <Link href="/projects" className="rail-action">
              <span className="rail-action-icon">+</span>
              New Project
            </Link>
            <Link href="/network" className="rail-action">
              <span className="rail-action-icon">+</span>
              Import Network
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
