'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AutoresearchButtonProps {
  projectSlug: string;
}

const PHASES = [
  'Generating search queries...',
  'Searching the web...',
  'Scraping & analyzing results...',
  'Writing validation report...',
];

export function AutoresearchButton({ projectSlug }: AutoresearchButtonProps) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [result, setResult] = useState<{ wikiPagesCreated: number; urlsScraped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setRunning(true);
    setError(null);
    setResult(null);
    setPhaseIndex(0);

    // Simulate phase progression (the API call is blocking, so we animate client-side)
    const interval = setInterval(() => {
      setPhaseIndex((prev) => (prev < PHASES.length - 1 ? prev + 1 : prev));
    }, 6000);

    try {
      const response = await fetch('/api/autoresearch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectSlug }),
      });

      clearInterval(interval);

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? 'Autoresearch failed');
        return;
      }

      const data = await response.json();
      setResult({ wikiPagesCreated: data.wikiPagesCreated, urlsScraped: data.urlsScraped });
      router.refresh();
    } catch {
      clearInterval(interval);
      setError('Failed to run autoresearch. Check your configuration.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="autoresearch">
      <button
        className="autoresearch-button"
        onClick={handleClick}
        disabled={running}
      >
        {running ? (
          <>
            <div className="autoresearch-spinner" />
            <span>{PHASES[phaseIndex]}</span>
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>Autoresearch</span>
          </>
        )}
      </button>

      {result && (
        <span className="autoresearch-result">
          Found {result.urlsScraped} sources, created {result.wikiPagesCreated} wiki pages
        </span>
      )}
      {error && (
        <span className="autoresearch-error">{error}</span>
      )}
    </div>
  );
}
