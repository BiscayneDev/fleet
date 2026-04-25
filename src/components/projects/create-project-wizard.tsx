'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface WizardData {
  title: string;
  summary: string;
  goals: string[];
  desiredOutcomes: string[];
}

const STEPS = [
  { id: 'basics', label: 'The basics' },
  { id: 'goals', label: 'Goals' },
  { id: 'outcomes', label: 'Success looks like' },
  { id: 'review', label: 'Review' },
];

export function CreateProjectWizard() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<WizardData>({
    title: '',
    summary: '',
    goals: [''],
    desiredOutcomes: [''],
  });
  const router = useRouter();

  function updateField<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function updateListItem(field: 'goals' | 'desiredOutcomes', index: number, value: string) {
    const list = [...data[field]];
    list[index] = value;
    updateField(field, list);
  }

  function addListItem(field: 'goals' | 'desiredOutcomes') {
    updateField(field, [...data[field], '']);
  }

  function removeListItem(field: 'goals' | 'desiredOutcomes', index: number) {
    if (data[field].length <= 1) return;
    updateField(
      field,
      data[field].filter((_, i) => i !== index),
    );
  }

  function canAdvance(): boolean {
    switch (step) {
      case 0:
        return data.title.trim().length > 0;
      case 1:
        return data.goals.some((g) => g.trim().length > 0);
      case 2:
        return data.desiredOutcomes.some((o) => o.trim().length > 0);
      default:
        return true;
    }
  }

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title.trim(),
          summary: data.summary.trim() || `Project: ${data.title.trim()}`,
          goals: data.goals.filter((g) => g.trim()),
          desiredOutcomes: data.desiredOutcomes.filter((o) => o.trim()),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setIsOpen(false);
        setStep(0);
        setData({ title: '', summary: '', goals: [''], desiredOutcomes: [''] });
        router.refresh();
        router.push(`/projects/${result.project.slug}`);
      } else {
        const err = await response.json();
        setError(err.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      setError('Network error — please try again');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          background: 'var(--fleet-accent)',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          padding: '0.6rem 1.2rem',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 500,
        }}
      >
        + New Project
      </button>
    );
  }

  return (
    <div
      style={{
        background: 'var(--fleet-panel)',
        border: '1px solid var(--fleet-border)',
        borderRadius: '0.75rem',
        padding: '2rem',
        maxWidth: '40rem',
      }}
    >
      {/* Step indicator */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            style={{
              flex: 1,
              height: '3px',
              borderRadius: '2px',
              background: i <= step ? 'var(--fleet-accent)' : 'var(--fleet-border)',
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>

      <p style={{ color: 'var(--fleet-text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
        Step {step + 1} of {STEPS.length} — {STEPS[step].label}
      </p>

      {/* Step 0: Basics */}
      {step === 0 && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>What are you working on?</h2>
          <p style={{ color: 'var(--fleet-text-muted)', margin: 0, fontSize: '0.875rem' }}>
            Give your project a clear name. You can change this later.
          </p>
          <input
            type="text"
            value={data.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="e.g. Fleet GTM Strategy"
            autoFocus
            style={inputStyle}
          />
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: 'var(--fleet-text-muted)' }}>
              One-liner (optional)
            </label>
            <textarea
              value={data.summary}
              onChange={(e) => updateField('summary', e.target.value)}
              placeholder="What is this and why does it matter?"
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        </div>
      )}

      {/* Step 1: Goals */}
      {step === 1 && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>What are the goals?</h2>
          <p style={{ color: 'var(--fleet-text-muted)', margin: 0, fontSize: '0.875rem' }}>
            List the key goals for this project. These guide what you focus on.
          </p>
          {data.goals.map((goal, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                value={goal}
                onChange={(e) => updateListItem('goals', i, e.target.value)}
                placeholder={`Goal ${i + 1}`}
                autoFocus={i === data.goals.length - 1}
                style={{ ...inputStyle, flex: 1 }}
              />
              {data.goals.length > 1 && (
                <button
                  onClick={() => removeListItem('goals', i)}
                  style={removeBtnStyle}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button onClick={() => addListItem('goals')} style={addBtnStyle}>
            + Add another goal
          </button>
        </div>
      )}

      {/* Step 2: Outcomes */}
      {step === 2 && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>What does success look like?</h2>
          <p style={{ color: 'var(--fleet-text-muted)', margin: 0, fontSize: '0.875rem' }}>
            Desired outcomes — concrete results that mean this project worked.
          </p>
          {data.desiredOutcomes.map((outcome, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                value={outcome}
                onChange={(e) => updateListItem('desiredOutcomes', i, e.target.value)}
                placeholder={`Outcome ${i + 1}`}
                autoFocus={i === data.desiredOutcomes.length - 1}
                style={{ ...inputStyle, flex: 1 }}
              />
              {data.desiredOutcomes.length > 1 && (
                <button
                  onClick={() => removeListItem('desiredOutcomes', i)}
                  style={removeBtnStyle}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button onClick={() => addListItem('desiredOutcomes')} style={addBtnStyle}>
            + Add another outcome
          </button>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Ready to go</h2>
          <div style={{ background: 'var(--fleet-bg)', borderRadius: '0.5rem', padding: '1rem', display: 'grid', gap: '0.75rem' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--fleet-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Project</p>
              <p style={{ margin: '0.15rem 0 0', fontWeight: 600 }}>{data.title}</p>
              {data.summary && <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--fleet-text-muted)' }}>{data.summary}</p>}
            </div>
            {data.goals.filter((g) => g.trim()).length > 0 && (
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--fleet-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Goals</p>
                <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
                  {data.goals.filter((g) => g.trim()).map((g, i) => <li key={i}>{g}</li>)}
                </ul>
              </div>
            )}
            {data.desiredOutcomes.filter((o) => o.trim()).length > 0 && (
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--fleet-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outcomes</p>
                <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
                  {data.desiredOutcomes.filter((o) => o.trim()).map((o, i) => <li key={i}>{o}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '0.375rem',
          padding: '0.5rem 0.75rem',
          marginTop: '1rem',
          fontSize: '0.8rem',
          color: '#ef4444',
        }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between', marginTop: '1.5rem' }}>
        <button
          onClick={() => {
            if (step === 0) {
              setIsOpen(false);
            } else {
              setStep(step - 1);
            }
          }}
          style={cancelBtnStyle}
        >
          {step === 0 ? 'Cancel' : 'Back'}
        </button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canAdvance()}
              style={{
                ...primaryBtnStyle,
                opacity: canAdvance() ? 1 : 0.5,
                cursor: canAdvance() ? 'pointer' : 'not-allowed',
              }}
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={isSubmitting}
              style={primaryBtnStyle}
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.75rem',
  borderRadius: '0.375rem',
  border: '1px solid var(--fleet-border)',
  background: 'var(--fleet-bg)',
  color: 'var(--fleet-text)',
  fontSize: '0.9rem',
};

const cancelBtnStyle: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--fleet-text-muted)',
  border: '1px solid var(--fleet-border)',
  borderRadius: '0.375rem',
  padding: '0.5rem 1rem',
  cursor: 'pointer',
  fontSize: '0.875rem',
};

const primaryBtnStyle: React.CSSProperties = {
  background: 'var(--fleet-accent)',
  color: 'white',
  border: 'none',
  borderRadius: '0.375rem',
  padding: '0.5rem 1.25rem',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 500,
};

const addBtnStyle: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--fleet-accent)',
  border: '1px dashed var(--fleet-border)',
  borderRadius: '0.375rem',
  padding: '0.5rem',
  cursor: 'pointer',
  fontSize: '0.8rem',
};

const removeBtnStyle: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--fleet-text-muted)',
  border: 'none',
  cursor: 'pointer',
  fontSize: '1.25rem',
  lineHeight: 1,
  padding: '0 0.25rem',
};
