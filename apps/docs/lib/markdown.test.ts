// @vitest-environment node
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { durations, easings, springs, staggers } from '@youj/core/lib/youj/tokens'
import { frontmatter, installMarkdown, mdxToMarkdown, stackedInstall, type MarkdownContext } from './markdown'
import { repo } from './repo'

const app = join(import.meta.dirname, '..')
const content = join(app, 'content/docs')

function context(unknown: string[] = [], missing: string[] = []): MarkdownContext {
  return {
    site: 'https://k.dev',
    registry: 'https://k.dev/r',
    example(name) {
      const file = join(app, 'examples', `${name}.tsx`)
      if (!existsSync(file)) return void missing.push(name)
      return readFileSync(file, 'utf8')
    },
    props: (name) => ({ name, props: [{ name: 'size', type: "'sm' | 'md'", required: false, default: "'md'", description: 'How big.' }] }),
    install: (name) => ({
      packageCommand: 'pnpm add @youj/react',
      packageImport: `import { X } from '@youj/react'`,
      registryCommand: `npx youj add ${name}`,
      registryDeps: [],
    }),
    tokens: { durations, easings, springs, staggers },
    unknown: (name) => void unknown.push(name),
  }
}

describe('mdxToMarkdown, install commands and framework tabs', () => {
  it('gives an install command in every package manager, and every framework tab under its name', () => {
    const md = mdxToMarkdown(
      `---
title: Demo
---

<PackageInstall command="pnpm add -D tailwindcss" />

<FrameworkTabs>
<FrameworkTab label="Vite">

Add the plugin.

</FrameworkTab>
</FrameworkTabs>
`,
      context(),
    )
    expect(md).toContain('```bash\npnpm add -D tailwindcss\nnpm install -D tailwindcss\nyarn add -D tailwindcss\nbun add -d tailwindcss\n```')
    expect(md).toContain('**Vite**\n\nAdd the plugin.')
  })
})

describe('mdxToMarkdown', () => {
  it('renders the docs components as Markdown', () => {
    const md = mdxToMarkdown(
      `---
title: Demo
---

<ComponentPreview name="button/demo" height={300} />

Use it for [actions](/docs/components/button), not \`<a>\` links.

<InstallTabs name="button" />

<MotionSpec rows={[{ moment: 'Press', note: 'scales to 0.97', duration: 'instant', ease: 'standard' }]} reduced="No scale." />

<PropsTable name="Button" />

<Callout type="warning">Keep one per view.</Callout>

<Cards>
  <Card title="Toggle" href="/docs/components/toggle">A button that stays pressed.</Card>
</Cards>

<Snippet code="npx youj add reveal" />

<ThemeBuilder />
`,
      context(),
    )
    expect(md).toContain('```tsx\n')
    expect(md).toContain('[actions](https://k.dev/docs/components/button), not `<a>` links.')
    expect(md).toContain('pnpm add @youj/react')
    expect(md).toContain('npx youj add button')
    expect(md).toContain('| Press | `duration.instant`, `ease.standard` | 80ms; cubic-bezier(0.2, 0, 0, 1) | scales to 0.97 |')
    expect(md).toContain('**Reduced motion:** No scale.')
    expect(md).toContain("| `size` | `'sm' \\| 'md'` | `'md'` | How big. |")
    expect(md).toContain('> **Warning:** Keep one per view.')
    expect(md).toContain('- [Toggle](https://k.dev/docs/components/toggle): A button that stays pressed.')
    expect(md).toContain('npx youj add reveal')
    expect(md).not.toMatch(/ThemeBuilder|title: Demo/)
  })

  it('renders a page of stories as its examples, each under its name, then its tabs', () => {
    const md = mdxToMarkdown(
      `<ComponentStories>

<Story id="demo" label="Demo">

<ComponentPreview name="button/demo" />

A row of buttons.

</Story>

<Examples label="Get started">

<Example id="installation-usage" label="Installation & usage">

## Installation & usage

<InstallTabs name="button" noImport />

</Example>

<Example id="description" label="Description">

## Description

<StoryDescription />

</Example>

<Example id="code" label="Code">

## Code

<StoryCode />

</Example>

</Examples>

</ComponentStories>`,
      context(),
    )
    expect(md).toMatch(/^## Examples\n\n### Demo\n\n```tsx\n[\s\S]*```\n\nA row of buttons\.\n\n## Installation & usage\n\n```bash\npnpm add @youj\/react\n```\n\nFor an app already set up with `npx youj init`[^`]*`@youj\/core`[^`]*`@youj\/motion`[^`]*`motion`[^\n]*\n\nOr copy[^`]*```bash\nnpx youj add button\n```\n\n## Description\n\nEach example's description is under Examples\.\n\n## Code\n\nEach example's code is under Examples\.$/)
  })

  it('prints a copy-in-only item without a package route', () => {
    const md = installMarkdown({ registryCommand: 'npx youj add marketing-cta-banner', registryImport: "import { CtaBanner } from '@/blocks/marketing/cta-banner'", registryDeps: [] })
    expect(md).toContain('npx youj add marketing-cta-banner')
    expect(md).toContain("import { CtaBanner } from '@/blocks/marketing/cta-banner'")
    expect(md).not.toMatch(/pnpm add|@youj\/react/)
  })

  it('leaves code blocks alone, JSX and all', () => {
    const md = mdxToMarkdown('```tsx\n<Dialog>\n  <DialogContent />\n</Dialog>\n```', context())
    expect(md).toBe('```tsx\n<Dialog>\n  <DialogContent />\n</Dialog>\n```')
  })

  it('resolves repo: links to the repository', () => {
    const md = mdxToMarkdown('[Open an issue](repo:issues/new), [guide](repo:file/CONTRIBUTING.md#x), [home](/docs)', context())
    expect(md).toBe(`[Open an issue](${repo.newIssue}), [guide](${repo.file('CONTRIBUTING.md#x')}), [home](https://k.dev/docs)`)
  })

  it('renders every docs page with no component it doesn’t know and no missing example', () => {
    const unknown: string[] = []
    const missing: string[] = []
    const ctx = context(unknown, missing)
    const files = (readdirSync(content, { recursive: true }) as string[]).filter((f) => f.endsWith('.mdx'))
    for (const file of files) {
      const raw = readFileSync(join(content, file), 'utf8')
      const md = mdxToMarkdown(raw, ctx)
      expect(frontmatter(raw).data.title, file).toBeTruthy()
      // Outside code, no component tag survives.
      const prose = md.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '')
      expect(prose, file).not.toMatch(/<(ComponentPreview|InstallTabs|PropsTable|MotionSpec|Cards?|Callout|Steps?|Reference|Snippet)\b/)
    }
    expect([...new Set(unknown)]).toEqual([])
    expect(missing).toEqual([])
  })
})

describe('BlockStories', () => {
  it('writes each story as a section with its block’s install, usage, props and strings', () => {
    const ctx: MarkdownContext = {
      ...context(),
      block: () => ({ usage: 'export const A = 1', props: { name: 'A', props: [{ name: 'size', type: 'string', required: false, description: 'How big.' }] }, copy: ['title'] }),
    }
    const md = mdxToMarkdown(
      '<BlockStories>\n<BlockStory id="a" label="Bento" block="marketing-feature-bento" story="Default">\nA grid of tiles.\n</BlockStory>\n<Examples label="Get started"><Example id="x" label="X"><BlockInstall /><BlockCode /></Example></Examples>\n## Reference\n<BlockReference />\n</BlockStories>',
      ctx,
    )
    expect(md).toContain('## Blocks')
    expect(md).toContain('### Bento\n\nA grid of tiles.')
    expect(md).toContain('npx youj add marketing-feature-bento')
    expect(md).toContain('export const A = 1')
    expect(md).toContain('| `size` |')
    expect(md).toContain('`copy` takes `title`')
    expect(md).not.toMatch(/<Block/)
  })

  it('gives a composition with no item of its own the install of the blocks it stacks', () => {
    const ctx: MarkdownContext = { ...context(), storyInstall: () => stackedInstall(['marketing-navbar', 'marketing-hero-centered']) }
    const md = mdxToMarkdown('<BlockStories>\n<BlockStory id="a" label="Landing" block="marketing-landing" story="Default">\nA page.\n</BlockStory>\n</BlockStories>', ctx)
    expect(md).toContain('npx youj add marketing-navbar marketing-hero-centered')
  })
})
