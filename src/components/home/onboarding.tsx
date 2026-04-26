'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface OnboardingStep {
  key: string;
  title: string;
  subtitle: string;
  href: string;
  cta: string;
  complete: boolean;
}

interface OnboardingProps {
  steps: OnboardingStep[];
  projectSlug: string | null;
}

export function Onboarding({ steps, projectSlug }: OnboardingProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('fleet-onboarding-dismissed');
    if (stored === 'true') setDismissed(true);
  }, []);

  function handleDismiss() {
    localStorage.setItem('fleet-onboarding-dismissed', 'true');
    setDismissed(true);
  }

  if (dismissed) return null;

  const completedCount = steps.filter((s) => s.complete).length;
  const allDone = completedCount === steps.length;

  if (allDone) return null;

  return (
    <div className="onboarding">
      <div className="onboarding-header">
        <div>
          <h1 className="onboarding-title">Welcome to Fleet</h1>
          <p className="onboarding-subtitle">
            Get your GTM strategy built in 4 steps. Each step takes under a minute.
          </p>
        </div>
        <div className="onboarding-progress-ring">
          <span className="onboarding-progress-count">{completedCount}/{steps.length}</span>
        </div>
      </div>

      <div className="onboarding-steps">
        {steps.map((step, i) => {
          const href = step.key === 'capture' && projectSlug
            ? `/projects/${projectSlug}`
            : step.key === 'gtm' && projectSlug
              ? `/projects/${projectSlug}/gtm`
              : step.href;

          return (
            <div
              key={step.key}
              className={`onboarding-step ${step.complete ? 'onboarding-step-done' : ''}`}
            >
              <div className="onboarding-step-indicator">
                {step.complete ? (
                  <div className="onboarding-check">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                ) : (
                  <div className="onboarding-number">{i + 1}</div>
                )}
              </div>
              <div className="onboarding-step-content">
                <h3 className="onboarding-step-title">{step.title}</h3>
                <p className="onboarding-step-subtitle">{step.subtitle}</p>
              </div>
              <div className="onboarding-step-action">
                {step.complete ? (
                  <span className="onboarding-done-label">Done</span>
                ) : (
                  <Link href={href} className="onboarding-cta">
                    {step.cta}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button className="onboarding-dismiss" onClick={handleDismiss}>
        Skip setup
      </button>
    </div>
  );
}
