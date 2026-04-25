'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function CreateProjectButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          summary: summary.trim() || `Project: ${title.trim()}`,
          goals: [],
          desiredOutcomes: [],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsOpen(false);
        setTitle('');
        setSummary('');
        router.refresh();
        router.push(`/projects/${data.project.slug}`);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          background: 'var(--fleet-accent)',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          padding: '0.6rem 1.2rem',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 500,
        }}
      >
        + New Project
      </button>
    );
  }

  return (
    <div
      style={{
        background: 'var(--fleet-panel)',
        border: '1px solid var(--fleet-border)',
        borderRadius: '0.75rem',
        padding: '1.5rem',
      }}
    >
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
        <h3 style={{ margin: 0 }}>Create Project</h3>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What are you working on?"
            autoFocus
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: '1px solid var(--fleet-border)',
              background: 'var(--fleet-bg)',
              color: 'var(--fleet-text)',
              fontSize: '0.875rem',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
            Summary (optional)
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="One sentence on what this is and why it matters"
            rows={2}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: '1px solid var(--fleet-border)',
              background: 'var(--fleet-bg)',
              color: 'var(--fleet-text)',
              fontSize: '0.875rem',
              resize: 'vertical',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            style={{
              background: 'transparent',
              color: 'var(--fleet-text-muted)',
              border: '1px solid var(--fleet-border)',
              borderRadius: '0.375rem',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || isSubmitting}
            style={{
              background: 'var(--fleet-accent)',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.5rem 1rem',
              cursor: title.trim() ? 'pointer' : 'not-allowed',
              opacity: title.trim() ? 1 : 0.5,
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
