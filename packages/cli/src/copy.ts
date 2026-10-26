/* What `add` does about files that are already there. shadcn asks about each one,
 * and never on a file that differs only by the `'use client'` line it strips, so a
 * shared dependency (morph-label.tsx) prompts on every run and `--yes` doesn't stop
 * it. `add` runs shadcn with `--yes --overwrite` (it never asks), watches the folders
 * it copies into, and puts back what should stay: a file that's the same as the
 * registry's modulo formatting is left as is, silently, and one you changed is kept
 * and reported. `--overwrite` on our command replaces those too. */

import { rmSync, statSync } from 'node:fs'
import { posix } from 'node:path'
import { isUtilsPath, mergeUtils } from './collisions'
import type { Project } from './project'

/** Folders the copied items land in (by any spelling of the alias): the files worth watching. */
const COPY_DIRS = /(^|\/)(components|lib|hooks|blocks|styles|ui)\//
const SOURCE = /\.(tsx?|jsx?|mjs|css|astro)$/

export type Snapshot = Map<string, { content: string; mtime: number }>

/**
 * The files under the app's copy-in folders, by path: their content, and when they were last written (to tell the ones shadcn rewrote).
 * Not the app's own stylesheet, the one components.json names, though an app can keep it in one of those folders (the Pages Router's
 * styles/globals.css): shadcn merges an item's css into it (the motion presets), which is no copy to settle.
 */
export function snapshot(project: Project): Snapshot {
  const files: Snapshot = new Map()
  const stylesheet = project.json<{ tailwind?: { css?: string } }>('components.json')?.tailwind?.css
  const own = stylesheet ? posix.normalize(stylesheet) : undefined
  for (const path of project.walk('.', (name) => SOURCE.test(name)).filter((f) => COPY_DIRS.test(f) && f !== own))
    files.set(path, { content: project.read(path) ?? '', mtime: statSync(project.abs(path)).mtimeMs })
  return files
}

/**
 * A file's content without what shadcn, `add`'s import repair or a formatter changes: the directive
 * and the comment under it (shadcn drops both from an app with `rsc: false`), where an `@/` import
 * points (shadcn misroutes some, and repairImports puts them back), quotes, semicolons, commas and whitespace.
 */
export const essence = (text: string) =>
  text
    .replace(/^\s*(['"])use client\1;?/, '')
    .replace(/^(\s*(\/\*[\s\S]*?\*\/|\/\/[^\n]*))+/, '')
    .replace(/(['"])@\/[^'"]*\1/g, '@/')
    .replace(/['"`;,\s]/g, '')

/** The core's placeholders (a file that exports `youjStandIn`): an item of its own replaces one, and a copy of the core never replaces what has taken one's place. */
export const isStandIn = (content: string) => /\bexport const youjStandIn\b/.test(content)

export interface CopyOutcome {
  /** Files that weren't there before. */
  created: string[]
  /** Files replaced (with `--overwrite`). */
  updated: string[]
  /** Files shadcn rewrote that were already there and the same as the registry's: left as they are. */
  unchanged: number
  /** The registry's files that are in place now: created, replaced or already the same. */
  youj: string[]
  /** Files you changed that the registry's copy differs from: kept as yours. */
  conflicts: string[]
  /** The registry's version of each conflict, to put in after all (Youj's code needs it). */
  incoming: Map<string, string>
  /** lib/utils.ts: shadcn's replaced by Youj's (`replaced`), or Youj's with the app's helpers moved beside it (`merged`). */
  utils?: { path: string; kind: 'replaced' } | { path: string; kind: 'merged'; local?: string; shadowed: string[] }
}

/**
 * Compares the app after shadcn ran with `before`, and puts back the files
 * that were there and shouldn't change: the same ones (modulo the directive and
 * formatting) and, unless `overwrite`, the ones you edited. lib/utils.ts is
 * merged instead, overwrite or not (collisions.ts). Writes straight to disk.
 */
export function settle(project: Project, before: Snapshot, overwrite: boolean): CopyOutcome {
  const after = snapshot(project)
  const outcome: CopyOutcome = { created: [], updated: [], unchanged: 0, youj: [], conflicts: [], incoming: new Map() }
  const same = (a: string, b: string) => essence(a) === essence(b)
  for (const [path, { content, mtime }] of after) {
    const was = before.get(path)
    if (!was) {
      outcome.created.push(path)
      outcome.youj.push(path)
    } else if (mtime === was.mtime && content === was.content) continue // not one of the files shadcn wrote
    else if (same(was.content, content)) {
      outcome.unchanged++
      outcome.youj.push(path)
      if (was.content !== content) project.restore(path, was.content)
    } else if (isStandIn(content) || isStandIn(was.content)) {
      // The stand-in is replaced by the real file, never the real file by the stand-in.
      if (isStandIn(content)) {
        outcome.unchanged++
        project.restore(path, was.content)
      } else outcome.updated.push(path)
      outcome.youj.push(path)
    } else if (isUtilsPath(path)) {
      const merge = mergeUtils(project, path, was.content, content, same)
      if (merge.kind === 'same') {
        outcome.unchanged++
        project.restore(path, was.content)
      } else if (merge.kind === 'conflict') {
        outcome.conflicts.push(path)
        outcome.incoming.set(path, content)
        project.restore(path, was.content)
        continue
      } else {
        if (merge.kind === 'merge' && merge.local) project.restore(merge.local.path, merge.local.content)
        project.restore(path, merge.content)
        outcome.utils = merge.kind === 'replace' ? { path, kind: 'replaced' } : { path, kind: 'merged', local: merge.local?.path, shadowed: merge.shadowed }
      }
      outcome.youj.push(path)
    } else if (overwrite) {
      outcome.updated.push(path)
      outcome.youj.push(path)
    } else {
      outcome.conflicts.push(path)
      outcome.incoming.set(path, content)
      project.restore(path, was.content)
    }
  }
  return outcome
}

/** Undoes a copy that failed partway: the files it changed go back as they were, the ones it created go. */
export function rollback(project: Project, before: Snapshot): void {
  for (const [path, { content }] of snapshot(project)) {
    const was = before.get(path)
    if (!was) rmSync(project.abs(path))
    else if (was.content !== content) project.restore(path, was.content)
  }
}

/** What happened to lib/utils.ts, for the user. */
export function describeUtils(utils: NonNullable<CopyOutcome['utils']>): string {
  if (utils.kind === 'replaced') return `${utils.path}: replaced shadcn's stock cn with Youj's, which does the same and knows Youj's tokens`
  return `${utils.path}: Youj's cn and helpers, re-exporting your own${utils.local ? `, which moved to ${utils.local}` : ''}, so your imports of it keep working${
    utils.shadowed.length ? `. Youj's ${utils.shadowed.join(', ')} take${utils.shadowed.length === 1 ? 's' : ''} the place of yours` : ''
  }`
}

/** The shadcn output that isn't a file list: what's left after the Created/Updated/Skipped headings, their bullets and progress lines. */
export function otherOutput(output: string): string[] {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: strips ANSI colour escapes
  const lines = output.replace(/\u001b\[[0-9;]*m/g, '').split('\n')
  const out: string[] = []
  let inList = false
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    if (/^(?:[✔✓ℹ⚠]\s*)?(?:Created|Updated|Skipped|Overwrote) \d+ files?/.test(line)) {
      inList = true
      continue
    }
    if (inList && /^[-•]\s+\S+$/.test(line)) continue
    inList = false
    if (/^[✔✓◐◓◑◒⠋-⣿]/.test(line) || /^[-•]?\s*(?:Checking|Installing|Resolving|Updating|Fetching|Writing|Adding) /.test(line)) continue
    out.push(line)
  }
  return out
}
