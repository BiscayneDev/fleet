'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  slug: string;
  title: string;
}

const PHASES = [
  { label: 'Loading project context...', icon: '📂' },
  { label: 'Scanning connections...', icon: '🔍' },
  { label: 'Matching against your ICP...', icon: '🎯' },
  { label: 'Ranking opportunities...', icon: '📊' },
  { label: 'Writing analysis report...', icon: '✍️' },
];

export function AnalyzeButton() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [dotCount, setDotCount] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((data) => setProjects(data.projects ?? []))
      .catch(() => {});
  }, []);

  // Phase progression
  useEffect(() => {
    if (!analyzing) return;
    const interval = setInterval(() => {
      setPhaseIndex((prev) => (prev < PHASES.length - 1 ? prev + 1 : prev));
    }, 5000);
    return () => clearInterval(interval);
  }, [analyzing]);

  // Dot animation
  useEffect(() => {
    if (!analyzing) return;
    const interval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4);
    }, 400);
    return () => clearInterval(interval);
  }, [analyzing]);

  async function handleAnalyze() {
    if (!selectedProject || analyzing) return;

    setAnalyzing(true);
    setError(null);
    setStatus(null);
    setPhaseIndex(0);

    try {
      const response = await fetch('/api/network/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectSlug: selectedProject }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? 'Analysis failed');
        return;
      }

      setStatus('complete');
      router.refresh();

      setTimeout(() => {
        router.push(`/projects/${selectedProject}/artifacts`);
      }, 2000);
    } catch {
      setError('Failed to analyze network');
    } finally {
      setAnalyzing(false);
    }
  }

  if (projects.length === 0) return null;

  const selectedTitle = projects.find((p) => p.slug === selectedProject)?.title;
  const dots = '.'.repeat(dotCount);

  return (
    <div className="analyze-section">
      {!analyzing && status !== 'complete' && (
        <>
          <h3 className="analyze-title">Analyze for Project</h3>
          <p className="analyze-subtitle">
            Cross-reference your network with a project to find GTM opportunities
          </p>
          <div className="analyze-controls">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="analyze-select"
            >
              <option value="">Select a project...</option>
              {projects.map((p) => (
                <option key={p.slug} value={p.slug}>{p.title}</option>
              ))}
            </select>
            <button
              className="analyze-button"
              onClick={handleAnalyze}
              disabled={!selectedProject}
            >
              Analyze Network
            </button>
          </div>
        </>
      )}

      {analyzing && (
        <div className="analyze-active">
          <div className="analyze-active-header">
            <div className="analyze-pulse-ring" />
            <div>
              <h3 className="analyze-active-title">
                Analyzing network for {selectedTitle}
              </h3>
              <p className="analyze-active-subtitle">
                This takes 20–40 seconds
              </p>
            </div>
          </div>

          <div className="analyze-phases">
            {PHASES.map((phase, i) => {
              const state = i < phaseIndex ? 'done' : i === phaseIndex ? 'active' : 'waiting';
              return (
                <div key={phase.label} className={`analyze-phase analyze-phase-${state}`}>
                  <span className="analyze-phase-icon">
                    {state === 'done' ? '✓' : phase.icon}
                  </span>
                  <span className="analyze-phase-label">
                    {state === 'active'
                      ? phase.label.replace('...', dots.padEnd(3, '\u00A0'))
                      : phase.label.replace('...', '')}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="analyze-progress-track">
            <div
              className="analyze-progress-bar"
              style={{ width: `${((phaseIndex + 1) / PHASES.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {status === 'complete' && !analyzing && (
        <div className="analyze-complete">
          <div className="analyze-complete-check">✓</div>
          <div>
            <h3 className="analyze-complete-title">Analysis complete</h3>
            <p className="analyze-complete-subtitle">Redirecting to artifacts...</p>
          </div>
        </div>
      )}

      {error && <p className="analyze-error">{error}</p>}
    </div>
  );
}
