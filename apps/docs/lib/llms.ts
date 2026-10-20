import { kitNameRows } from './kit-names'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type * as PageTree from 'fumadocs-core/page-tree'
import { durations, easings, springs, staggers } from '@youj/core/lib/youj/tokens'
import { pageMarkdown, stackedInstall, type MarkdownContext } from './markdown'
import { faq } from '@/app/faq/questions'
import { blockDoc, blockUsage } from './block-usage'
import { componentDocs, componentsIn } from './props'
import { installInfo, registryItems } from './registry'
import { registryUrl, siteUrl } from './site'
import { source } from './source'
import { block } from './showcase'
import { REACT, TAILWIND } from './support'

/* The docs for machines: /llms.txt (an index), /llms-full.txt (everything)
 * and /docs/<slug>.md (one page), all rendered at build time through
 * lib/markdown.ts, the renderer the MCP server's index uses too. */

type Page = ReturnType<typeof source.getPages>[number]

export function markdownContext(): MarkdownContext {
  const registry = registryUrl()
  return {
    site: siteUrl(),
    registry,
    example(name) {
      try {
        return readFileSync(join(process.cwd(), 'examples', `${name}.tsx`), 'utf8')
      } catch {
        return undefined
      }
    },
    props: (name) => componentDocs()[name],
    install: (name, imports) => installInfo(name, componentsIn, imports),
    // A story-only showcase (the landing page) has no item of its own: it installs as the blocks it stacks.
    storyInstall(slug) {
      if (registryItems().has(slug)) return installInfo(slug, componentsIn)
      const stack = block(slug)?.stack
      return stack?.length ? stackedInstall(stack) : undefined
    },
    block(slug) {
      const doc = blockDoc(slug)
      return doc && { usage: blockUsage(doc), props: { name: doc.component, file: doc.path, props: doc.props }, copy: Object.keys(doc.copy ?? {}) }
    },
    kitNames: kitNameRows,
    tokens: { durations, easings, springs, staggers },
  }
}

/** Where a page's Markdown lives: /docs → /docs.md, /docs/components/button → /docs/components/button.md. */
export const markdownUrl = (url: string) => `${url}.md`

export async function renderPage(page: Page, ctx = markdownContext()): Promise<string> {
  const raw = await page.data.getText('raw')
  return pageMarkdown({ title: page.data.title ?? page.url, description: page.data.description, url: page.url }, raw, ctx)
}

const intro = () => `Youj: Accessible components, animated icons, illustrations and themes that move together. It is a React UI kit with accessible components on shadcn and Base UI (\`@youj/react\`), motion tokens, primitives, animated icons that morph between states and brand marks (\`@youj/motion\`, \`@youj/icons\`), opt-in interface sounds the components cue as they move (\`@youj/sound\`), themes with contrast checked against WCAG AA, isometric illustrations drawn from the theme (\`@youj/illustrations\`), and the same source to copy in with \`npx youj add\`. It needs React ${REACT} and Tailwind CSS ${TAILWIND}. Agents: install with \`npx youj add <item>\` (or the packages), never \`npx shadcn add\`.`

/** Which import path: what each thing is imported from as a package and once `youj add` has copied it in (the paths the CLI writes). */
const IMPORT_PATHS = [
  '## Which import path',
  '',
  '| | From the packages | Copied in with `npx youj add` |',
  '| --- | --- | --- |',
  "| Components | `import { Button } from '@youj/react'` | `import { Button } from '@/components/ui/button'` |",
  "| Motion | `import { Reveal } from '@youj/motion'` | `import { Reveal } from '@/components/youj/motion/reveal'` |",
  "| Provider and themes | `import { YoujProvider, basalt } from '@youj/core'` | `import { YoujProvider } from '@/lib/youj/provider'` and `import { basalt } from '@/lib/youj/theme'` |",
].join('\n')

/** /llms.txt: the llms.txt convention's index, linking each page's Markdown. */
export function llmsIndex(): string {
  const site = siteUrl()
  const tree = source.getPageTree()
  const lines = [`# Youj`, '', `> ${intro()}`, '']
  lines.push(
    `Set up with \`npx youj init\`. AI coding tools can use the Youj MCP server (\`npx @youj/mcp\`) to search components and icons, suggest icon morphs, build themes and install items: see [AI & MCP](${site}/docs/mcp.md). Every page below is Markdown; [llms-full.txt](${site}/llms-full.txt) has them all in one file.`,
    '',
    IMPORT_PATHS,
    '',
  )
  const item = (node: PageTree.Item, depth: number) => {
    const page = source.getPage(node.url.replace(/^\/docs\/?/, '').split('/').filter(Boolean))
    const description = page?.data.description ? `: ${page.data.description}` : ''
    // The page's own title: the sidebar calls a section's index "Overview", which says nothing out of context.
    lines.push(`${'  '.repeat(depth)}- [${page?.data.title ?? (typeof node.name === 'string' ? node.name : '')}](${site}${markdownUrl(node.url)})${description}`)
  }
  const visit = (nodes: PageTree.Node[], depth: number) => {
    for (const node of nodes) {
      if (node.type === 'separator') {
        if (depth === 0) lines.push('', `## ${typeof node.name === 'string' ? node.name : ''}`, '')
      } else if (node.type === 'page') {
        // Links out of the docs (Create) are listed below.
        if (node.url.startsWith('/docs')) item(node, depth)
      } else {
        if (node.index) item(node.index, depth)
        else lines.push(`${'  '.repeat(depth)}- ${typeof node.name === 'string' ? node.name : ''}`)
        visit(node.children, depth + 1)
      }
    }
  }
  visit(tree.children, 0)
  lines.push(
    '',
    '## Create',
    '',
    `Build the app frame (sidebar, top bar, account and search) at ${site}/create, add the in-app screens it holds (dashboards, tables, settings, billing, an assistant…), each a page of its nav, then take it home as code with \`npx youj create '<link>'\`.`,
  )
  lines.push(
    '',
    '## Project',
    '',
    `- [FAQ](${site}/faq.md): licence, shadcn/ui, React and Next.js support, bundle size, reduced motion, theming, icons, accessibility, i18n and help.`,
    `- [Changelog](${site}/changelog): every release, with the migration for each breaking change; RSS at ${site}/changelog.xml.`,
    `- [About & support](${site}/about): the principles, the packages, credits, the maintainer, and where to report bugs and ask questions.`,
    `- [Roadmap](${site}/roadmap.md): a summary of 0.1 and high-level themes for now, next, later and being explored, without dates.`,
    `- [Security](${site}/security.md): supported versions, how to report a vulnerability privately, the supply chain, and what the CLI, MCP server and sound do on your machine.`,
  )
  lines.push(
    '',
    '## Optional',
    '',
    `- [Components, short](${site}/llms-small.txt): every component's import, one-line description and main props in one small file; ${site}/llms-full.txt has every page.`,
    `- [Icons explorer](${site}/icons): every Youj icon, searchable by meaning, with the Morph Lab.`,
    `- [Illustrations explorer](${site}/illustrations): every isometric scene, searchable by name, category and tag, each installable on its own (\`npx youj add illustration-<id>\`) and downloadable as SVG or PNG.`,
    `- [Registry](${site}/r/registry.json): the registry index the Youj CLI reads.`,
  )
  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n')}\n`
}

/** /llms-full.txt: every docs page as Markdown, in sidebar order. */
export async function llmsFull(): Promise<string> {
  const ctx = markdownContext()
  const pages = await Promise.all(orderedPages().map((page) => renderPage(page, ctx)))
  return `# Youj documentation\n\n> ${intro()}\n\n${IMPORT_PATHS}\n\n${pages.join('\n---\n\n')}`
}

const SMALL_PROPS = 6

/** /llms-small.txt: each component's import, one line and its main props, a fraction of /llms-full.txt. */
export function llmsSmall(): string {
  const site = siteUrl()
  const docs = componentDocs()
  const lines = ['# Youj components', '', `> ${intro()}`, '', `Install with \`npx youj add <name>\` or import from the package. Full pages: ${site}/docs/components/<name>.md, or ${site}/llms-full.txt for everything.`, '']
  const items = [...registryItems().values()].filter((item) => item.type === 'registry:ui').sort((a, b) => a.name.localeCompare(b.name))
  for (const item of items) {
    const info = installInfo(item.name, componentsIn)
    if (!info.packageImport) continue
    const description = (item.description ?? '').replace(/\s+/g, ' ').trim()
    lines.push(`## ${item.title ?? item.name}`, '', `\`${info.packageImport}\`${description ? ` ${description}` : ''}`)
    const mainFile = item.files?.find((f) => f.path.endsWith(`/${item.name}.tsx`)) ?? item.files?.[0]
    const pascal = item.name.replace(/(^|-)(\w)/g, (_, __, c: string) => c.toUpperCase())
    const candidates = componentsIn(mainFile?.path ?? '').map((name) => docs[name]).filter((doc) => doc?.props.length)
    const main = candidates.find((doc) => doc?.name === pascal) ?? candidates[0]
    if (main) {
      const props = main.props.filter((prop) => prop.required || !(prop.deprecated || /^(on[A-Z]|aria-|data-|children$|className$|ref$|key$)/.test(prop.name)))
      lines.push('', `Props of \`${main.name}\`: ${props.slice(0, SMALL_PROPS).map((prop) => `\`${prop.name}${prop.required ? '' : '?'}: ${prop.values?.length ? prop.values.join(' | ') : prop.type}\``).join(', ')}`)
    }
    lines.push('')
  }
  return `${lines.join('\n').trimEnd()}\n`
}

/** Pages in the order the sidebar lists them. */
function orderedPages(): Page[] {
  const urls: string[] = []
  const visit = (nodes: PageTree.Node[]) => {
    for (const node of nodes) {
      if (node.type === 'page') urls.push(node.url)
      else if (node.type === 'folder') {
        if (node.index) urls.push(node.index.url)
        visit(node.children)
      }
    }
  }
  visit(source.getPageTree().children)
  const pages = source.getPages()
  const byUrl = new Map(pages.map((p) => [p.url, p]))
  const ordered = urls.flatMap((url) => byUrl.get(url) ?? [])
  return [...ordered, ...pages.filter((p) => !urls.includes(p.url))]
}

/** /faq.md: the FAQ as Markdown, from the same source as /faq, with absolute links. */
export function faqMarkdown(): string {
  const site = siteUrl()
  const lines = ['# Youj FAQ', '']
  for (const group of faq()) {
    lines.push(`## ${group.title}`, '')
    for (const q of group.questions) {
      lines.push(`### ${q.question}`, '', q.answer.replace(/\]\(\//g, `](${site}/`).replace(/\]\(#/g, `](${site}/faq#`), '')
    }
  }
  return `${lines.join('\n').trimEnd()}\n`
}
