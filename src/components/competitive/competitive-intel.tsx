'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { CompetitiveRenderer } from './competitive-renderer';

interface CompetitiveIntelProps {
  projectSlug: string;
}

type Phase = 'idle' | 'scraping' | 'analyzing' | 'streaming' | 'done' | 'error';

const PHASE_LABELS: Record<Phase, string> = {
  idle: '',
  scraping: 'Scraping competitor page...',
  analyzing: 'Building competitive analysis...',
  streaming: 'Generating insights...',
  done: 'Analysis complete',
  error: 'Analysis failed',
};

export function CompetitiveIntel({ projectSlug }: CompetitiveIntelProps) {
  const [url, setUrl] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [content, setContent] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showInput, setShowInput] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const isValidUrl = useCallback((value: string) => {
    try {
      const parsed = new URL(value.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (contentRef.current && phase === 'streaming') {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content, phase]);

  async function handleAnalyze() {
    const trimmed = url.trim();
    if (!isValidUrl(trimmed)) return;

    setPhase('scraping');
    setContent('');
    setErrorMsg('');

    try {
      setPhase('analyzing');

      const response = await fetch('/api/competitive-intel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed, projectSlug }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }));
        setErrorMsg(err.error ?? 'Failed to analyze competitor');
        setPhase('error');
        return;
      }

      setPhase('streaming');

      const reader = response.body?.getReader();
      if (!reader) {
        setErrorMsg('No response stream');
        setPhase('error');
        return;
      }

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setContent(accumulated);
      }

      setPhase('done');
      router.refresh();
    } catch {
      setErrorMsg('Network error. Check your connection.');
      setPhase('error');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAnalyze();
    } else if (e.key === 'Escape') {
      setShowInput(false);
      setUrl('');
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').trim();
    if (isValidUrl(pasted)) {
      setTimeout(() => {
        setUrl(pasted);
        handleAnalyze();
      }, 100);
    }
  }

  function handleReset() {
    setPhase('idle');
    setContent('');
    setUrl('');
    setErrorMsg('');
    setShowInput(false);
  }

  // Idle state — show the trigger button
  if (phase === 'idle' && !showInput) {
    return (
      <button
        type="button"
        className="competitive-trigger"
        onClick={() => setShowInput(true)}
      >
        <span className="competitive-trigger-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </span>
        Analyze Competitor
      </button>
    );
  }

  // Input state
  if (phase === 'idle' && showInput) {
    return (
      <div className="competitive-input-container">
        <div className="competitive-input-row">
          <input
            className="competitive-url-input"
            type="url"
            placeholder="Paste a competitor URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            autoFocus
          />
          <button
            type="button"
            className="competitive-analyze-btn"
            onClick={handleAnalyze}
            disabled={!isValidUrl(url)}
          >
            Analyze
          </button>
          <button
            type="button"
            className="fleet-button fleet-button-ghost fleet-button-sm"
            onClick={() => { setShowInput(false); setUrl(''); }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Streaming / analyzing / done / error states
  return (
    <div className="competitive-intel">
      {/* Progress header */}
      <div className="competitive-header">
        <div className="competitive-header-left">
          {phase === 'done' ? (
            <span className="competitive-phase-icon done">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          ) : phase === 'error' ? (
            <span className="competitive-phase-icon error">!</span>
          ) : (
            <span className="competitive-phase-icon loading" />
          )}
          <span className="competitive-phase-label">{PHASE_LABELS[phase]}</span>
        </div>
        {(phase === 'done' || phase === 'error') && (
          <button type="button" className="fleet-button fleet-button-ghost fleet-button-sm" onClick={handleReset}>
            New analysis
          </button>
        )}
      </div>

      {/* Error message */}
      {phase === 'error' && (
        <p className="competitive-error">{errorMsg}</p>
      )}

      {/* Streaming content */}
      {content && (
        <div className="competitive-results" ref={contentRef}>
          {phase === 'done' ? (
            <CompetitiveRenderer content={content} />
          ) : (
            <MarkdownRenderer content={content} />
          )}
        </div>
      )}

      {/* Done state */}
      {phase === 'done' && (
        <div className="competitive-saved">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          Saved to artifacts
        </div>
      )}
    </div>
  );
}
