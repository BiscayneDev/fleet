import type { ReactNode } from 'react';

interface MarkdownRendererProps {
  content: string;
}

function renderInline(text: string): ReactNode {
  const parts: Array<string | React.ReactElement> = [];
  // Match **bold**, `code`, and plain text
  const regex = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
  let lastIdx = 0;
  let m;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIdx) {
      parts.push(text.slice(lastIdx, m.index));
    }
    if (m[2]) {
      parts.push(<strong key={m.index}>{m[2]}</strong>);
    } else if (m[3]) {
      parts.push(
        <code key={m.index} className="fleet-md-code">{m[3]}</code>,
      );
    }
    lastIdx = m.index + m[0].length;
  }

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  return parts.length > 0 ? <>{parts}</> : <>{text}</>;
}

function isTableSeparator(line: string): boolean {
  return /^\|[\s:-]+\|/.test(line.trim());
}

function parseTableRow(line: string): string[] {
  return line
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function renderTable(lines: string[]): ReactNode {
  if (lines.length < 2) return null;

  const headerLine = lines[0];
  const separatorIdx = lines.findIndex((l) => isTableSeparator(l));

  if (separatorIdx === -1) return null;

  const headers = parseTableRow(headerLine);
  const dataLines = lines.slice(separatorIdx + 1).filter((l) => l.includes('|'));

  return (
    <div className="fleet-md-table-wrap">
      <table className="fleet-md-table">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{renderInline(h)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataLines.map((line, rowIdx) => {
            const cells = parseTableRow(line);
            return (
              <tr key={rowIdx}>
                {headers.map((_, colIdx) => (
                  <td key={colIdx}>{renderInline(cells[colIdx] ?? '')}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const lines = content.split('\n');
  const elements: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Table detection: line starts with | and next line is a separator
    if (line.trim().startsWith('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const table = renderTable(tableLines);
      if (table) {
        elements.push(<div key={`table-${i}`}>{table}</div>);
      }
      continue;
    }

    // Headers
    if (line.startsWith('#### ')) {
      elements.push(
        <h4 key={i} className="fleet-md-h4">{renderInline(line.slice(5))}</h4>,
      );
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="fleet-md-h3">{renderInline(line.slice(4))}</h3>,
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="fleet-md-h2">{renderInline(line.slice(3))}</h2>,
      );
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="fleet-md-h1">{renderInline(line.slice(2))}</h1>,
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (/^-{3,}$/.test(line.trim())) {
      elements.push(<hr key={i} className="fleet-md-hr" />);
      i++;
      continue;
    }

    // Unordered list
    if (line.startsWith('- ')) {
      elements.push(
        <li key={i} className="fleet-md-li">{renderInline(line.slice(2))}</li>,
      );
      i++;
      continue;
    }

    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      elements.push(
        <li key={i} className="fleet-md-li fleet-md-li-num">
          <span className="fleet-md-li-number">{numMatch[1]}.</span>
          {renderInline(numMatch[2])}
        </li>,
      );
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: '0.3rem' }} />);
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="fleet-md-p">{renderInline(line)}</p>,
    );
    i++;
  }

  return <div className="fleet-md">{elements}</div>;
}
