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
        setStatus('Researching link…');
        const response = await fetch('/api/ingest/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: content.trim(), projectSlug: selectedProject }),
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
        setTimeout(() => router.push(`/projects/${selectedProject}/wiki`), 1200);
      } else {
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
    <form onSubmit={handleSubmit} className="capture-form">
      <label className="capture-form-label">
        <span className="fleet-eyebrow">Quick capture</span>
        <textarea
          className="capture-textarea"
          name="content"
          placeholder="Paste a link or jot down a note…"
          rows={3}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setStatus(null);
            setError(null);
          }}
        />
      </label>

      {isUrl && !preselectedProject && projects.length > 0 && (
        <div className="capture-project-picker">
          <span className="fleet-caption">Research into:</span>
          <select
            className="capture-select"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="">— save to inbox only —</option>
            {projects.map((p) => (
              <option key={p.slug} value={p.slug}>{p.title}</option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="capture-error">{error}</p>}
      {status && <p className="capture-status">{status}</p>}

      <button
        className="fleet-button fleet-button-primary"
        disabled={isSubmitting || content.trim().length === 0}
        type="submit"
      >
        {isSubmitting
          ? status ?? 'Saving…'
          : isUrl
            ? (preselectedProject || selectedProject) ? 'Research & enrich' : 'Save link to inbox'
            : 'Save to inbox'}
      </button>
    </form>
  );
}
