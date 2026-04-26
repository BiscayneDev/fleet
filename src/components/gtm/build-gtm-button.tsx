'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface BuildGtmButtonProps {
  projectSlug: string;
  hasArtifacts: boolean;
}

const STEP_NAMES = [
  'Building ICP...',
  'Crafting positioning...',
  'Writing messaging...',
  'Mapping channels...',
  'Drafting launch content...',
  'Planning outreach...',
  'Assembling launch plan...',
];

export function BuildGtmButton({ projectSlug, hasArtifacts }: BuildGtmButtonProps) {
  const router = useRouter();
  const [building, setBuilding] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<{ completed: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function handleBuild() {
    setBuilding(true);
    setError(null);
    setResult(null);
    setStepIndex(0);

    // Advance step indicator every ~8 seconds
    intervalRef.current = setInterval(() => {
      setStepIndex((prev) => (prev < STEP_NAMES.length - 1 ? prev + 1 : prev));
    }, 8000);

    try {
      const response = await fetch('/api/gtm/build-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectSlug }),
      });

      if (intervalRef.current) clearInterval(intervalRef.current);

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? 'Build failed');
        return;
      }

      const data = await response.json();
      setResult({ completed: data.completed, total: data.total });
      router.refresh();
    } catch {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setError('Failed to build GTM. Check your LLM configuration.');
    } finally {
      setBuilding(false);
    }
  }

  if (result) {
    return (
      <div className="build-gtm-complete">
        <div className="build-gtm-check">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <p className="build-gtm-complete-title">GTM Built</p>
          <p className="build-gtm-complete-detail">
            {result.completed}/{result.total} steps complete
          </p>
        </div>
        <a
          href={`/projects/${projectSlug}/gtm`}
          className="build-gtm-view-link"
        >
          View GTM
        </a>
      </div>
    );
  }

  return (
    <div className="build-gtm-section">
      <button
        className="build-gtm-button"
        onClick={handleBuild}
        disabled={building}
      >
        {building ? (
          <>
            <div className="build-gtm-spinner" />
            <span className="build-gtm-step-label">{STEP_NAMES[stepIndex]}</span>
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>{hasArtifacts ? 'Rebuild my GTM' : 'Build my GTM'}</span>
          </>
        )}
      </button>
      {building && (
        <div className="build-gtm-progress">
          <div className="build-gtm-progress-bar">
            <div
              className="build-gtm-progress-fill"
              style={{ width: `${((stepIndex + 1) / STEP_NAMES.length) * 100}%` }}
            />
          </div>
          <span className="build-gtm-progress-label">
            Step {stepIndex + 1} of {STEP_NAMES.length}
          </span>
        </div>
      )}
      {error && <p className="build-gtm-error">{error}</p>}
    </div>
  );
}
