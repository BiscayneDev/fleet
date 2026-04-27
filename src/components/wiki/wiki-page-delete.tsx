'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface WikiPageDeleteProps {
  projectSlug: string;
  pageSlug: string;
}

export function WikiPageDelete({ projectSlug, pageSlug }: WikiPageDeleteProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/wiki/${projectSlug}/${pageSlug}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push(`/projects/${projectSlug}/wiki`);
        router.refresh();
      }
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="doc-delete-confirm">
        <span className="doc-delete-confirm-text">Delete this page?</span>
        <button
          type="button"
          className="fleet-button fleet-button-danger fleet-button-sm"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
        <button
          type="button"
          className="fleet-button fleet-button-ghost fleet-button-sm"
          onClick={() => setConfirming(false)}
          disabled={deleting}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="doc-delete-btn"
      onClick={() => setConfirming(true)}
      title="Delete page"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    </button>
  );
}
