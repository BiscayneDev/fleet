'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { AutoresearchButton } from './autoresearch-button';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';

interface StepArtifact {
  slug: string;
  title: string;
  body: string;
  createdAt: string;
}

interface GtmStep {
  key: string;
  number: number;
  title: string;
  subtitle: string;
  artifactType: string;
  dependsOn: string[];
  status: 'complete' | 'pending';
  ready: boolean;
  artifact: StepArtifact | null;
}

interface GtmBuilderProps {
  projectSlug: string;
  projectTitle: string;
  steps: GtmStep[];
  completed: number;
  total: number;
  sourceCount: number;
  connectionCount: number;
}

export function GtmBuilder({
  projectSlug,
  projectTitle,
  steps,
  completed,
  total,
  sourceCount,
  connectionCount,
}: GtmBuilderProps) {
  const router = useRouter();
  const [generating, setGenerating] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  async function handleGenerate(stepKey: string) {
    setGenerating(stepKey);
    setError(null);

    try {
      const response = await fetch('/api/gtm/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectSlug, stepKey }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? 'Generation failed');
        return;
      }

      router.refresh();
    } catch {
      setError('Failed to generate. Check your LLM configuration.');
    } finally {
      setGenerating(null);
    }
  }

  function toggleExpand(key: string) {
    setExpandedStep(expandedStep === key ? null : key);
  }

  return (
    <div className="gtm-container">
      {/* Header */}
      <div className="gtm-header">
        <div className="gtm-header-text">
          <h2 className="gtm-title">GTM Builder</h2>
          <p className="gtm-subtitle">
            {completed === total
              ? `Your go-to-market for ${projectTitle} is complete.`
              : `Build your go-to-market strategy for ${projectTitle} step by step.`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AutoresearchButton projectSlug={projectSlug} />
          {completed > 0 && (
            <a
              href={`/projects/${projectSlug}/gtm/export`}
              target="_blank"
              rel="noopener noreferrer"
              className="gtm-export-link"
            >
              Export
            </a>
          )}
          <span className="gtm-context-badge">{sourceCount} sources</span>
          <span className="gtm-context-badge">{connectionCount} connections</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="gtm-progress">
        <div className="gtm-progress-bar">
          <div className="gtm-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <span className="gtm-progress-label">{completed}/{total} complete</span>
      </div>

      {error && (
        <div className="gtm-error">{error}</div>
      )}

      {/* Step cards */}
      <div className="gtm-steps">
        {steps.map((step) => {
          const isGenerating = generating === step.key;
          const isExpanded = expandedStep === step.key;
          const isLocked = !step.ready && step.status !== 'complete';

          return (
            <div
              key={step.key}
              className={`gtm-step-card ${step.status === 'complete' ? 'gtm-step-complete' : ''} ${isLocked ? 'gtm-step-locked' : ''}`}
            >
              <div className="gtm-step-header" onClick={() => step.artifact && toggleExpand(step.key)}>
                <div className="gtm-step-number-badge">
                  {step.status === 'complete' ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>

                <div className="gtm-step-info">
                  <h3 className="gtm-step-title">{step.title}</h3>
                  <p className="gtm-step-subtitle">{step.subtitle}</p>
                </div>

                <div className="gtm-step-action">
                  {isGenerating ? (
                    <div className="gtm-generating">
                      <div className="gtm-spinner" />
                      <span>Building...</span>
                    </div>
                  ) : step.status === 'complete' ? (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        className="gtm-regenerate-button"
                        onClick={(e) => { e.stopPropagation(); handleGenerate(step.key); }}
                      >
                        Rebuild
                      </button>
                      <button
                        className="gtm-expand-button"
                        onClick={(e) => { e.stopPropagation(); toggleExpand(step.key); }}
                      >
                        {isExpanded ? 'Collapse' : 'View'}
                      </button>
                    </div>
                  ) : isLocked ? (
                    <span className="gtm-locked-label">
                      Needs: {step.dependsOn.map((d) => steps.find((s) => s.key === d)?.title).filter(Boolean).join(', ')}
                    </span>
                  ) : (
                    <button
                      className="gtm-generate-button"
                      onClick={() => handleGenerate(step.key)}
                    >
                      Generate
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded artifact content */}
              {isExpanded && step.artifact && (
                <div className="gtm-step-content">
                  <MarkdownRenderer content={step.artifact.body} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
