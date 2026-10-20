import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { repoRoot } from '@/lib/changelog'
import { project } from '@/lib/project'
import { retargetRepo } from '@/lib/repo'

/* The security policy is the repository's SECURITY.md (the file GitHub shows
 * on the repository's Security tab), read at build time, so /security,
 * /security.md and the search index can't drift from it. Its `##` headings
 * become the page's sections. Its links to the repository follow lib/repo.ts. */

export interface PolicySection {
  id: string
  title: string
  body: string
}

export interface Policy {
  /** The `#` heading. */
  title: string
  /** Markdown before the first section. */
  intro: string
  sections: PolicySection[]
  /** The file as written. */
  source: string
}

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export function parsePolicy(source: string): Policy {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  let title = ''
  const intro: string[] = []
  const sections: { title: string; lines: string[] }[] = []
  for (const line of lines) {
    const h1 = !title && line.match(/^#\s+(.+?)\s*$/)
    const h2 = line.match(/^##\s+(.+?)\s*$/)
    if (h1) title = h1[1]!
    else if (h2) sections.push({ title: h2[1]!, lines: [] })
    else (sections.at(-1)?.lines ?? intro).push(line)
  }
  return {
    title,
    intro: intro.join('\n').trim(),
    sections: sections.map((s) => ({ id: slug(s.title), title: s.title, body: s.lines.join('\n').trim() })),
    source,
  }
}

export function readPolicy(root = repoRoot()): Policy {
  return parsePolicy(retargetRepo(readFileSync(join(root, 'SECURITY.md'), 'utf8')))
}

/** /security.md: SECURITY.md as written, its relative links pointing at the repository. */
export function securityMarkdown(): string {
  return readPolicy().source.replace(/\]\((?!https?:|\/|#)([^)]+)\)/g, (_, path: string) => `](${project.file(path)})`)
}
