'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STATUSES = ['draft', 'active', 'paused', 'done'] as const;

type ProjectStatus = (typeof STATUSES)[number];

const STATUS_BADGE_CLASS: Record<ProjectStatus, string> = {
  draft: 'fleet-badge-draft',
  active: 'fleet-badge-active',
  paused: 'fleet-badge-paused',
  done: 'fleet-badge-complete',
};

export function ProjectActions({ slug, currentStatus }: { slug: string; currentStatus: ProjectStatus }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const router = useRouter();

  async function handleStatusChange(status: ProjectStatus) {
    if (status === currentStatus) return;
    setIsChangingStatus(true);
    try {
      const response = await fetch(`/api/projects/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        router.refresh();
      }
    } catch {
      // silently handle
    } finally {
      setIsChangingStatus(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${slug}/delete`, {
        method: 'DELETE',
      });
      if (response.ok) {
        router.push('/projects');
        router.refresh();
      }
    } catch {
      // silently handle
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <div className="project-actions">
      <select
        className={`project-status-select ${STATUS_BADGE_CLASS[currentStatus]}`}
        value={currentStatus}
        onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
        disabled={isChangingStatus}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {!showDeleteConfirm ? (
        <button
          className="fleet-button fleet-button-ghost fleet-button-sm"
          onClick={() => setShowDeleteConfirm(true)}
          type="button"
        >
          Delete
        </button>
      ) : (
        <div className="doc-delete-confirm">
          <span className="doc-delete-confirm-text">Sure?</span>
          <button
            className="fleet-button fleet-button-danger fleet-button-sm"
            onClick={handleDelete}
            disabled={isDeleting}
            type="button"
          >
            {isDeleting ? 'Deleting...' : 'Yes'}
          </button>
          <button
            className="fleet-button fleet-button-ghost fleet-button-sm"
            onClick={() => setShowDeleteConfirm(false)}
            type="button"
          >
            No
          </button>
        </div>
      )}
    </div>
  );
}
