'use client';

import { useCallback } from 'react';
import { FleetEditor } from '@/components/editor/fleet-editor';

interface ArtifactEditorProps {
  projectSlug: string;
  artifactSlug: string;
  initialContent: string;
}

export function ArtifactEditor({ projectSlug, artifactSlug, initialContent }: ArtifactEditorProps) {
  const handleSave = useCallback(
    async (markdown: string) => {
      try {
        await fetch(`/api/artifacts/${projectSlug}/${artifactSlug}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: markdown }),
        });
      } catch (error) {
        console.error('Failed to save artifact:', error);
      }
    },
    [projectSlug, artifactSlug]
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
