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

  const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());

  const firstNameIdx = header.findIndex((h) => h.includes('first name'));
  const lastNameIdx = header.findIndex((h) => h.includes('last name'));
  const emailIdx = header.findIndex((h) => h.includes('email'));
  const companyIdx = header.findIndex((h) => h.includes('company'));
  const positionIdx = header.findIndex((h) => h.includes('position'));

  if (firstNameIdx === -1 || lastNameIdx === -1) {
    throw new Error('CSV must contain "First Name" and "Last Name" columns');
  }

  const connections: CreateConnectionInput[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    const firstName = fields[firstNameIdx] ?? '';
    const lastName = fields[lastNameIdx] ?? '';
    const displayName = `${firstName} ${lastName}`.trim();

    if (!displayName) continue;

    const handle = displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

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
