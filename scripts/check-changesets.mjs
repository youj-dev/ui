// Part of `pnpm verify`. Two rules about changesets:
// 1. While the packages are 0.x, no pending changeset may ask for `major`: changesets would
//    publish 1.0.0. A breaking change is a `minor`, everything else a `patch` (RELEASING.md).
//    Going to 1.0 is a deliberate step: its changeset says major, and its checks run with
//    YOUJ_ALLOW_MAJOR=1.
// 2. A change to the public API snapshot (api/) needs a changeset added since the base branch,
//    and one that removes or changes something needs at least a `minor`, never a `patch`. A catalogue that
//    only gained entries (`readonly [60 items]` to `readonly [62 items]`) is an addition.
//    The base is YOUJ_CHANGESET_BASE, else origin/main in CI and the local main branch elsewhere; where it can't be resolved (a
//    shallow clone, no remote) rule 2 is skipped with a note. CI fetches full history.
// Until 0.1.0 is released (no dated "## 0.1.0" heading in CHANGELOG.md) the root CHANGELOG describes everything, and
// there may be no changeset at all: one would move the first publish past 0.1.0. Rule 2 waits until then.
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { hasDatedHeading } from './check-changelog.mjs'

const root = join(import.meta.dirname, '..')

/** Bump levels asked by a changeset file's front matter, e.g. ['minor', 'patch']. */
export function bumps(text) {
  const front = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ''
  return [...front.matchAll(/:\s*(major|minor|patch)\s*$/gm)].map((m) => m[1])
}

const TUPLE = /readonly \[(\d+) items\]/

/** A line's tuple as the line with its count blanked and the count, or null: `const a: readonly [60 items]` is `const a: readonly [# items]` and 60. */
const tupleOf = (line) => {
  const match = line.match(TUPLE)
  return match && { shape: line.replace(TUPLE, 'readonly [# items]'), items: Number(match[1]) }
}

/**
 * Whether a diff of api/ snapshots takes anything away: a removed or changed line, not only added ones. A tuple
 * that only gained items (the miniatures catalogue gaining two) takes nothing away: the same line, more items.
 */
export function removesApi(diff) {
  const lines = diff.split('\n')
  const added = lines.filter((line) => line.startsWith('+')).map((line) => tupleOf(line.slice(1)))
  return lines
    .filter((line) => line.startsWith('-') && !line.startsWith('---'))
    .some((line) => {
      const before = tupleOf(line.slice(1))
      const at = before ? added.findIndex((after) => after?.shape === before.shape && after.items > before.items) : -1
      if (at === -1) return true
      added.splice(at, 1) // each added tuple answers for one removed line
      return false
    })
}

/** Problems with the API change and the changesets added alongside it; empty when fine. */
export function apiProblems({ apiChanged, removes, added }) {
  if (!apiChanged) return []
  if (!added.length) return ['api/ changed but no changeset was added. Run `pnpm changeset` (an addition is a patch, a removal or change a minor while 0.x).']
  if (removes && !added.some((text) => bumps(text).some((b) => b !== 'patch')))
    return ['api/ lost or changed an export, prop or default, which is a breaking change: its changeset must say minor (while 0.x), not patch.']
  return []
}

/** Whether the first release (0.1.0) is still being written up in CHANGELOG.md, so no changeset may exist yet. */
export function beforeFirstRelease(version, changelog) {
  return version === '0.1.0' && !hasDatedHeading(changelog, version)
}

function main() {
  const { version } = JSON.parse(readFileSync(join(root, 'packages/core/package.json'), 'utf8'))
  const dir = join(root, '.changeset')
  const pending = readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'README.md')
  const problems = []

  if (beforeFirstRelease(version, readFileSync(join(root, 'CHANGELOG.md'), 'utf8'))) {
    if (pending.length) {
      console.error(
        `The first publish is exactly ${version}, and these changesets would move it past that:\n${pending.map((f) => `  .changeset/${f}`).join('\n')}\nDelete them, and describe the change in CHANGELOG.md's ${version} section instead (RELEASING.md).`,
      )
      process.exit(1)
    }
    console.log(`changesets: ok (${version}, before the first release: none pending, api/ needs none)`)
    return
  }

  if (version.startsWith('0.') && !process.env.YOUJ_ALLOW_MAJOR) {
    const majors = pending.filter((f) => bumps(readFileSync(join(dir, f), 'utf8')).includes('major'))
    if (majors.length)
      problems.push(`These changesets ask for a major bump, which would publish 1.0.0 (the packages are ${version}):\n${majors.map((f) => `  .changeset/${f}`).join('\n')}\nWhile 0.x, a breaking change is a minor. Change "major" to "minor" (see RELEASING.md).`)
  }

  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  const base = process.env.YOUJ_CHANGESET_BASE || (process.env.CI ? 'origin/main' : 'main')
  let note = ''
  try {
    const mergeBase = git('merge-base', base, 'HEAD').trim()
    // Committed changes since the branch point, plus what's still uncommitted.
    const apiDiff = git('diff', mergeBase, '--', 'api/')
    const added = git('diff', '--name-only', '--diff-filter=A', mergeBase, '--', '.changeset/')
      .split('\n')
      .concat(git('ls-files', '--others', '--exclude-standard', '.changeset/').split('\n'))
      .filter((f) => f.endsWith('.md') && !f.endsWith('README.md'))
      .map((f) => readFileSync(join(root, f), 'utf8'))
    problems.push(...apiProblems({ apiChanged: apiDiff.trim() !== '', removes: removesApi(apiDiff), added }))
  } catch {
    note = `; api/ vs changesets not checked (cannot resolve ${base})`
  }

  if (problems.length) {
    console.error(problems.join('\n\n'))
    process.exit(1)
  }
  console.log(`changesets: ok (${version})${note}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
