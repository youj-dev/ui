import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ComponentProps } from 'react'
import { getHighlighter } from 'fumadocs-core/highlight'
import type { InstallTabsView } from '@/components/docs/install-tabs-view'
import { installedFiles, stackInstall } from '@/components/showcase/install-parts'
import { itemHref } from '@/lib/block-docs'
import { blockDoc, blockUsage, frameUsage } from '@/lib/block-usage'
import { codeHighlight, youjCodeTheme } from '@/lib/code-theme'
import { componentsIn, type ComponentDoc } from '@/lib/props'
import { installInfo } from '@/lib/registry'
import { block, type Block, type ShowcaseLink } from '@/lib/showcase'
import { fillUrls } from '@/lib/site'

/* A block's Get started and Reference on a block page, as data:
 * its install, its usage snippet, its props, `copy` keys and what it's built
 * from. A page carries its first story's; the others are published as JSON
 * (app/code/ref, codeUrl.ref) and fetched when a reader picks the story, so a
 * page of twenty stories doesn't carry twenty references.
 * components/docs/block-ref-view.tsx draws it. */

/** Highlighted code: the `<pre>`'s classes and its inner markup, drawn in the docs' code frame. */
export interface RefCode {
  title: string
  className: string
  html: string
}

/** An item's props table and the shapes its data takes, each a table. */
export interface RefProps {
  component?: ComponentDoc
  types: ComponentDoc[]
}

export interface BlockRefData {
  /** A stack's one `youj add`, or the install field's commands. */
  install: { stack: RefCode } | { tabs: ComponentProps<typeof InstallTabsView> }
  /** What the CLI writes: a stack's block count, a block's file. */
  note: { stack: number } | { file: string }
  /** The usage that feeds it your data, through the frame for a sidebar; `demo` when it takes none. */
  usage?: { frame: boolean; code: RefCode } | { demo: true }
  props?: { summary: string; own: RefProps; frame?: RefProps }
  strings?: { summary: string; keys: string[] }
  builtFrom?: { summary: string; components: ShowcaseLink[]; builtOn: ShowcaseLink[]; stacked: boolean }
  /** A block that takes no props or strings. */
  demo: boolean
}

/** The frame's own types a sidebar's data comes in as (shell/model.ts): the nav, its items, the trail. */
const FRAME_TYPES = ['FrameNavSection', 'FrameNavItem']

/** A frame's sidebar: its data comes in through AppFrame, so its usage is the frame it draws. The frame's other parts show their own. */
const isSidebar = (b: Block) => b.level === 'frame' && b.category === 'sidebars'

/** Code highlighted as the docs' Snippet does it, split into the `<pre>`'s classes and its inner markup. */
async function code(text: string, lang: 'tsx' | 'bash', title: string): Promise<RefCode> {
  const highlighter = await getHighlighter('js', { langs: [lang], themes: [youjCodeTheme] })
  const html = highlighter.codeToHtml(fillUrls(text), { lang, ...codeHighlight })
  const pre = /^<pre class="([^"]*)" tabindex="0">([\s\S]*)<\/pre>$/.exec(html)
  if (!pre) throw new Error(`Unexpected highlighted markup for ${title}: ${html.slice(0, 80)}`)
  return { title, className: pre[1]!, html: pre[2]! }
}

export async function blockRef(b: Block): Promise<BlockRefData> {
  const stack = 'stack' in b ? b.stack : undefined
  const own = !stack && b.registry ? b.registry : undefined
  const doc = own ? blockDoc(own) : undefined
  const frame = isSidebar(b)
  const shell = doc && frame ? blockDoc('frame-shell') : undefined
  const files = installedFiles(b)
  const copyKeys = Object.keys(doc?.copy ?? {})
  const builtOn = b.blocks.flatMap((name) => {
    const dep = block(name)
    return dep ? [{ name, title: dep.title, url: itemHref(dep) ?? '' }] : []
  })

  let usage: BlockRefData['usage']
  if (doc) {
    const text = frame ? frameUsage(doc) : blockUsage(doc)
    usage = text
      ? { frame, code: await code(text, 'tsx', frame ? 'app-shell.tsx' : `${doc.component.replace(/^[A-Z]/, (c) => c.toLowerCase())}-view.tsx`) }
      : { demo: true }
  }

  let install: BlockRefData['install']
  if (stack) install = { stack: await code(stackInstall(stack).command, 'bash', 'Install') }
  else {
    const info = installInfo(b.registry ?? b.slug, componentsIn)
    install = { tabs: { packageCommand: info.packageCommand, registryCommand: info.registryCommand, registryDeps: info.registryDeps, copyIn: info.copyIn } }
  }

  const hasProps = !!doc && (doc.props.length > 0 || doc.types.length > 0 || !!shell)
  return {
    install,
    note: stack ? { stack: stack.length } : { file: files[0]?.path ?? '' },
    usage,
    props: hasProps
      ? {
          summary: `${doc.props.length} props${doc.types.length ? `, ${doc.types.length} types` : ''}`,
          own: { component: doc.props.length > 0 ? { name: doc.component, file: doc.path, props: doc.props } : undefined, types: doc.types },
          frame: shell && {
            component: shell.props.length > 0 ? { name: shell.component, file: shell.path, props: shell.props } : undefined,
            types: shell.types.filter((type) => FRAME_TYPES.includes(type.name)),
          },
        }
      : undefined,
    strings: copyKeys.length > 0 ? { summary: `${copyKeys.length} keys for copy`, keys: copyKeys } : undefined,
    builtFrom:
      b.components.length > 0 || builtOn.length > 0
        ? { summary: `${b.components.length} components${builtOn.length ? `, ${builtOn.length} blocks` : ''}`, components: b.components, builtOn, stacked: !!stack }
        : undefined,
    demo: !hasProps && !copyKeys.length,
  }
}

const DOCS = join(/*turbopackIgnore: true*/ process.cwd(), 'content/docs')

/** Every block a `<BlockStory>` shows, for app/code/ref to publish. */
export function blockRefItems(): Block[] {
  const names = new Set<string>()
  for (const file of readdirSync(DOCS, { recursive: true }) as string[]) {
    if (!file.endsWith('.mdx')) continue
    for (const [, name] of readFileSync(join(DOCS, file), 'utf8').matchAll(/<BlockStory\b[^>]*\bblock="([^"]+)"/g)) names.add(name!)
  }
  return [...names].sort().flatMap((name) => block(name) ?? [])
}
