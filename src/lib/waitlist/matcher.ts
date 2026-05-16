import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import * as path from 'node:path';

import { loadAllContacts, normalizeEmail } from '../fs/contact-loader';
import {
  addMatch,
  listSignups,
  listWaitlists,
} from '../fs/waitlist-store';

interface ProcessedState {
  // product -> array of signup IDs already processed
  byProduct: Record<string, string[]>;
}

const DEFAULT_STATE_FILE = path.join(
  homedir(),
  '.fleet',
  'state',
  'processed-signups.json',
);

export interface MatchedRecord {
  product: string;
  signupId: string;
  email: string;
  contactRef: string;
  contactName: string;
}

export interface MatchRunResult {
  signupsScanned: number;
  newMatches: number;
  matched: MatchedRecord[];
}

export interface MatchRunOptions {
  /** Only process this product. Defaults to all. */
  productFilter?: string;
  /** Vault subdirectory holding contacts/*.md (default 'contacts'). */
  vaultContactsDir?: string;
  /** Override the processed-state file location (used by tests). */
  stateFilePath?: string;
}

export async function runMatcher(
  options: MatchRunOptions = {},
): Promise<MatchRunResult> {
  const stateFilePath = options.stateFilePath ?? DEFAULT_STATE_FILE;

  const contacts = await loadAllContacts({
    vaultContactsDir: options.vaultContactsDir,
  });
  const state = await readState(stateFilePath);

  const waitlists = await listWaitlists();
  const targetWaitlists = options.productFilter
    ? waitlists.filter((w) => w.product === options.productFilter)
    : waitlists;

  let signupsScanned = 0;
  const matched: MatchedRecord[] = [];

  for (const waitlist of targetWaitlists) {
    const processed = new Set(state.byProduct[waitlist.product] ?? []);
    const signups = await listSignups(waitlist.product);

    for (const signup of signups) {
      if (processed.has(signup.id)) continue;
      signupsScanned++;

      const contact = contacts.byEmail.get(normalizeEmail(signup.email));
      if (contact) {
        await addMatch({
          signupId: signup.id,
          product: waitlist.product,
          email: signup.email,
          contactRef: contact.ref,
        });
        matched.push({
          product: waitlist.product,
          signupId: signup.id,
          email: signup.email,
          contactRef: contact.ref,
          contactName: contact.name,
        });
      }

      processed.add(signup.id);
    }

    state.byProduct[waitlist.product] = [...processed];
  }

  await writeState(stateFilePath, state);

  return {
    signupsScanned,
    newMatches: matched.length,
    matched,
  };
}

async function readState(filePath: string): Promise<ProcessedState> {
  try {
    const content = await readFile(filePath, 'utf8');
    const parsed: unknown = JSON.parse(content);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'byProduct' in parsed &&
      typeof (parsed as { byProduct: unknown }).byProduct === 'object'
    ) {
      return parsed as ProcessedState;
    }
  } catch {
    // Fall through to default empty state
  }
  return { byProduct: {} };
}

async function writeState(
  filePath: string,
  state: ProcessedState,
): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(state, null, 2), 'utf8');
}
