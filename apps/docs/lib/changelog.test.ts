// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { changelogFeed } from './changelog-feed'
import { parseChangelog, plainText, readChangelog, sectionKind } from './changelog'

const SAMPLE = `# Changelog

Intro text.

## Unreleased

### Breaking: components moved

Move the imports:

\`\`\`md
## not a release
### not a section
\`\`\`

### Also

- **Faster.** Less code.

## 0.2.0 - 2026-10-02

### Fixed

- A bug.

## 0.1.0

The first release.

### \`@youj/react\`

- Components.
`

function repo(changelog: string, changesets: Record<string, string> = {}) {
  const root = mkdtempSync(join(tmpdir(), 'changelog-'))
  writeFileSync(join(root, 'CHANGELOG.md'), changelog)
  mkdirSync(join(root, '.changeset'))
  writeFileSync(join(root, '.changeset', 'README.md'), '# Changesets')
  for (const [name, body] of Object.entries(changesets)) writeFileSync(join(root, '.changeset', name), body)
  return root
}

describe('parseChangelog', () => {
  const { intro, releases } = parseChangelog(SAMPLE)

  it('splits releases at ## and sections at ###, ignoring headings inside code fences', () => {
    expect(intro).toBe('Intro text.')
    expect(releases.map((r) => r.version)).toEqual(['Unreleased', '0.2.0', '0.1.0'])
    expect(releases[0]!.sections.map((s) => s.kind)).toEqual(['breaking', 'changed'])
    expect(releases[0]!.sections[0]!.body).toContain('## not a release')
    expect(releases[0]!.sections[0]!.body).toContain('### not a section')
  })

  it('reads anchors, dates and the unreleased entry from the headings', () => {
    expect(releases.map((r) => r.id)).toEqual(['unreleased', 'v0-2-0', 'v0-1-0'])
    expect(releases.map((r) => r.date)).toEqual([undefined, '2026-10-02', undefined])
    expect(releases.map((r) => r.unreleased)).toEqual([true, false, false])
    expect(releases[2]!.intro).toBe('The first release.')
  })

  it('keeps the number of a version marked unreleased, and keeps it out of the feed', () => {
    for (const heading of ['0.3.0 (Unreleased)', '0.3.0 - unreleased', '0.3.0 — Unreleased']) {
      const [release] = parseChangelog(`## ${heading}\n\n### Added\n\n- One.\n`).releases
      expect(release).toMatchObject({ version: '0.3.0', id: 'v0-3-0', unreleased: true, date: undefined })
      expect(changelogFeed({ intro: '', pending: 0, releases: [release!] }, 'https://youj.test')).not.toContain('<item>')
    }
  })

  it('names a section by its kind and keeps the rest of the heading as its title', () => {
    expect(releases[0]!.sections[0]!.title).toBe('Components moved')
    expect(releases[0]!.sections[1]!.title).toBe('')
    expect(releases[2]!.sections[0]).toMatchObject({ kind: 'added', title: '`@youj/react`' })
  })
})

test('sectionKind understands the headings changesets writes', () => {
  expect(sectionKind('Major Changes').kind).toBe('breaking')
  expect(sectionKind('Minor Changes').kind).toBe('added')
  expect(sectionKind('Patch Changes').kind).toBe('fixed')
  expect(sectionKind('Improved')).toEqual({ kind: 'changed', title: '' })
})

describe('readChangelog', () => {
  it('counts pending changesets, and leaves an Unreleased entry the file has alone', () => {
    const log = readChangelog(repo(SAMPLE, { 'a.md': "---\n'@youj/react': minor\n---\n\nA change." }))
    expect(log.pending).toBe(1)
    expect(log.releases[0]!.sections[0]!.title).toBe('Components moved')
  })

  it('stands pending changesets in for the next release until the file describes it', () => {
    const log = readChangelog(
      repo('# Changelog\n\n## 0.1.0\n\n### Added\n\n- One.\n', {
        'a.md': "---\n'@youj/react': minor\n---\n\n**Breaking: moved.** Import from the entry.",
        'b.md': "---\n'youj': patch\n---\n\nFaster init.",
      }),
    )
    expect(log.releases.map((r) => r.version)).toEqual(['Unreleased', '0.1.0'])
    expect(log.releases[0]!.sections.map((s) => s.kind)).toEqual(['breaking', 'changed'])
    expect(log.releases[0]!.sections[1]!.body).toBe('- Faster init.')
  })

  it('reads the repository changelog: 0.1.0 is the first release, dated for launch day', () => {
    const log = readChangelog()
    const first = log.releases.find((r) => r.version === '0.1.0')
    expect(first).toMatchObject({ unreleased: false, date: '2026-10-20' })
    expect(first?.intro).toMatch(/one design language/)
    expect(first?.intro).toMatch(/- \*\*Tools:\*\*/)
    expect(JSON.stringify(first)).not.toMatch(/Paper|Bloom|Tide/)
  })
})

describe('the feed', () => {
  const feed = changelogFeed({ ...parseChangelog(SAMPLE), pending: 0 }, 'https://youj.test')

  it('lists released versions only, linking each anchor, with a date only where the file has one', () => {
    expect(feed).not.toContain('Unreleased')
    expect(feed).toContain('<guid isPermaLink="true">https://youj.test/changelog#v0-2-0</guid>')
    expect(feed.match(/<pubDate>/g)).toHaveLength(1)
    expect(feed).toContain('Fri, 02 Oct 2026 00:00:00 GMT')
  })

  it('escapes what it carries', () => {
    const escaped = changelogFeed({ intro: '', pending: 0, releases: [{ ...parseChangelog(SAMPLE).releases[1]!, intro: 'a <b> & c' }] }, 'https://youj.test')
    expect(escaped).toContain('a &lt;b&gt; &amp; c')
  })
})

test('plainText drops Markdown syntax and code blocks', () => {
  expect(plainText('**Bold** and `code`, a [link](https://x.test).\n\n```ts\nhidden()\n```')).toBe('Bold and code, a link.')
})
