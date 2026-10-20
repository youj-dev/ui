import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/* The repository's CHANGELOG.md, split into releases for /changelog and its
 * feed. A release is a `##` heading (`## Unreleased`, `## 0.2.0`, optionally
 * with a date: `## 0.2.0 - 2026-10-02`, or marked as not out yet:
 * `## 0.1.0 (Unreleased)`), and its sections are the `###`
 * headings under it. Section bodies stay Markdown; the page renders them.
 * Until a release is written up, pending changesets stand in for it. */

export type ChangeKind = 'breaking' | 'added' | 'changed' | 'fixed'

export interface ChangelogSection {
  kind: ChangeKind
  /** The heading without its kind: "Components with heavy dependencies…", or empty for a bare "Also". */
  title: string
  body: string
}

export interface Release {
  /** `0.1.0`, or `Unreleased`. A version marked `(Unreleased)` keeps its number. */
  version: string
  /** The anchor: `v0-1-0`, `unreleased`. */
  id: string
  /** ISO date, when the heading has one. */
  date?: string
  unreleased: boolean
  /** Markdown before the first section. */
  intro: string
  sections: ChangelogSection[]
}

export interface Changelog {
  intro: string
  releases: Release[]
  /** Changesets waiting for the next release. */
  pending: number
}

const ISO_DATE = /\b(\d{4}-\d{2}-\d{2})\b/
/** `(Unreleased)` or `- Unreleased` after a version: written up, not published yet. */
const UNRELEASED_MARK = /[\s–—-]*\(?\bunreleased\b\)?\s*$/i

/** What a section heading says about its changes. Handles the changesets headings too. */
export function sectionKind(heading: string): { kind: ChangeKind; title: string } {
  const h = heading.trim()
  const rest = (re: RegExp) => {
    const title = h.replace(re, '').replace(/^[\s:–—-]+/, '').trim()
    return title.charAt(0).toUpperCase() + title.slice(1)
  }
  if (/^(breaking|major changes)/i.test(h)) return { kind: 'breaking', title: rest(/^(breaking( changes?)?|major changes)/i) }
  if (/^(fixed|fixes|bug ?fixes|patch changes)\b/i.test(h)) return { kind: 'fixed', title: rest(/^(fixed|fixes|bug ?fixes|patch changes)/i) }
  if (/^(also|changed|changes|improved|improvements)\b/i.test(h)) return { kind: 'changed', title: rest(/^(also|changed|changes|improved|improvements)/i) }
  if (/^(added|new|features|minor changes)\b/i.test(h)) return { kind: 'added', title: rest(/^(added|new|features|minor changes)/i) }
  // A package or area heading, as in a first release: everything in it is new.
  return { kind: 'added', title: h }
}

export const releaseId = (version: string) => (/^unreleased$/i.test(version) ? 'unreleased' : `v${version.replace(/[^\w]+/g, '-')}`)

/**
 * Splits lines at headings of one level, skipping fenced code (a `##` in a
 * code block isn't a heading). Lines before the first heading are the lead.
 */
function splitAt(lines: string[], level: number): { lead: string[]; parts: { heading: string; lines: string[] }[] } {
  const marker = new RegExp(`^#{${level}}\\s+(.+?)\\s*$`)
  const lead: string[] = []
  const parts: { heading: string; lines: string[] }[] = []
  let fenced = false
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced
    const heading = !fenced && line.match(marker)
    if (heading) parts.push({ heading: heading[1]!, lines: [] })
    else if (!fenced && level === 2 && /^#\s/.test(line)) continue
    else (parts.at(-1)?.lines ?? lead).push(line)
  }
  return { lead, parts }
}

function parseRelease(heading: string, lines: string[]): Release {
  const date = heading.match(ISO_DATE)?.[1]
  const marked = !/^\s*unreleased\s*$/i.test(heading) && UNRELEASED_MARK.test(heading)
  const version =
    (marked ? heading.replace(UNRELEASED_MARK, '') : heading)
      .replace(ISO_DATE, '')
      .replace(/[[\]()]/g, '')
      .replace(/[\s–—-]+$/, '')
      .trim() || heading
  const { lead, parts } = splitAt(lines, 3)
  return {
    version,
    id: releaseId(version),
    date,
    unreleased: marked || /^unreleased$/i.test(version),
    intro: lead.join('\n').trim(),
    sections: parts.map((p) => ({ ...sectionKind(p.heading), body: p.lines.join('\n').trim() })),
  }
}

export function parseChangelog(markdown: string): Omit<Changelog, 'pending'> {
  const { lead, parts } = splitAt(markdown.replace(/\r\n?/g, '\n').split('\n'), 2)
  return { intro: lead.join('\n').trim(), releases: parts.map((p) => parseRelease(p.heading, p.lines)) }
}

/** The pending changesets' summaries, in file order. */
export function readChangesets(dir: string): string[] {
  let files: string[]
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'README.md')
  } catch {
    return []
  }
  return files.sort().map((f) =>
    readFileSync(join(dir, f), 'utf8')
      .replace(/^---\n[\s\S]*?\n---\n?/, '')
      .trim(),
  )
}

/** An Unreleased entry from changesets, for when CHANGELOG.md doesn't have one yet. */
export function releaseFromChangesets(summaries: string[]): Release | undefined {
  if (!summaries.length) return undefined
  const breaking = summaries.filter((s) => /^\*\*breaking\b/i.test(s))
  const rest = summaries.filter((s) => !breaking.includes(s))
  const list = (items: string[]) => items.map((s) => `- ${s.replace(/\n+/g, '\n  ')}`).join('\n')
  const sections: ChangelogSection[] = []
  if (breaking.length) sections.push({ kind: 'breaking', title: '', body: breaking.join('\n\n') })
  if (rest.length) sections.push({ kind: 'changed', title: '', body: list(rest) })
  return { version: 'Unreleased', id: 'unreleased', unreleased: true, intro: '', sections }
}

/** The repository root, from the docs app (the build runs in apps/docs). */
export const repoRoot = () => join(process.cwd(), '..', '..')

/** The changelog as the site shows it, read from the repository at build time. */
export function readChangelog(root = repoRoot()): Changelog {
  const parsed = parseChangelog(readFileSync(join(root, 'CHANGELOG.md'), 'utf8'))
  const summaries = readChangesets(join(root, '.changeset'))
  const releases = parsed.releases.filter((r) => r.sections.length || r.intro)
  if (!releases.some((r) => r.unreleased)) {
    const pending = releaseFromChangesets(summaries)
    if (pending) releases.unshift(pending)
  }
  return { intro: parsed.intro, releases, pending: summaries.length }
}

/** Markdown without its syntax, for feeds, search and structured data. */
export function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s*\|?\s*:?-{3,}.*$/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/[*_`]+/g, '')
    .replace(/\s*\|\s*/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim()
}
