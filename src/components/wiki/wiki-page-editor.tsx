'use client';

import { useCallback } from 'react';
import { FleetEditor } from '@/components/editor/fleet-editor';

interface WikiPageEditorProps {
  projectSlug: string;
  pageSlug: string;
  initialContent: string;
}

export function WikiPageEditor({ projectSlug, pageSlug, initialContent }: WikiPageEditorProps) {
  const handleSave = useCallback(
    async (markdown: string) => {
      try {
        await fetch(`/api/wiki/${projectSlug}/${pageSlug}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: markdown }),
        });
      } catch (error) {
        console.error('Failed to save wiki page:', error);
      }
    },
    [projectSlug, pageSlug]
  );

  return (
    <FleetEditor
      content={initialContent}
      onSave={handleSave}
      editable
      placeholder="Start writing..."
    />
  );
}
