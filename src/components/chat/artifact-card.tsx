'use client';

import { useState } from 'react';

import { MarkdownRenderer } from '@/components/shared/markdown-renderer';

interface ArtifactCardProps {
  title: string;
  type: string;
  content: string;
  projectSlug: string;
  onSaved?: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  'competitive-analysis': 'Competitive Analysis',
  'positioning': 'Positioning',
  'icp-profile': 'ICP Profile',
  'channel-strategy': 'Channel Strategy',
  'launch-plan': 'Launch Plan',
  'messaging': 'Messaging',
  'pricing-analysis': 'Pricing Analysis',
  'action-plan': 'Action Plan',
  'network-analysis': 'Network Analysis',
  'brief': 'Brief',
  'memo': 'Memo',
  'report': 'Report',
};

export function ArtifactCard({ title, type, content, projectSlug, onSaved }: ArtifactCardProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectSlug, title, type, content }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? 'Failed to save');
        return;
      }

      setSaved(true);
      onSaved?.();
    } catch {
      setError('Failed to save artifact');
    } finally {
      setSaving(false);
    }
  }

  const label = TYPE_LABELS[type] ?? type;

  return (
    <div className="artifact-card">
      <div className="artifact-card-header">
        <div className="artifact-card-meta">
          <span className="artifact-type-badge">{label}</span>
          <h3 className="artifact-card-title">{title}</h3>
        </div>
        <button
          className="artifact-save-button"
          onClick={handleSave}
          disabled={saving || saved}
        >
          {saved ? 'Saved' : saving ? 'Saving...' : 'Save to project'}
        </button>
      </div>
      <div className="artifact-card-body">
        <MarkdownRenderer content={content} />
      </div>
      {error && <p style={{ color: '#fca5a5', fontSize: '0.75rem', margin: '0.5rem 0 0' }}>{error}</p>}
    </div>
  );
}
