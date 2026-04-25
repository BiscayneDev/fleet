'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  slug: string;
  title: string;
}

function isLikelyUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function CaptureForm({ preselectedProject }: { preselectedProject?: string } = {}) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>(preselectedProject ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isUrl = isLikelyUrl(content);

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((data) => setProjects(data.projects ?? []))
      .catch(() => {});
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setStatus(null);

    try {
      if (isUrl && selectedProject) {
        // URL + project → enrich
        setStatus('Researching link…');
        const response = await fetch('/api/ingest/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: content.trim(),
            projectSlug: selectedProject,
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          setError(payload?.error ?? 'Failed to enrich link.');
          return;
        }

        const result = await response.json();
        const pageCount = result.pages?.length ?? 0;
        setStatus(`Done — ${pageCount} wiki page${pageCount !== 1 ? 's' : ''} created`);
        setContent('');
        setSelectedProject('');
        router.refresh();

        // Auto-redirect to project wiki after a beat
        setTimeout(() => {
          router.push(`/projects/${selectedProject}/wiki`);
        }, 1200);
      } else {
        // Note or URL without project → save to inbox
        setStatus('Saving…');
        const response = await fetch('/api/inbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: content.trim() }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          setError(payload?.error ?? 'Failed to save.');
          return;
        }

        setStatus('Saved to inbox');
        setContent('');
        router.refresh();
      }
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
      <label style={{ display: 'grid', gap: '0.5rem' }}>
        <span className="fleet-eyebrow">Quick capture</span>
        <textarea
          name="content"
          placeholder="Paste a link or jot down a note…"
          rows={4}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setStatus(null);
            setError(null);
          }}
          style={{
            background: 'var(--fleet-panel-muted)',
            border: '1px solid var(--fleet-border)',
            borderRadius: '0.75rem',
            color: 'var(--fleet-text)',
            font: 'inherit',
            padding: '0.75rem 1rem',
            resize: 'vertical',
          }}
        />
      </label>

      {/* Project picker — only visible when a URL is detected and no project preselected */}
      {isUrl && !preselectedProject && projects.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--fleet-text-muted)', whiteSpace: 'nowrap' }}>
            Research into:
          </span>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            style={{
              flex: 1,
              appearance: 'none',
              backgroundColor: 'var(--fleet-panel-muted)',
              border: '1px solid var(--fleet-border)',
              borderRadius: '0.5rem',
              color: 'var(--fleet-text)',
              fontSize: '0.8rem',
              padding: '0.4rem 0.6rem',
            }}
          >
            <option value="">— save to inbox only —</option>
            {projects.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <p style={{ color: '#fca5a5', margin: 0, fontSize: '0.8rem' }}>{error}</p>
      )}
      {status && (
        <p style={{ color: 'var(--fleet-accent)', margin: 0, fontSize: '0.8rem' }}>{status}</p>
      )}

      <button
        className="fleet-button"
        disabled={isSubmitting || content.trim().length === 0}
        type="submit"
      >
        {isSubmitting
          ? status ?? 'Saving…'
          : isUrl
            ? preselectedProject
              ? 'Research & enrich'
              : selectedProject
                ? 'Research & enrich'
                : 'Save link to inbox'
            : 'Save to inbox'}
      </button>
    </form>
  );
}
