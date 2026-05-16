import { mkdir, readdir, readFile, writeFile, appendFile } from 'node:fs/promises'
import * as path from 'node:path'

import { getDataRoot } from './path-utils'
import { hasVault, getVaultRoot, resolveVaultPath } from './vault-path-utils'

const INBOX_DIRECTORY = 'inbox' // lowercase, matches Hermes convention
const COMPILATION_TRIGGER = '.compilation-needed'

/**
 * One captured block inside a daily inbox file.
 *
 * The on-disk format follows [[HERMES.md]]:
 *
 *   ## 09:16
 *   <user content>
 *
 *   ## 09:42 — link
 *   URL: https://...
 *
 *   <user note (optional)>
 *
 *   ## 14:03 — idea
 *   ...
 *
 * Headings are append-only — Fleet writes new blocks at the bottom of
 * today's file. Reads parse all daily files into entries, newest first.
 */
export interface InboxEntry {
  /** Stable id: `<date>:<line-offset>`, for React keys. */
  id: string
  /** ISO date of the source file, e.g. '2026-05-16'. */
  date: string
  /** HH:MM from the block header. */
  time: string
  /** ISO timestamp combining date+time (no seconds — block resolution). */
  capturedAt: string
  /** Optional `— <kind>` suffix on the block header (link, idea, voice, etc.). */
  kind: string | null
  /** Raw markdown body of the block (after the heading, before next ##). */
  body: string
  /** First URL detected in the body, if any. */
  url: string | null
  /** Display title: URL host, first line, or "Note". */
  title: string
}

export interface CreateInboxEntryInput {
  /** Raw user content — pasted link, jotted note, anything. */
  content: string
}

function getInboxRoot(): string {
  return hasVault()
    ? resolveVaultPath(INBOX_DIRECTORY)
    : path.join(getDataRoot(), INBOX_DIRECTORY)
}

function getDailyFilePath(date: string): string {
  return path.join(getInboxRoot(), `${date}.md`)
}

function getTriggerPath(): string | null {
  const vault = getVaultRoot()
  if (!vault) return null
  return path.join(vault, COMPILATION_TRIGGER)
}

function todayDateLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function nowTimeLocal(): string {
  const d = new Date()
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function detectUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s)>]+/i)
  return match ? match[0] : null
}

function detectKind(content: string): string | null {
  const trimmed = content.trimStart()
  if (/^idea[:\s]/i.test(trimmed)) return 'idea'
  if (detectUrl(trimmed)) return 'link'
  return null
}

function renderBlock(opts: {
  time: string
  kind: string | null
  content: string
}): string {
  const heading = opts.kind
    ? `## ${opts.time} — ${opts.kind}`
    : `## ${opts.time}`
  return `${heading}\n${opts.content.trim()}\n\n`
}

async function writeTriggerFile(): Promise<void> {
  const triggerPath = getTriggerPath()
  if (!triggerPath) return // Only relevant when vault is configured
  try {
    const payload = JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        trigger: 'fleet_capture',
        action: 'process_inbox',
      },
      null,
      2,
    )
    await writeFile(triggerPath, payload + '\n', 'utf8')
  } catch {
    // Trigger is best-effort — capture should not fail if trigger write does
  }
}

export async function createInboxEntry(
  input: CreateInboxEntryInput,
): Promise<InboxEntry> {
  const content = input.content.trim()
  if (!content) {
    throw new Error('inbox content cannot be empty')
  }

  const root = getInboxRoot()
  await mkdir(root, { recursive: true })

  const date = todayDateLocal()
  const time = nowTimeLocal()
  const kind = detectKind(content)
  const block = renderBlock({ time, kind, content })

  const filePath = getDailyFilePath(date)
  await appendFile(filePath, block, 'utf8')

  await writeTriggerFile()

  const url = detectUrl(content)
  return {
    id: `${date}:${time}`,
    date,
    time,
    capturedAt: `${date}T${time}:00`,
    kind,
    body: content,
    url,
    title: buildTitle({ content, url }),
  }
}

function buildTitle(opts: { content: string; url: string | null }): string {
  if (opts.url) {
    try {
      const u = new URL(opts.url)
      return u.host + u.pathname
    } catch {
      return opts.url
    }
  }
  const firstLine = opts.content.split(/\r?\n/).map((l) => l.trim()).find(Boolean)
  return (firstLine ?? 'Note').slice(0, 120)
}

/**
 * Parse a single daily file into entries. Splits on `^## HH:MM` lines.
 * Lenient — non-matching content above the first heading is ignored.
 */
function parseDailyFile(date: string, raw: string): InboxEntry[] {
  const entries: InboxEntry[] = []
  const blockRegex = /^## (\d{2}:\d{2})(?:\s+—\s+([^\n]+))?$/gm
  const matches: Array<{ index: number; time: string; kind: string | null }> = []
  let m: RegExpExecArray | null
  while ((m = blockRegex.exec(raw)) !== null) {
    matches.push({
      index: m.index,
      time: m[1],
      kind: m[2]?.trim() || null,
    })
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i]
    const headerEndIdx = raw.indexOf('\n', start.index)
    const nextStart = i + 1 < matches.length ? matches[i + 1].index : raw.length
    const body = raw
      .slice(headerEndIdx + 1, nextStart)
      .replace(/^\s+|\s+$/g, '')
    if (!body) continue
    const url = detectUrl(body)
    entries.push({
      id: `${date}:${start.time}`,
      date,
      time: start.time,
      capturedAt: `${date}T${start.time}:00`,
      kind: start.kind,
      body,
      url,
      title: buildTitle({ content: body, url }),
    })
  }
  return entries
}

export async function listInboxEntries(): Promise<InboxEntry[]> {
  const root = getInboxRoot()
  try {
    await mkdir(root, { recursive: true })
    const entries = await readdir(root, { withFileTypes: true })
    const dailyFiles = entries
      .filter((e) => e.isFile() && /^\d{4}-\d{2}-\d{2}\.md$/.test(e.name))
      .map((e) => ({ date: e.name.slice(0, 10), file: e.name }))

    const all = await Promise.all(
      dailyFiles.map(async ({ date, file }) => {
        try {
          const raw = await readFile(path.join(root, file), 'utf8')
          return parseDailyFile(date, raw)
        } catch {
          return [] as InboxEntry[]
        }
      }),
    )

    return all
      .flat()
      .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))
  } catch {
    return []
  }
}

/* --------------------------------------------------------------
 * Back-compat shim: existing callers (and tests) imported
 * createInboxItem / listInboxItems / InboxItem from this module.
 * Re-export with the new shapes so consumers can migrate gradually.
 * -------------------------------------------------------------- */

/** @deprecated Use `InboxEntry` instead. */
export type InboxItem = InboxEntry

/** @deprecated Use `createInboxEntry` instead. */
export const createInboxItem = createInboxEntry

/** @deprecated Use `listInboxEntries` instead. */
export const listInboxItems = listInboxEntries
