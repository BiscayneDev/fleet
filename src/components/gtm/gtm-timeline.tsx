'use client';

import Link from 'next/link';

interface TimelineProps {
  projectSlug: string;
  projectTitle: string;
  launchPlan: { title: string; body: string; createdAt: string } | null;
  artifactCount: number;
}

interface TimelineWeek {
  label: string;
  tasks: string[];
}

function parseTimelineWeeks(body: string): TimelineWeek[] {
  const weeks: TimelineWeek[] = [];
  let currentWeek: TimelineWeek | null = null;

  const lines = body.split('\n');

  for (const line of lines) {
    const weekMatch = line.match(/^#{1,3}\s+(.*(Week|Day|Pre-Launch|Launch|Post-Launch).*)/i);
    if (weekMatch) {
      if (currentWeek && currentWeek.tasks.length > 0) {
        weeks.push(currentWeek);
      }
      currentWeek = { label: weekMatch[1].replace(/\*\*/g, ''), tasks: [] };
      continue;
    }

    if (currentWeek && line.startsWith('- ')) {
      const task = line.slice(2).replace(/\*\*/g, '').trim();
      if (task.length > 0) {
        currentWeek.tasks.push(task);
      }
    }
  }

  if (currentWeek && currentWeek.tasks.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}

export function GtmTimeline({ projectSlug, projectTitle, launchPlan, artifactCount }: TimelineProps) {
  if (!launchPlan) {
    return (
      <div className="gtm-timeline-empty">
        <div className="gtm-timeline-empty-icon">&#9200;</div>
        <h2 style={{ margin: '0 0 0.35rem', fontSize: '1rem' }}>No Launch Plan Yet</h2>
        <p style={{ color: 'var(--fleet-text-muted)', margin: '0 0 1rem', fontSize: '0.85rem' }}>
          Complete the GTM Builder to generate your launch timeline.
          {artifactCount > 0 && ` You have ${artifactCount}/7 steps done.`}
        </p>
        <Link
          href={`/projects/${projectSlug}/gtm`}
          style={{
            background: 'var(--fleet-accent)',
            color: 'var(--fleet-bg)',
            padding: '0.5rem 1rem',
            borderRadius: '0.4rem',
            fontSize: '0.82rem',
            fontWeight: 600,
          }}
        >
          Open GTM Builder
        </Link>
      </div>
    );
  }

  const weeks = parseTimelineWeeks(launchPlan.body);

  return (
    <div className="gtm-timeline">
      <div className="gtm-timeline-header">
        <h2 style={{ margin: 0, fontSize: '1rem' }}>Launch Timeline</h2>
        <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--fleet-text-muted)' }}>
          {projectTitle} — {weeks.length} phases
        </p>
      </div>

      <div className="gtm-timeline-track">
        {weeks.map((week, i) => (
          <div key={i} className="gtm-timeline-week">
            <div className="gtm-timeline-marker">
              <div className="gtm-timeline-dot" />
              {i < weeks.length - 1 && <div className="gtm-timeline-line" />}
            </div>
            <div className="gtm-timeline-content">
              <h3 className="gtm-timeline-week-label">{week.label}</h3>
              <ul className="gtm-timeline-tasks">
                {week.tasks.map((task, j) => (
                  <li key={j} className="gtm-timeline-task">{task}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {weeks.length === 0 && (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--fleet-text-muted)', fontSize: '0.85rem' }}>
          <p style={{ margin: 0 }}>Could not parse timeline phases from your launch plan.</p>
          <p style={{ margin: '0.25rem 0 0' }}>
            <Link href={`/projects/${projectSlug}/gtm`} style={{ color: 'var(--fleet-accent)' }}>
              Rebuild the Launch Plan
            </Link>
            {' '}to generate a structured timeline.
          </p>
        </div>
      )}
    </div>
  );
}
