/**
 * Bidirectional markdown ↔ HTML conversion for Tiptap editor.
 * Handles: headings, bold, italic, lists, tables, code, links, hr, task lists.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function convertInlineMarkdown(text: string): string {
  let result = escapeHtml(text);

  // Bold: **text**
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic: *text* (but not inside bold)
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  // Inline code: `text`
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Links: [text](url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  return result;
}

export function markdownToHtml(md: string): string {
  const lines = md.split('\n');
  const html: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line
    if (trimmed === '') {
      i++;
      continue;
    }

    // Horizontal rule
    if (/^-{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed)) {
      html.push('<hr>');
      i++;
      continue;
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      html.push(`<h${level}>${convertInlineMarkdown(headingMatch[2])}</h${level}>`);
      i++;
      continue;
    }

    // Code block (fenced)
    if (trimmed.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(escapeHtml(lines[i]));
        i++;
      }
      i++; // skip closing ```
      html.push(`<pre><code>${codeLines.join('\n')}</code></pre>`);
      continue;
    }

    // Table: starts with | and next line is separator
    if (trimmed.startsWith('|') && i + 1 < lines.length && /^\|[\s:-]+\|/.test(lines[i + 1].trim())) {
      const headerCells = trimmed.split('|').slice(1, -1).map((c) => c.trim());
      i += 2; // skip header + separator

      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(lines[i].trim().split('|').slice(1, -1).map((c) => c.trim()));
        i++;
      }

      let tableHtml = '<table><thead><tr>';
      for (const cell of headerCells) {
        tableHtml += `<th>${convertInlineMarkdown(cell)}</th>`;
      }
      tableHtml += '</tr></thead><tbody>';
      for (const row of rows) {
        tableHtml += '<tr>';
        for (let c = 0; c < headerCells.length; c++) {
          tableHtml += `<td>${convertInlineMarkdown(row[c] ?? '')}</td>`;
        }
        tableHtml += '</tr>';
      }
      tableHtml += '</tbody></table>';
      html.push(tableHtml);
      continue;
    }

    // Task list: - [ ] or - [x]
    if (/^-\s+\[([ xX])\]\s/.test(trimmed)) {
      const taskItems: string[] = [];
      while (i < lines.length && /^-\s+\[([ xX])\]\s/.test(lines[i].trim())) {
        const match = lines[i].trim().match(/^-\s+\[([ xX])\]\s+(.+)$/);
        if (match) {
          const checked = match[1] !== ' ';
          taskItems.push(
            `<li data-type="taskItem" data-checked="${checked}"><label><input type="checkbox"${checked ? ' checked' : ''}><span>${convertInlineMarkdown(match[2])}</span></label></li>`
          );
        }
        i++;
      }
      html.push(`<ul data-type="taskList">${taskItems.join('')}</ul>`);
      continue;
    }

    // Unordered list
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        items.push(`<li>${convertInlineMarkdown(lines[i].trim().slice(2))}</li>`);
        i++;
      }
      html.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        const match = lines[i].trim().match(/^\d+\.\s+(.+)$/);
        if (match) {
          items.push(`<li>${convertInlineMarkdown(match[1])}</li>`);
        }
        i++;
      }
      html.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().slice(2));
        i++;
      }
      html.push(`<blockquote><p>${convertInlineMarkdown(quoteLines.join(' '))}</p></blockquote>`);
      continue;
    }

    // Regular paragraph
    html.push(`<p>${convertInlineMarkdown(trimmed)}</p>`);
    i++;
  }

  return html.join('');
}

export function htmlToMarkdown(html: string): string {
  // Use a simple regex-based approach for the HTML Tiptap produces
  let md = html;

  // Block-level elements first (order matters)

  // Headings
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
  md = md.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
  md = md.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');

  // Horizontal rule
  md = md.replace(/<hr\s*\/?>/gi, '---\n\n');

  // Code blocks
  md = md.replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n');

  // Blockquotes
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, content) => {
    const text = content.replace(/<\/?p[^>]*>/gi, '').trim();
    return `> ${text}\n\n`;
  });

  // Tables
  md = md.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_, tableContent) => {
    const headers: string[] = [];
    const rows: string[][] = [];

    const thRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi;
    let thMatch;
    while ((thMatch = thRegex.exec(tableContent)) !== null) {
      headers.push(thMatch[1].replace(/<[^>]+>/g, '').trim());
    }

    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let trMatch;
    let isFirst = true;
    while ((trMatch = trRegex.exec(tableContent)) !== null) {
      if (isFirst && headers.length > 0) {
        isFirst = false;
        continue; // skip header row
      }
      isFirst = false;
      const cells: string[] = [];
      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      let tdMatch;
      while ((tdMatch = tdRegex.exec(trMatch[1])) !== null) {
        cells.push(tdMatch[1].replace(/<[^>]+>/g, '').trim());
      }
      if (cells.length > 0) rows.push(cells);
    }

    if (headers.length === 0) return '';

    let table = `| ${headers.join(' | ')} |\n`;
    table += `| ${headers.map(() => '---').join(' | ')} |\n`;
    for (const row of rows) {
      table += `| ${headers.map((_, i) => row[i] ?? '').join(' | ')} |\n`;
    }
    return table + '\n';
  });

  // Task lists
  md = md.replace(/<ul[^>]*data-type="taskList"[^>]*>([\s\S]*?)<\/ul>/gi, (_, content) => {
    let result = '';
    const liRegex = /<li[^>]*data-checked="(true|false)"[^>]*>([\s\S]*?)<\/li>/gi;
    let liMatch;
    while ((liMatch = liRegex.exec(content)) !== null) {
      const checked = liMatch[1] === 'true';
      const text = liMatch[2].replace(/<[^>]+>/g, '').trim();
      result += `- [${checked ? 'x' : ' '}] ${text}\n`;
    }
    return result + '\n';
  });

  // Unordered lists
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, content) => {
    let result = '';
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let liMatch;
    while ((liMatch = liRegex.exec(content)) !== null) {
      const text = liMatch[1].replace(/<[^>]+>/g, '').trim();
      result += `- ${text}\n`;
    }
    return result + '\n';
  });

  // Ordered lists
  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, content) => {
    let result = '';
    let num = 1;
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let liMatch;
    while ((liMatch = liRegex.exec(content)) !== null) {
      const text = liMatch[1].replace(/<[^>]+>/g, '').trim();
      result += `${num}. ${text}\n`;
      num++;
    }
    return result + '\n';
  });

  // Paragraphs
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');

  // Line breaks
  md = md.replace(/<br\s*\/?>/gi, '\n');

  // Inline elements
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Strip remaining tags
  md = md.replace(/<[^>]+>/g, '');

  // Unescape HTML entities
  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  md = md.replace(/&quot;/g, '"');

  // Clean up excessive newlines
  md = md.replace(/\n{3,}/g, '\n\n');
  md = md.trim();

  return md;
}
