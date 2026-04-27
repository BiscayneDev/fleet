'use client';

import type { ReactNode } from 'react';

interface CompetitiveRendererProps {
  content: string;
}

interface Section {
  heading: string;
  level: number;
  body: string;
}

function parseSections(content: string): { title: string; sections: Section[] } {
  const lines = content.split('\n');
  let title = '';
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let bodyLines: string[] = [];

  for (const line of lines) {
    const h1Match = line.match(/^# (.+)$/);
    const h2Match = line.match(/^## (.+)$/);

    if (h1Match) {
      title = h1Match[1];
      continue;
    }

    if (h2Match) {
      if (currentSection) {
        currentSection.body = bodyLines.join('\n').trim();
        sections.push(currentSection);
      }
      currentSection = { heading: h2Match[1], level: 2, body: '' };
      bodyLines = [];
      continue;
    }

    bodyLines.push(line);
  }

  if (currentSection) {
    currentSection.body = bodyLines.join('\n').trim();
    sections.push(currentSection);
  }

  return { title, sections };
}

function parseTable(body: string): { headers: string[]; rows: string[][] } | null {
  const lines = body.split('\n').filter((l) => l.trim().startsWith('|'));
  if (lines.length < 3) return null;

  const parseLine = (line: string) =>
    line.split('|').slice(1, -1).map((c) => c.trim());

  const headers = parseLine(lines[0]);
  const rows = lines.slice(2).map(parseLine);

  return { headers, rows };
}

function renderInlineMarkdown(text: string): ReactNode {
  const parts: Array<string | React.ReactElement> = [];
  const regex = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
  let lastIdx = 0;
  let m;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIdx) parts.push(text.slice(lastIdx, m.index));
    if (m[2]) parts.push(<strong key={m.index}>{m[2]}</strong>);
    else if (m[3]) parts.push(<code key={m.index} className="ci-inline-code">{m[3]}</code>);
    lastIdx = m.index + m[0].length;
  }

  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return <>{parts}</>;
}

function OverviewCard({ body }: { body: string }) {
  const lines = body.split('\n').filter((l) => l.trim());

  return (
    <div className="ci-overview-card">
      <div className="ci-overview-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      </div>
      <div className="ci-overview-text">
        {lines.map((line, i) => (
          <p key={i} className="ci-overview-line">{renderInlineMarkdown(line)}</p>
        ))}
      </div>
    </div>
  );
}

function ComparisonTable({ body }: { body: string }) {
  const table = parseTable(body);
  if (!table) return <TextSection body={body} />;

  return (
    <div className="ci-table-wrap">
      <table className="ci-table">
        <thead>
          <tr>
            {table.headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr key={ri}>
              {table.headers.map((_, ci) => {
                const cell = row[ci] ?? '';
                const isAdvantage = ci === table.headers.length - 1;
                return (
                  <td key={ci} className={isAdvantage ? getAdvantageCellClass(cell) : ''}>
                    {renderInlineMarkdown(cell)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getAdvantageCellClass(cell: string): string {
  const lower = cell.toLowerCase();
  if (lower.includes('us') || lower.includes('our') || lower.includes('fleet') || lower.includes('advantage')) {
    return 'ci-advantage-ours';
  }
  if (lower.includes('them') || lower.includes('their') || lower.includes('competitor')) {
    return 'ci-advantage-theirs';
  }
  if (lower.includes('tie') || lower.includes('equal') || lower.includes('both')) {
    return 'ci-advantage-tie';
  }
  return '';
}

function GapCards({ body }: { body: string }) {
  const items = parseNumberedOrBulletItems(body);

  if (items.length === 0) return <TextSection body={body} />;

  return (
    <div className="ci-gap-grid">
      {items.map((item, i) => (
        <div key={i} className="ci-gap-card">
          <span className="ci-gap-number">{i + 1}</span>
          <p className="ci-gap-text">{renderInlineMarkdown(item)}</p>
        </div>
      ))}
    </div>
  );
}

function AttackCards({ body }: { body: string }) {
  // Try to parse structured attack angles with sub-items
  const blocks = body.split(/\n(?=\d+\.\s|\-\s\*\*|\*\*\d)/).filter((b) => b.trim());

  if (blocks.length === 0) return <TextSection body={body} />;

  // Try to extract numbered items with sub-bullets
  const items = parseNumberedOrBulletItems(body);

  if (items.length === 0) return <TextSection body={body} />;

  return (
    <div className="ci-attack-list">
      {items.map((item, i) => (
        <div key={i} className="ci-attack-card">
          <div className="ci-attack-header">
            <span className="ci-attack-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </span>
            <span className="ci-attack-text">{renderInlineMarkdown(item)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TakeawayCard({ body }: { body: string }) {
  return (
    <div className="ci-takeaway">
      <div className="ci-takeaway-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <p className="ci-takeaway-text">{renderInlineMarkdown(body)}</p>
    </div>
  );
}

function TextSection({ body }: { body: string }) {
  const lines = body.split('\n').filter((l) => l.trim());

  return (
    <div className="ci-text-section">
      {lines.map((line, i) => {
        if (line.startsWith('- ')) {
          return <li key={i} className="ci-list-item">{renderInlineMarkdown(line.slice(2))}</li>;
        }
        return <p key={i} className="ci-text-line">{renderInlineMarkdown(line)}</p>;
      })}
    </div>
  );
}

function parseNumberedOrBulletItems(body: string): string[] {
  const items: string[] = [];
  const lines = body.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    const numbered = trimmed.match(/^\d+\.\s+(.+)$/);
    const bulleted = trimmed.match(/^[-*]\s+(.+)$/);

    if (numbered) {
      items.push(numbered[1]);
    } else if (bulleted && !trimmed.startsWith('- **What') && !trimmed.startsWith('- **Where') && !trimmed.startsWith('- **Why')) {
      items.push(bulleted[1]);
    } else if (bulleted) {
      // Sub-item of previous — append to last item
      if (items.length > 0) {
        items[items.length - 1] += ' — ' + bulleted[1];
      }
    }
  }

  return items;
}

function getSectionRenderer(heading: string): (props: { body: string }) => ReactNode {
  const lower = heading.toLowerCase();

  if (lower.includes('overview')) return OverviewCard;
  if (lower.includes('comparison') || lower.includes('product')) return ComparisonTable;
  if (lower.includes('pricing')) return TextSection;
  if (lower.includes('gap')) return GapCards;
  if (lower.includes('attack') || lower.includes('angle')) return AttackCards;
  if (lower.includes('takeaway') || lower.includes('key')) return TakeawayCard;

  return TextSection;
}

export function CompetitiveRenderer({ content }: CompetitiveRendererProps) {
  const { title, sections } = parseSections(content);

  return (
    <div className="ci-container">
      {title && (
        <h1 className="ci-title">{title}</h1>
      )}

      {sections.map((section, i) => {
        const Renderer = getSectionRenderer(section.heading);

        return (
          <div key={i} className="ci-section" style={{ animationDelay: `${i * 0.05}s` }}>
            <h2 className="ci-section-heading">{section.heading}</h2>
            <Renderer body={section.body} />
          </div>
        );
      })}
    </div>
  );
}
