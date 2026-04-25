'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STATUSES = ['draft', 'active', 'paused', 'done'] as const;

type ProjectStatus = (typeof STATUSES)[number];

const STATUS_COLORS: Record<ProjectStatus, { bg: string; border: string; text: string }> = {
  draft: { bg: 'rgba(156, 163, 175, 0.12)', border: 'rgba(156, 163, 175, 0.3)', text: '#9ca3af' },
  active: { bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.3)', text: '#22c55e' },
  paused: { bg: 'rgba(234, 179, 8, 0.12)', border: 'rgba(234, 179, 8, 0.3)', text: '#eab308' },
  done: { bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.3)', text: '#38bdf8' },
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
    } catch (error) {
      console.error('Failed to update status:', error);
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
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  const colors = STATUS_COLORS[currentStatus];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      {/* Status selector */}
      <div style={{ position: 'relative' }}>
        <select
          value={currentStatus}
          onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
          disabled={isChangingStatus}
          style={{
            appearance: 'none',
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: '999px',
            color: colors.text,
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 500,
            padding: '0.35rem 1.5rem 0.35rem 0.7rem',
            textTransform: 'capitalize',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${encodeURIComponent(colors.text)}' d='M3 4.5l3 3 3-3'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.5rem center',
          }}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Delete button */}
      {!showDeleteConfirm ? (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          style={{
            background: 'transparent',
            border: '1px solid var(--fleet-border)',
            borderRadius: '0.375rem',
            color: 'var(--fleet-text-muted)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            padding: '0.35rem 0.6rem',
          }}
        >
          Delete
        </button>
      ) : (
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--fleet-text-muted)' }}>Sure?</span>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '0.375rem',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: '0.8rem',
              padding: '0.35rem 0.6rem',
            }}
          >
            {isDeleting ? 'Deleting...' : 'Yes, delete'}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(false)}
            style={{
              background: 'transparent',
              border: '1px solid var(--fleet-border)',
              borderRadius: '0.375rem',
              color: 'var(--fleet-text-muted)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              padding: '0.35rem 0.6rem',
            }}
          >
            No
          </button>
        </div>
      )}
    </div>
  );
}
