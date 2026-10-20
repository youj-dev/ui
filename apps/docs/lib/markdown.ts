/* A docs page as plain Markdown, for machines: /docs/<slug>.md, /llms-full.txt
 * and the MCP server's index (packages/mcp) all render pages through this.
 *
 * It reads the MDX source and renders each component the way a reader would
 * want it as text: a preview becomes its example's code, <InstallTabs> the
 * install commands, <PropsTable> a props table, <MotionSpec> the token table.
 * Visual-only embeds (the theme builder, the icon gallery) drop out. What each
 * needs comes in through the context, so this file imports only plain data and runs
 * anywhere: in the Next build, and in plain Node for the MCP index. */

import { cueInfo, lab } from '@youj/sound/lab'
import { copyInSentence, PACKAGE_SETUP, type CopyIn } from './copy-in'
import { AI_CLIENTS, MCP_CONNECT, MCP_EDITORS } from './mcp-config'
import { doDontMarkdown, durationBandsMarkdown, type DoDontId } from './motion-guidelines'
import { forManager, PACKAGE_MANAGERS } from './package-manager'
import { resolveRepoLinks } from './repo'
import { rolesMarkdown } from './theme-roles'
import { tokenClassesMarkdown } from './token-classes'

export interface PropDocLike {
  name: string
  type: string
  values?: string[]
  required: boolean
  default?: string
  description?: string
  deprecated?: string
}

export interface ComponentDocLike {
  name: string
  props: PropDocLike[]
  extends?: string[]
}

export interface MotionSpecRow {
  moment: string
  duration?: string
  ease?: string
  spring?: string
  stagger?: string
  value?: string
  note?: string
}

export interface MotionTokens {
  durations: Record<string, number>
  easings: Record<string, readonly number[]>
  springs: Record<string, { visualDuration: number; bounce: number }>
  staggers: Record<string, number>
}

export interface InstallInfo {
  /** Absent for a copy-in-only item (a block or an example). */
  packageCommand?: string
  packageImport?: string
  registryCommand: string
  registryImport?: string
  registryDeps: string[]
  /** A heavy copy's footprint. */
  copyIn?: CopyIn
}

export interface MarkdownContext {
  /** The site's origin, for absolute links: `https://www.youj.dev`. */
  site: string
  /** The hosted registry, for `{registry}` in snippets: `https://www.youj.dev/r`. */
  registry: string
  /** An example's source by its preview name (`button/demo`). */
  example(name: string): string | undefined
  props(name: string): ComponentDocLike | undefined
  install(name: string, imports?: string): InstallInfo | undefined
  /** A block story's install by its block slug ; undefined for a story-only showcase with no item. */
  storyInstall?(slug: string): InstallInfo | undefined
  /** A block's usage snippet, props and `copy` keys by its slug (`marketing-feature-bento`), for BlockStory. */
  block?(slug: string): { usage?: string; props?: ComponentDocLike; copy?: string[] } | undefined
  /** The ids a visual kit ships, by category, for KitNames. */
  kitNames?(kit: 'loaders' | 'illustrations'): { category: string; ids: string[] }[]
  tokens: MotionTokens
  /** Called with the name of any component this file doesn't know, so a test can catch new ones. */
  unknown?(name: string): void
}

/* ── Parsing ─────────────────────────────────────────────────────────────── */

type Attr = string | { expr: string } | true

interface ElementNode {
  type: 'element'
  name: string
  attrs: Record<string, Attr>
  children: Node[]
}

type Node = { type: 'text'; value: string } | { type: 'code'; value: string } | ElementNode

const TAG_START = /^<\/?([A-Za-z][\w.]*)(?=[\s/>])/

/** Reads a tag at `at` (which holds `<`): its name, attributes, and whether it closes or self-closes. */
function readTag(src: string, at: number): { name: string; attrs: Record<string, Attr>; closing: boolean; selfClosing: boolean; end: number } | null {
  const head = TAG_START.exec(src.slice(at, at + 64))
  if (!head) return null
  const closing = src[at + 1] === '/'
  let i = at + head[0].length
  const attrs: Record<string, Attr> = {}
  while (i < src.length) {
    while (/\s/.test(src[i]!)) i++
    if (src.startsWith('/>', i)) return { name: head[1]!, attrs, closing, selfClosing: true, end: i + 2 }
    if (src[i] === '>') return { name: head[1]!, attrs, closing, selfClosing: false, end: i + 1 }
    const name = /^[\w:.-]+/.exec(src.slice(i))?.[0]
    if (!name) return null
    i += name.length
    if (src[i] !== '=') {
      attrs[name] = true
      continue
    }
    i++
    const quote = src[i]
    if (quote === '"' || quote === "'") {
      const close = src.indexOf(quote, i + 1)
      if (close < 0) return null
      attrs[name] = src.slice(i + 1, close)
      i = close + 1
    } else if (quote === '{') {
      const close = matchBrace(src, i)
      if (close < 0) return null
      attrs[name] = { expr: src.slice(i + 1, close) }
      i = close + 1
    } else return null
  }
  return null
}

/** The index of the `}` closing the `{` at `at`, skipping strings, template literals and comments. */
function matchBrace(src: string, at: number): number {
  let depth = 0
  for (let i = at; i < src.length; i++) {
    const c = src[i]!
    if (c === '"' || c === "'" || c === '`') {
      for (i++; i < src.length && src[i] !== c; i++) if (src[i] === '\\') i++
    } else if (c === '/' && src[i + 1] === '*') {
      i = src.indexOf('*/', i + 2) + 1
      if (i === 0) return -1
    } else if (c === '{') depth++
    else if (c === '}' && --depth === 0) return i
  }
  return -1
}

const FENCE = /^([ \t]*)(`{3,}|~{3,})/

/** MDX source as a tree: fenced code stays verbatim, JSX elements hold their children. */
function parse(src: string): Node[] {
  const root: ElementNode = { type: 'element', name: '#root', attrs: {}, children: [] }
  const stack: ElementNode[] = [root]
  let text = ''
  const flush = () => {
    if (text) stack.at(-1)!.children.push({ type: 'text', value: text })
    text = ''
  }
  let i = 0
  while (i < src.length) {
    const lineStart = i === 0 || src[i - 1] === '\n'
    const fence = lineStart ? FENCE.exec(src.slice(i, i + 64)) : null
    if (fence) {
      const indent = fence[1]!
      const marker = fence[2]!
      const openEnd = src.indexOf('\n', i)
      let close = openEnd < 0 ? src.length : openEnd + 1
      // The closing fence: the same marker (or longer) alone on its line.
      for (;;) {
        const next = src.indexOf('\n', close)
        const line = src.slice(close, next < 0 ? src.length : next)
        if (close >= src.length) break
        if (line.trim().startsWith(marker[0]!.repeat(marker.length)) && line.trim().replace(/[`~]/g, '') === '') {
          close = next < 0 ? src.length : next + 1
          break
        }
        close = next < 0 ? src.length : next + 1
      }
      flush()
      // Code nested in JSX children is indented with them; dedent it.
      const block = src
        .slice(i, close)
        .split('\n')
        .map((l) => (l.startsWith(indent) ? l.slice(indent.length) : l))
        .join('\n')
      stack.at(-1)!.children.push({ type: 'code', value: block })
      i = close
      continue
    }
    const c = src[i]!
    if (c === '`') {
      const run = /^`+/.exec(src.slice(i))![0]
      const close = src.indexOf(run, i + run.length)
      const end = close < 0 ? i + run.length : close + run.length
      text += src.slice(i, end)
      i = end
      continue
    }
    if (c === '{' && src.startsWith('{/*', i)) {
      const close = src.indexOf('*/}', i)
      if (close >= 0) {
        i = close + 3
        continue
      }
    }
    if (c === '<') {
      const tag = readTag(src, i)
      if (tag) {
        flush()
        if (tag.closing) {
          // Close up to the matching element; a stray closing tag is dropped.
          let at = stack.length - 1
          while (at > 0 && stack[at]!.name !== tag.name) at--
          if (at > 0) stack.length = at
        } else {
          const el: ElementNode = { type: 'element', name: tag.name, attrs: tag.attrs, children: [] }
          stack.at(-1)!.children.push(el)
          if (!tag.selfClosing) stack.push(el)
        }
        i = tag.end
        continue
      }
    }
    text += c
    i++
  }
  flush()
  return root.children
}

/* ── Rendering ───────────────────────────────────────────────────────────── */

/** Evaluates an attribute expression from our own content: a string, template literal, number or array literal. */
function evaluate(attr: Attr | undefined): unknown {
  if (attr === undefined || attr === true || typeof attr === 'string') return attr
  return new Function(`"use strict"; return (${attr.expr})`)()
}

const str = (attr: Attr | undefined): string | undefined => {
  const value = evaluate(attr)
  return typeof value === 'string' ? value : undefined
}

const escapeCell = (text: string) => text.replace(/\|/g, '\\|').replace(/\n+/g, ' ')

export function propsMarkdown(doc: ComponentDocLike): string {
  const out: string[] = []
  if (doc.props.length) {
    out.push('| Prop | Type | Default | Description |', '| --- | --- | --- | --- |')
    for (const p of doc.props) {
      const type = p.values ? p.values.join(' | ') : p.type
      out.push(`| \`${p.name}\`${p.required ? ' (required)' : ''} | \`${escapeCell(type)}\` | ${p.default ? `\`${escapeCell(p.default)}\`` : ''} | ${escapeCell([p.deprecated && `**Deprecated:** ${p.deprecated}`, p.description].filter(Boolean).join(' '))} |`)
    }
  }
  if (doc.extends?.length) out.push('', `${doc.props.length ? 'Also takes' : 'Takes'} the props of ${doc.extends.map((e) => `\`${e}\``).join(', ')}.`)
  return out.join('\n')
}

export function motionMarkdown(rows: MotionSpecRow[], reduced: string | undefined, tokens: MotionTokens): string {
  const out = ['| Moment | Tokens | Value | Note |', '| --- | --- | --- | --- |']
  for (const row of rows) {
    const names: string[] = []
    const values: string[] = []
    if (row.duration) {
      names.push(`duration.${row.duration}`)
      values.push(`${tokens.durations[row.duration]}ms`)
    }
    if (row.ease) {
      names.push(`ease.${row.ease}`)
      values.push(`cubic-bezier(${tokens.easings[row.ease]?.join(', ')})`)
    }
    if (row.spring) {
      const s = tokens.springs[row.spring]
      names.push(`spring.${row.spring}`)
      values.push(s ? `${s.visualDuration}s, bounce ${s.bounce}` : '')
    }
    if (row.stagger) {
      names.push(`stagger.${row.stagger}`)
      values.push(`${tokens.staggers[row.stagger]}ms step`)
    }
    if (row.value) values.push(row.value)
    out.push(`| ${escapeCell(row.moment)} | ${names.map((n) => `\`${n}\``).join(', ')} | ${escapeCell(values.join('; '))} | ${escapeCell(row.note ?? '')} |`)
  }
  if (reduced) out.push('', `**Reduced motion:** ${reduced}`)
  return out.join('\n')
}

/** A composition with no item of its own (the landing page) installs as the blocks it stacks. */
export function stackedInstall(stack: string[]): InstallInfo {
  return { registryCommand: `npx @youj/cli add ${stack.join(' ')}`, registryDeps: [] }
}

export function installMarkdown(info: InstallInfo): string {
  const out = info.packageCommand
    ? ['```bash', info.packageCommand, '```', '', PACKAGE_SETUP, '', ...(info.packageImport ? ['```tsx', info.packageImport, '```', ''] : []), 'Or copy the source into your app with the Youj CLI (import the package as above unless you copy in):', '', '```bash', info.registryCommand, '```']
    : ['Copy the source into your app with the Youj CLI:', '', '```bash', info.registryCommand, '```', ...(info.registryImport ? ['', '```tsx', info.registryImport, '```'] : [])]
  if (info.registryDeps.length) out.push('', `It brings ${info.registryDeps.map((d) => `\`${d}\``).join(', ')} with it.`)
  if (info.copyIn) out.push('', copyInSentence(info.copyIn))
  return out.join('\n')
}

const fenced = (code: string, lang: string, title?: string) => `\`\`\`${lang}${title ? ` title="${title}"` : ''}\n${code.replace(/\n+$/, '')}\n\`\`\``

/** Components that only draw something; their text lives elsewhere on the page. */
const VISUAL = new Set(['ThemePresets', 'ThemeCharacter', 'ThemeBuilder', 'LookComparison', 'BackdropGallery','ThemeLayers', 'IconLayers', 'TopicLoop', 'PageArt', 'IntroFilm', 'PrincipleCards', 'Principles', 'ComponentIndex', 'RegistryExplorer', 'RoleSampler', 'TwoToneExample'])

/** Elements that are only a wrapper for what's inside. */
const TRANSPARENT = new Set(['Steps', 'Step', 'Reference', 'ReferenceRow', 'Examples', 'Example', 'details', 'div', 'span', 'section', 'Fragment'])

/** Site paths become absolute URLs, `repo:` links the repository's (lib/repo.ts). */
function absolute(text: string, site: string): string {
  return resolveRepoLinks(text).replace(/\]\((\/(?!\/)[^)\s]*)\)/g, (_, path: string) => `](${site}${path})`)
}

function render(nodes: Node[], ctx: MarkdownContext): string {
  return nodes.map((node) => renderNode(node, ctx)).join('')
}

/** Block-level output sits on its own lines. */
const block = (text: string) => (text ? `\n\n${text}\n\n` : '\n')

function renderNode(node: Node, ctx: MarkdownContext): string {
  if (node.type === 'text') return absolute(node.value, ctx.site)
  if (node.type === 'code') return node.value
  const { name, attrs } = node
  const children = () => render(node.children, ctx).trim()
  switch (name) {
    case 'ComponentPreview': {
      const code = ctx.example(str(attrs.name) ?? '')
      return block(code ? fenced(code, 'tsx') : '')
    }
    // ComponentStories: its stories as Examples, each its preview's code and its description, then the tabs after them.
    case 'ComponentStories':
      return block(`## Examples\n\n${children()}`)
    case 'Story':
      return block(`### ${str(attrs.label) ?? ''}\n\n${children()}`)
    case 'StoryDescription':
      return block('Each example\'s description is under Examples.')
    case 'StoryCode':
      return block('Each example\'s code is under Examples.')
    // BlockStories: each story's block as a section: its description, the install, usage and its props and strings.
    case 'BlockStories':
      return block(`## Blocks\n\n${children()}`)
    case 'BlockStory': {
      const slug = str(attrs.block) ?? ''
      const doc = ctx.block?.(slug)
      const info = ctx.storyInstall ? ctx.storyInstall(slug) : ctx.install(slug)
      const out = [`### ${str(attrs.label) ?? ''}`, children(), info ? installMarkdown({ ...info, packageImport: undefined, registryImport: undefined }) : '']
      if (doc?.usage) out.push(fenced(doc.usage, 'tsx'))
      if (doc?.props?.props.length) out.push('**Props**', propsMarkdown(doc.props))
      if (doc?.copy?.length) out.push(`**Strings:** \`copy\` takes ${doc.copy.map((key) => `\`${key}\``).join(', ')}.`)
      return block(out.filter(Boolean).join('\n\n'))
    }
    case 'BlockInstall':
    case 'BlockCode':
    case 'BlockReference':
      return block('Each story\'s install, usage, props and strings are under Blocks.')
    case 'InstallTabs': {
      const item = str(attrs.name) ?? ''
      const info = ctx.install(item, str(attrs.imports))
      return block(info ? installMarkdown(attrs.noImport ? { ...info, packageImport: undefined, registryImport: undefined } : info) : '')
    }
    case 'KitNames': {
      const kit = str(attrs.kit) === 'loaders' ? 'loaders' : 'illustrations'
      const rows = ctx.kitNames?.(kit) ?? []
      return block(['| Category | Ids |', '| --- | --- |', ...rows.map((row) => `| ${row.category} | ${row.ids.map((id) => `\`${id}\``).join(' ')} |`)].join('\n'))
    }
    case 'PropsTable': {
      const doc = ctx.props(str(attrs.name) ?? '')
      return block(doc ? propsMarkdown(doc) : '')
    }
    case 'MotionSpec':
      return block(motionMarkdown((evaluate(attrs.rows) as MotionSpecRow[]) ?? [], str(attrs.reduced), ctx.tokens))
    case 'RoleTable':
      return block(rolesMarkdown())
    case 'TokenClasses':
      return block(tokenClassesMarkdown())
    case 'DurationBands':
      return block(durationBandsMarkdown(ctx.tokens))
    case 'DoDont':
      return block(doDontMarkdown(str(attrs.example) as DoDontId))
    case 'MotionPlayground':
      return block(
        `[Open the Motion playground](${ctx.site}/docs/motion/playground): every spring, tween, stagger, personality and overlay preset on a stage, plotted as it plays, with the code each takes. Its address holds the view, e.g. ${ctx.site}/docs/motion/playground?tab=tweens&duration=slow&ease=emphasized.`,
      )
    case 'Callout': {
      const type = str(attrs.type) ?? 'note'
      const title = str(attrs.title)
      const label = `**${title ?? type.charAt(0).toUpperCase() + type.slice(1)}:**`
      return block(`${label} ${children()}`.split('\n').map((line) => `> ${line}`.trimEnd()).join('\n'))
    }
    case 'Deprecated':
      return block(`> **${str(attrs.name)} is deprecated since ${str(attrs.since)}, and goes in ${str(attrs.removeIn)}:** ${children()}`)
    case 'Cards':
      return block(children())
    case 'Card': {
      const title = str(attrs.title) ?? ''
      const href = str(attrs.href)
      const text = children().replace(/\s*\n\s*/g, ' ')
      const link = href ? `[${title}](${href.startsWith('/') ? ctx.site + href : href})` : title
      return `\n- ${link}${text ? `: ${text}` : ''}${attrs.soon ? ' (soon)' : ''}`
    }
    case 'PackageInstall': {
      const command = str(attrs.command) ?? ''
      return block(`With pnpm, npm, Yarn or Bun:\n\n${fenced(PACKAGE_MANAGERS.map((pm) => forManager(command, pm)).join('\n'), 'bash')}`)
    }
    case 'FrameworkTabs':
      return block(children())
    case 'FrameworkTab':
      return block(`**${str(attrs.label) ?? ''}**\n\n${children()}`)
    case 'Snippet':
      return block(fenced((str(attrs.code) ?? '').replaceAll('{registry}', ctx.registry).replaceAll('{site}', ctx.site), str(attrs.lang) ?? 'bash', str(attrs.title)))
    case 'ComingSoon':
      return block('_Coming soon._')
    case 'McpConnect':
      return block(fenced(AI_CLIENTS.map((c) => `# ${c.label}\n${MCP_CONNECT[c.value]}`).join('\n'), 'bash'))
    case 'McpSetup':
      return block(
        MCP_EDITORS.map((e) => [`**${e.name}**: \`npx @youj/cli mcp --client ${e.id}\`${e.command ? `, or \`${e.command}\`` : ''}, or ${e.manual ? `paste in ${e.path}` : `add to \`${e.path}\``}:`, '', fenced(e.config, e.lang)].join('\n')).join('\n\n'),
      )
    case 'FigmaKit':
      return block(`[Download the Figma plugin](${ctx.site}/downloads/youj-figma-plugin.zip) (.zip, for Figma desktop).`)
    case 'IconGallery':
      return block(`Browse every icon, search by meaning and copy code at ${ctx.site}/icons.`)
    case 'SoundBuilder':
      // The builder is for ears; as text, it's the candidates, how each is made, and how a pick is written.
      return block(
        [
          `Pick, hear and export at ${ctx.site}/docs/sound#sound-builder. A pick becomes \`candidates.<cue>.<family>\` in \`definePack\`.`,
          ...lab.map(({ cue, defaultId, variants }) =>
            [`**${cueInfo[cue].label}** (\`${cue}\`): ${cueInfo[cue].plays}`, ...variants.map((v) => `- ${v.name} (\`candidates.${v.id}\`${v.id === defaultId ? ', the default' : ''}): ${v.recipe}`)].join('\n'),
          ),
        ].join('\n\n'),
      )
    case 'SoundStrip':
      return block(
        [`The Beacon pack, the default (hear it at ${ctx.site}/docs/sound):`, ...lab.map(({ cue, defaultId, variants }) => `- \`${cue}\`: ${variants.find((v) => v.id === defaultId)?.recipe ?? ''}`)].join('\n'),
      )
    case 'summary':
      return block(`**${children()}**`)
    default:
      if (VISUAL.has(name)) return '\n'
      if (!TRANSPARENT.has(name) && /^[A-Z]/.test(name)) ctx.unknown?.(name)
      return render(node.children, ctx)
  }
}

/** Splits `---\nfrontmatter\n---\nbody`. Values are read as plain strings. */
export function frontmatter(raw: string): { data: Record<string, string>; body: string } {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(raw)
  if (!match) return { data: {}, body: raw }
  const data: Record<string, string> = {}
  for (const line of match[1]!.split('\n')) {
    const kv = /^(\w+):\s*(.*?)\s*(?:#.*)?$/.exec(line)
    if (kv) data[kv[1]!] = kv[2]!.replace(/^(['"])(.*)\1$/, '$2')
  }
  return { data, body: raw.slice(match[0].length) }
}

/** Every `<name …>` element in an MDX page, outside code, with its attributes evaluated. */
export function elements(raw: string, name: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = []
  const visit = (nodes: Node[]) => {
    for (const node of nodes) {
      if (node.type !== 'element') continue
      if (node.name === name) out.push(Object.fromEntries(Object.entries(node.attrs).map(([k, v]) => [k, evaluate(v)])))
      visit(node.children)
    }
  }
  visit(parse(frontmatter(raw).body))
  return out
}

/** An MDX page's body as Markdown (without its title). */
export function mdxToMarkdown(raw: string, ctx: MarkdownContext): string {
  return render(parse(frontmatter(raw).body), ctx)
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** A whole page: title, description, body. */
export function pageMarkdown(page: { title: string; description?: string; url: string }, raw: string, ctx: MarkdownContext): string {
  const head = [`# ${page.title}`, '', ...(page.description ? [`> ${page.description}`, ''] : []), `Source: ${ctx.site}${page.url}`, '']
  return `${head.join('\n')}\n${mdxToMarkdown(raw, ctx)}\n`
}
