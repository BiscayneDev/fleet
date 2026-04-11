'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function CaptureForm() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch('/api/inbox', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ content }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          setError(payload?.error ?? 'Failed to save inbox item.');
          return;
        }

        setContent('');
        router.refresh();
      } catch {
        setError('Unable to reach the inbox right now. Please try again.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
      <label style={{ display: 'grid', gap: '0.5rem' }}>
        <span className="fleet-eyebrow">Quick capture</span>
        <textarea
          name="content"
          placeholder="Paste a link or jot down a note…"
          rows={6}
          value={content}
          onChange={(event) => setContent(event.target.value)}
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
      {error ? <p style={{ color: '#fca5a5', margin: 0 }}>{error}</p> : null}
      <button className="fleet-button" disabled={isPending || content.trim().length === 0} type="submit">
        {isPending ? 'Saving…' : 'Save to inbox'}
      </button>
    </form>
  );
}
