'use client'

import { useMemo, useState } from 'react'
import { DEMO_NOW, demo, demoVersions, type VersionHistoryCopy, type VersionHistoryPerson, type VersionHistoryVersion } from './data'
import { diffBlocks, diffText, wordCounts } from './diff'
import type { Counts } from './versions'

/* The versions as shown: the app's (or the demo's), with a restore that's
 * on its way laid on top and names given here applied at once. A restore
 * settles when `onRestore` resolves: the demo keeps it, and an app's next
 * `versions` takes over. A rejection takes it away again and says why. */

export interface VersionOptions {
  versions: VersionHistoryVersion[] | undefined
  user: VersionHistoryPerson
  copy: VersionHistoryCopy
  read: () => number
  onRestore?: (versionId: string) => Promise<Partial<VersionHistoryVersion> | void> | Partial<VersionHistoryVersion> | void
  onRename?: (versionId: string, name: string) => Promise<unknown> | unknown
}

const reason = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback)

/** Words added and removed by each version, against the one before it. */
export function countsOf(versions: readonly VersionHistoryVersion[]): Map<string, Counts> {
  const out = new Map<string, Counts>()
  versions.forEach((version, i) => {
    const before = versions[i + 1]
    if (!before) {
      out.set(version.id, { added: wordCounts(version.doc.blocks.map((b) => ({ op: 'insert' as const, text: b.text }))).added, removed: 0 })
      return
    }
    let added = 0
    let removed = 0
    for (const block of diffBlocks(before.doc.blocks, version.doc.blocks)) {
      if (!block.change) continue
      const pieces =
        block.change === 'changed'
          ? diffText(before.doc.blocks.find((b) => b.id === block.id)!.text, version.doc.blocks.find((b) => b.id === block.id)!.text)
          : block.pieces
      const count = wordCounts(pieces)
      added += count.added
      removed += count.removed
    }
    out.set(version.id, { added, removed })
  })
  return out
}

export function useVersions({ versions: versionsProp, user, copy, read, onRestore, onRename }: VersionOptions) {
  const simulated = versionsProp === undefined
  const [own, setOwn] = useState(() => demoVersions(DEMO_NOW))
  const [source, setSource] = useState(versionsProp)
  const [pending, setPending] = useState<{ version: VersionHistoryVersion; settled: boolean }[]>([])
  const [names, setNames] = useState<Record<string, string>>({})
  const [failure, setFailure] = useState<string | null>(null)
  // The app's new versions replace what settled.
  if (versionsProp !== source) {
    setSource(versionsProp)
    setPending((list) => list.filter((p) => !p.settled))
    setNames({})
  }
  const base = versionsProp ?? own
  const versions = useMemo(
    () => [...pending.map((p) => p.version), ...base].map((v) => (v.id in names ? { ...v, name: names[v.id] || undefined } : v)),
    [pending, base, names],
  )
  const counts = useMemo(() => countsOf(versions), [versions])

  /** Restores a version as a new one at the top, `select`ing it at once (and again if the app gives it another id); a rejection goes back to `from`. */
  const restore = async (from: VersionHistoryVersion, select: (id: string) => void) => {
    setFailure(null)
    const version: VersionHistoryVersion = { id: `restore-${read()}`, createdAt: read(), authors: [user], restoredFrom: from.id, doc: from.doc }
    setPending((list) => [{ version, settled: false }, ...list])
    select(version.id)
    try {
      const saved = await (onRestore ? onRestore(from.id) : demo('VersionHistory: onRestore', 700))
      const fields: Partial<VersionHistoryVersion> = saved && typeof saved === 'object' ? saved : {}
      const done = { ...version, ...fields }
      if (simulated) {
        setOwn((list) => [done, ...list])
        setPending((list) => list.filter((p) => p.version.id !== version.id))
      } else setPending((list) => list.map((p) => (p.version.id === version.id ? { version: done, settled: true } : p)))
      if (done.id !== version.id) select(done.id)
      return true
    } catch (error) {
      setPending((list) => list.filter((p) => p.version.id !== version.id))
      setFailure(reason(error, copy.failed))
      select(from.id)
      return false
    }
  }

  const rename = async (version: VersionHistoryVersion, name: string) => {
    setFailure(null)
    const before = version.name ?? ''
    setNames((all) => ({ ...all, [version.id]: name }))
    try {
      await (onRename ? onRename(version.id, name) : demo('VersionHistory: onRename', 400))
      if (simulated) setOwn((list) => list.map((v) => (v.id === version.id ? { ...v, name: name || undefined } : v)))
      return true
    } catch (error) {
      setNames((all) => ({ ...all, [version.id]: before }))
      setFailure(reason(error, copy.failed))
      return false
    }
  }

  return { simulated, versions, counts, restore, rename, failure }
}
