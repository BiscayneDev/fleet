import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  createInboxEntry,
  listInboxEntries,
} from '../../src/lib/fs/inbox-store'

const tempDirs: string[] = []

async function makeTempDataRoot(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'fleet-inbox-store-'))
  tempDirs.push(dir)
  return dir
}

beforeEach(() => {
  delete process.env.FLEET_DATA_ROOT
  delete process.env.FLEET_VAULT_ROOT
})

afterEach(async () => {
  delete process.env.FLEET_DATA_ROOT
  delete process.env.FLEET_VAULT_ROOT
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })),
  )
})

function todayDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

describe('inbox store (Hermes daily-markdown format)', () => {
  it('appends a plain note as a `## HH:MM` block in today\'s file', async () => {
    const dataRoot = await makeTempDataRoot()
    process.env.FLEET_DATA_ROOT = dataRoot

    const entry = await createInboxEntry({ content: 'A passing thought.' })

    expect(entry.date).toBe(todayDate())
    expect(entry.time).toMatch(/^\d{2}:\d{2}$/)
    expect(entry.kind).toBeNull()
    expect(entry.body).toBe('A passing thought.')
    expect(entry.url).toBeNull()

    const filePath = path.join(dataRoot, 'inbox', `${entry.date}.md`)
    await expect(stat(filePath).then((s) => s.isFile())).resolves.toBe(true)
    const contents = await readFile(filePath, 'utf8')
    expect(contents).toMatch(/^## \d{2}:\d{2}\nA passing thought\.\n\n$/)
  })

  it('tags URL captures with `— link` and parses the URL out', async () => {
    const dataRoot = await makeTempDataRoot()
    process.env.FLEET_DATA_ROOT = dataRoot

    const entry = await createInboxEntry({
      content: 'https://example.com/research/brief',
    })

    expect(entry.kind).toBe('link')
    expect(entry.url).toBe('https://example.com/research/brief')

    const file = await readFile(
      path.join(dataRoot, 'inbox', `${entry.date}.md`),
      'utf8',
    )
    expect(file).toMatch(/^## \d{2}:\d{2} — link\n/)
  })

  it('tags "idea: ..." captures with `— idea`', async () => {
    const dataRoot = await makeTempDataRoot()
    process.env.FLEET_DATA_ROOT = dataRoot

    const entry = await createInboxEntry({
      content: 'idea: turn waitlists into a Fleet feature',
    })
    expect(entry.kind).toBe('idea')
  })

  it('appends multiple blocks to the same daily file', async () => {
    const dataRoot = await makeTempDataRoot()
    process.env.FLEET_DATA_ROOT = dataRoot

    await createInboxEntry({ content: 'first capture' })
    await new Promise((r) => setTimeout(r, 5))
    await createInboxEntry({ content: 'second capture' })

    const file = await readFile(
      path.join(dataRoot, 'inbox', `${todayDate()}.md`),
      'utf8',
    )
    expect(file.match(/^## /gm)?.length ?? 0).toBeGreaterThanOrEqual(2)
    expect(file).toContain('first capture')
    expect(file).toContain('second capture')
  })

  it('writes to <vault>/inbox/ when FLEET_VAULT_ROOT is set', async () => {
    const vaultRoot = await makeTempDataRoot()
    process.env.FLEET_VAULT_ROOT = vaultRoot

    const entry = await createInboxEntry({ content: 'vault capture' })

    const filePath = path.join(vaultRoot, 'inbox', `${entry.date}.md`)
    await expect(stat(filePath).then((s) => s.isFile())).resolves.toBe(true)
  })

  it('writes a .compilation-needed trigger at the vault root', async () => {
    const vaultRoot = await makeTempDataRoot()
    process.env.FLEET_VAULT_ROOT = vaultRoot

    await createInboxEntry({ content: 'trigger me' })

    const triggerPath = path.join(vaultRoot, '.compilation-needed')
    const stats = await stat(triggerPath)
    expect(stats.isFile()).toBe(true)
    const payload = JSON.parse(await readFile(triggerPath, 'utf8'))
    expect(payload.trigger).toBe('fleet_capture')
    expect(payload.action).toBe('process_inbox')
  })

  it('does NOT write a trigger when no vault is configured', async () => {
    const dataRoot = await makeTempDataRoot()
    process.env.FLEET_DATA_ROOT = dataRoot

    await createInboxEntry({ content: 'no trigger plz' })

    await expect(
      stat(path.join(dataRoot, '.compilation-needed')),
    ).rejects.toThrow()
  })

  it('lists entries newest-first across multiple daily files', async () => {
    const dataRoot = await makeTempDataRoot()
    process.env.FLEET_DATA_ROOT = dataRoot

    // Seed two prior days by hand
    const inboxDir = path.join(dataRoot, 'inbox')
    await rm(inboxDir, { force: true, recursive: true })
    const { mkdir, writeFile } = await import('node:fs/promises')
    await mkdir(inboxDir, { recursive: true })
    await writeFile(
      path.join(inboxDir, '2026-05-14.md'),
      '## 09:16\nOlder note\n\n## 22:00\nLate note\n\n',
      'utf8',
    )
    await writeFile(
      path.join(inboxDir, '2026-05-15.md'),
      '## 08:00 — link\nURL: https://x.com/foo\n\n',
      'utf8',
    )

    const entries = await listInboxEntries()
    expect(entries.length).toBe(3)
    // newest first
    expect(entries[0].date).toBe('2026-05-15')
    expect(entries[0].kind).toBe('link')
    expect(entries[0].url).toBe('https://x.com/foo')
    expect(entries[1].date).toBe('2026-05-14')
    expect(entries[1].time).toBe('22:00')
    expect(entries[2].time).toBe('09:16')
  })

  it('returns an empty array when the inbox dir does not exist', async () => {
    const dataRoot = await makeTempDataRoot()
    process.env.FLEET_DATA_ROOT = dataRoot
    await expect(listInboxEntries()).resolves.toEqual([])
  })
})
