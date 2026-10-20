// node --test scripts/api-snapshot.test.mjs (part of pnpm check:api)
import assert from 'node:assert/strict'
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { changedLines, duplicateNames, exportedNames, packageEntries, run, snapshotPackage } from './api-snapshot.mjs'

const fixture = join(import.meta.dirname, '__fixtures__/api-snapshot')
const temps = []
after(() => temps.forEach((dir) => rmSync(dir, { recursive: true, force: true })))

/** A copy of the fixture package inside a fresh root, so a test can edit it. */
function workspace() {
  const root = mkdtempSync(join(tmpdir(), 'youj-api-'))
  temps.push(root)
  const pkg = join(root, 'packages/kit')
  cpSync(fixture, pkg, { recursive: true })
  return { root, pkg }
}

test('lists the published entries, expanding wildcards and skipping CSS and tests', () => {
  const entries = packageEntries(fixture).map((e) => e.entry)
  assert.deepEqual(entries, ['@fixture/kit', '@fixture/kit/extra', '@fixture/kit/locales/de'])
})

test('records each export with its signature, defaults and own props', () => {
  const text = snapshotPackage(fixture)
  assert.match(text, /^## @fixture\/kit$/m)
  assert.match(text, /function Badge\(\{ label, tone = 'neutral' \}: BadgeProps\): string;/)
  assert.match(text, /props: \{ color\?: string \/\* deprecated \*\/; label: string; tone\?: 'neutral' \| 'accent' \}/)
  assert.match(text, /function formatCount\(n: number, unit = 'item'\): string;/)
  assert.match(text, /const space: \{ md; sm \}/)
  assert.match(text, /type Extra = \{\s+id: string;\s+\};/)
  assert.match(text, /const de: \{ close \}/)
  // Exported from a module but not from an entry: not public.
  assert.doesNotMatch(text, /badgeClass/)
  // Comments don't churn the snapshot.
  assert.doesNotMatch(text, /The badge's text/)
})

test('the check passes on a current snapshot and fails when the API changes', () => {
  const { root, pkg } = workspace()
  const packages = [pkg]
  assert.equal(run({ root, packages }).length, 1, 'first run writes the snapshot')
  assert.ok(existsSync(join(root, 'api/fixture-kit.api.md')))
  assert.deepEqual(run({ root, packages, check: true }), [])

  // A comment-only edit isn't an API change.
  const badge = join(pkg, 'src/badge.ts')
  writeFileSync(badge, readFileSync(badge, 'utf8').replace("/** The badge's text. */", '/** What the badge says. */'))
  assert.deepEqual(run({ root, packages, check: true }), [])

  // A changed default and a removed prop are.
  writeFileSync(badge, readFileSync(badge, 'utf8').replace("tone = 'neutral'", "tone = 'accent'").replace(/\s+\/\*\* @deprecated[^\n]+\n\s+color\?: string/, ''))
  const stale = run({ root, packages, check: true })
  assert.equal(stale.length, 1)
  const lines = changedLines(stale[0].before, stale[0].after)
  assert.ok(lines.some((l) => l.startsWith('-') && l.includes("tone = 'neutral'")))
  assert.ok(lines.some((l) => l.startsWith('+') && l.includes("tone = 'accent'")))
  // The check doesn't write; an update does, and then it's current again.
  assert.equal(readFileSync(join(root, 'api/fixture-kit.api.md'), 'utf8'), stale[0].before)
  run({ root, packages })
  assert.deepEqual(run({ root, packages, check: true }), [])
})

test('reads the names a snapshot exports, whatever the declaration', () => {
  const text = '## @a/x\n\n```ts\ntype Mode = \'a\' | \'b\';\n\nfunction Badge({ label }: P): string;\n  props: { label: string }\n\nconst space: { md; sm }\n\ninterface Props {\n    id: string;\n}\n```'
  assert.deepEqual([...exportedNames(text)].sort(), ['Badge', 'Mode', 'Props', 'space'])
})

test('a name exported by two packages is a clash, unless it is allowed', () => {
  const snapshots = { '@a/core': 'function cn(): string;\n\ntype Mode = 1;', '@a/react': 'function cn(): string;\n\nfunction Button(): null;', '@a/motion': 'type Mode = 2;' }
  assert.deepEqual(duplicateNames(snapshots, new Set()), [
    { name: 'Mode', packages: ['@a/core', '@a/motion'] },
    { name: 'cn', packages: ['@a/core', '@a/react'] },
  ])
  assert.deepEqual(duplicateNames(snapshots, new Set(['cn', 'Mode'])), [])
})
