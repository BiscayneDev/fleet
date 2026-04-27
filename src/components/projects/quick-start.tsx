'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

interface PhaseEvent {
  phase: string;
  status: string;
  title?: string;
  slug?: string;
  step?: number;
  total?: number;
  sources?: number;
  artifacts?: number;
  projectSlug?: string;
  reason?: string;
}

export function QuickStart() {
  const [idea, setIdea] = useState('');
  const [running, setRunning] = useState(false);
  const [phases, setPhases] = useState<PhaseEvent[]>([]);
  const [complete, setComplete] = useState<PhaseEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function handleLaunch() {
    if (!idea.trim() || running) return;

    setRunning(true);
    setPhases([]);
    setComplete(null);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/projects/quick-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: idea.trim() }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to start' }));
        setError(err.error);
        setRunning(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setError('No response stream');
        setRunning(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const event of events) {
          const dataLine = event.split('\n').find((l) => l.startsWith('data: '));
          if (!dataLine) continue;

          try {
            const data = JSON.parse(dataLine.slice(6)) as PhaseEvent;

            if (data.phase === 'complete') {
              setComplete(data);
            } else {
              setPhases((prev) => {
                // Replace existing phase with same key, or append
                const key = data.phase === 'gtm' ? `gtm-${data.step}` : data.phase;
                const existing = prev.findIndex((p) =>
                  p.phase === 'gtm' ? `gtm-${p.step}` === key : p.phase === key
                );
                if (existing >= 0) {
                  const updated = [...prev];
                  updated[existing] = data;
                  return updated;
                }
                return [...prev, data];
              });
            }
          } catch {
            // skip malformed events
          }
        }
      }

      setRunning(false);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError('Connection lost. Please try again.');
      }
      setRunning(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleLaunch();
    }
  }

  // Input state
  if (!running && !complete) {
    return (
      <div className="qs-container">
        <div className="qs-hero">
          <div className="qs-hero-badge">Quick Start</div>
          <h1 className="qs-hero-title">Idea to GTM in 60 seconds</h1>
          <p className="qs-hero-subtitle">
            Describe your startup idea. Fleet will create your project, research competitors, and build your entire go-to-market strategy.
          </p>
        </div>

        <div className="qs-input-area">
          <textarea
            className="qs-textarea"
            placeholder="Describe your startup idea in one sentence..."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            autoFocus
          />
          <button
            className="qs-launch-btn"
            onClick={handleLaunch}
            disabled={idea.trim().length < 5}
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Launch GTM
          </button>
          {error && <p className="qs-error">{error}</p>}
        </div>
      </div>
    );
  }

  // Running + complete states
  return (
    <div className="qs-container">
      {complete ? (
        <div className="qs-complete-hero">
          <div className="qs-complete-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="qs-complete-title">Your GTM is ready</h1>
          <p className="qs-complete-subtitle">
            {complete.artifacts} artifacts generated for <strong>{complete.title}</strong>
          </p>
          <div className="qs-complete-actions">
            <Link href={`/projects/${complete.projectSlug}/gtm`} className="qs-launch-btn" style={{ textDecoration: 'none' }}>
              View Your GTM
            </Link>
            <Link href={`/projects/${complete.projectSlug}`} className="fleet-button" style={{ textDecoration: 'none' }}>
              Open War Room
            </Link>
          </div>
        </div>
      ) : (
        <div className="qs-running-hero">
          <h2 className="qs-running-title">Building your GTM...</h2>
          <p className="qs-running-subtitle">{idea}</p>
        </div>
      )}

      {/* Phase timeline */}
      <div className="qs-timeline">
        {phases.map((phase, i) => {
          const key = phase.phase === 'gtm' ? `gtm-${phase.step}` : phase.phase;
          const label = getPhaseLabel(phase);
          const isDone = phase.status === 'done';
          const isRunning = phase.status === 'running';
          const isError = phase.status === 'error' || phase.status === 'skipped';

          return (
            <div key={key} className={`qs-phase ${isDone ? 'done' : ''} ${isRunning ? 'running' : ''} ${isError ? 'error' : ''}`} style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="qs-phase-indicator">
                {isDone && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {isRunning && <div className="qs-phase-spinner" />}
                {isError && <span>!</span>}
              </div>
              <div className="qs-phase-content">
                <span className="qs-phase-label">{label}</span>
                {phase.sources !== undefined && isDone && (
                  <span className="qs-phase-detail">{phase.sources} sources discovered</span>
                )}
                {isError && phase.reason && (
                  <span className="qs-phase-detail">{phase.reason}</span>
                )}
              </div>
              {phase.phase === 'gtm' && (
                <span className="qs-phase-step">{phase.step}/{phase.total}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getPhaseLabel(phase: PhaseEvent): string {
  switch (phase.phase) {
    case 'parsing': return 'Understanding your idea';
    case 'project': return phase.title ? `Creating "${phase.title}"` : 'Creating project';
    case 'research': return 'Researching competitors & market';
    case 'gtm': return phase.title ?? `GTM Step ${phase.step}`;
    default: return phase.phase;
  }
}
