'use client';

import { useState, useTransition } from 'react';

export function CaptureForm() {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
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
      window.location.reload();
    });
  }

  return (
    <form className="fleet-inbox-form" onSubmit={handleSubmit}>
      <label className="fleet-inbox-field">
        <span className="fleet-eyebrow">Quick capture</span>
        <textarea
          name="content"
          placeholder="Paste a link or jot down a note…"
          rows={6}
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
      </label>
      {error ? <p className="fleet-inbox-error">{error}</p> : null}
      <button className="fleet-button" disabled={isPending || content.trim().length === 0} type="submit">
        {isPending ? 'Saving…' : 'Save to inbox'}
      </button>
    </form>
  );
}
