'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  slug: string;
  title: string;
}

export function AnalyzeButton() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((data) => setProjects(data.projects ?? []))
      .catch(() => {});
  }, []);

  async function handleAnalyze() {
    if (!selectedProject || analyzing) return;

    setAnalyzing(true);
    setError(null);
    setStatus('Analyzing your network against project context...');

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

      setStatus('Analysis complete! Saved as artifact.');
      router.refresh();

      setTimeout(() => {
        router.push(`/projects/${selectedProject}/artifacts`);
      }, 1500);
    } catch {
      setError('Failed to analyze network');
    } finally {
      setAnalyzing(false);
    }
  }

  if (projects.length === 0) return null;

  return (
    <div className="analyze-section">
      <h3 className="analyze-title">Analyze for Project</h3>
      <p className="analyze-subtitle">
        Cross-reference your network with a project to find GTM opportunities
      </p>
      <div className="analyze-controls">
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="analyze-select"
          disabled={analyzing}
        >
          <option value="">Select a project...</option>
          {projects.map((p) => (
            <option key={p.slug} value={p.slug}>{p.title}</option>
          ))}
        </select>
        <button
          className="analyze-button"
          onClick={handleAnalyze}
          disabled={!selectedProject || analyzing}
        >
          {analyzing ? 'Analyzing...' : 'Analyze Network'}
        </button>
      </div>
      {status && <p className="analyze-status">{status}</p>}
      {error && <p className="analyze-error">{error}</p>}
    </div>
  );
}
