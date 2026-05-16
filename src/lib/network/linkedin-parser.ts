import type { CreateConnectionInput } from '../fs/network-store';

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
}

export function parseLinkedInCSV(csvContent: string): CreateConnectionInput[] {
  const lines = csvContent.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length < 2) return [];

  // LinkedIn exports include disclaimer lines before the actual CSV header.
  // Find the line that contains the column headers.
  const headerLineIdx = lines.findIndex((line) => {
    const lower = line.toLowerCase();
    return lower.includes('first name') && lower.includes('last name');
  });

  if (headerLineIdx === -1) {
    throw new Error('CSV must contain "First Name" and "Last Name" columns');
  }

  const header = parseCSVLine(lines[headerLineIdx]).map((h) => h.toLowerCase().trim());

  const firstNameIdx = header.findIndex((h) => h.includes('first name'));
  const lastNameIdx = header.findIndex((h) => h.includes('last name'));
  const emailIdx = header.findIndex((h) => h.includes('email'));
  const urlIdx = header.findIndex((h) => h === 'url' || h.includes('profile'));
  const companyIdx = header.findIndex((h) => h.includes('company'));
  const positionIdx = header.findIndex((h) => h.includes('position'));

  if (firstNameIdx === -1 || lastNameIdx === -1) {
    throw new Error('CSV must contain "First Name" and "Last Name" columns');
  }

  const connections: CreateConnectionInput[] = [];

  for (let i = headerLineIdx + 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    const firstName = fields[firstNameIdx] ?? '';
    const lastName = fields[lastNameIdx] ?? '';
    const displayName = `${firstName} ${lastName}`.trim();

    if (!displayName) continue;

    // Extract LinkedIn username from profile URL if available
    const profileUrl = urlIdx !== -1 ? (fields[urlIdx] ?? '') : '';
    const urlMatch = profileUrl.match(/linkedin\.com\/in\/([^/?]+)/);
    const handle = urlMatch
      ? urlMatch[1]
      : displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    connections.push({
      platform: 'linkedin',
      handle,
      displayName,
      company: (companyIdx !== -1 ? fields[companyIdx] : null) || null,
      position: (positionIdx !== -1 ? fields[positionIdx] : null) || null,
      email: (emailIdx !== -1 ? fields[emailIdx] : null) || null,
      bio: null,
    });
  }

  return connections;
}
