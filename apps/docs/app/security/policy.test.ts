// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { roadmap, roadmapMarkdown } from '@/app/roadmap/roadmap'
import { repoRoot } from '@/lib/changelog'
import { privateAdvisory, securityEmail } from '@/lib/project'
import { repo } from '@/lib/repo'
import { parsePolicy, readPolicy, securityMarkdown } from './policy'

const manifest = (dir: string) => JSON.parse(readFileSync(join(repoRoot(), 'packages', dir, 'package.json'), 'utf8'))

describe('the security policy', () => {
  it('splits SECURITY.md into its sections, with ids for the page’s anchors', () => {
    const policy = parsePolicy('# Security policy\n\nIntro.\n\n## Supported versions\n\nLatest.\n\n## Reporting a vulnerability\n\nPrivately.\n')
    expect(policy.title).toBe('Security policy')
    expect(policy.intro).toBe('Intro.')
    expect(policy.sections).toEqual([
      { id: 'supported-versions', title: 'Supported versions', body: 'Latest.' },
      { id: 'reporting-a-vulnerability', title: 'Reporting a vulnerability', body: 'Privately.' },
    ])
  })

  it('reads the repository’s SECURITY.md, reporting by email and through GitHub', () => {
    const policy = readPolicy()
    expect(policy.sections.map((s) => s.id)).toEqual(
      expect.arrayContaining(['supported-versions', 'reporting-a-vulnerability', 'what-to-expect', 'scope', 'supply-chain']),
    )
    const reporting = policy.sections.find((s) => s.id === 'reporting-a-vulnerability')!.body
    expect(reporting).toContain(`[${securityEmail}](mailto:${securityEmail})`)
    expect(reporting).toContain(repo.newAdvisory)
    expect(reporting.indexOf('mailto:')).toBeLessThan(reporting.indexOf(privateAdvisory))
    expect(policy.source.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/gi)).toEqual([securityEmail, securityEmail])
  })

  it('points the Markdown twin’s relative links at the repository', () => {
    const md = securityMarkdown()
    expect(md).toContain(`](${repo.file('LICENSE')})`)
    expect(md).not.toMatch(/\]\((?!https?:|\/|#)/)
  })

  // What SECURITY.md says about the packages, held to the manifests.
  it('stays true: no install scripts, and the CLI and MCP server keep their dependencies as described', () => {
    for (const dir of ['core', 'motion', 'ui', 'icons', 'sound', 'cli', 'mcp']) {
      expect(Object.keys(manifest(dir).scripts ?? {}).filter((s) => /^(pre|post)?install$/.test(s)), dir).toEqual([])
    }
    expect(Object.keys(manifest('core').dependencies ?? {}).sort()).toEqual(['clsx', 'tailwind-merge'])
    expect(manifest('motion').dependencies ?? {}).toEqual({})
    expect(Object.keys(manifest('cli').dependencies ?? {})).toEqual(['@clack/prompts'])
    expect(manifest('mcp').dependencies ?? {}).toEqual({})
  })
})

describe('the roadmap', () => {
  const stages = roadmap()

  it('has the 0.1 summary, then now, next, later and exploring, as themes with no dates', () => {
    expect(stages.map((s) => s.id)).toEqual(['shipped', 'now', 'next', 'later', 'exploring'])
    expect(stages[2]!.items.map((i) => i.id)).toEqual(['growing', 'solidifying', 'ai'])
    expect(stages[4]!.lede).toMatch(/^Not promised/)
    expect(JSON.stringify(stages)).not.toMatch(/\b20\d\d\b|\bQ[1-4]\b/)
  })

  it('renders as Markdown with absolute links', () => {
    const md = roadmapMarkdown()
    expect(md).toMatch(/^# Youj roadmap/)
    expect(md).toContain('## Next')
    expect(md).toContain('## Exploring')
    expect(md).toContain('/discussions')
    expect(md).not.toMatch(/\]\(\//)
  })
})
