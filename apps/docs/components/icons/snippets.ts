import type { IconSwapDirection, IconSwapTransition, IconTrigger } from '@youj/icons'
import type { Entry, IconEntry, PairEntry } from './catalog'
import { INKS, isCustomInk, type Ink } from './settings'
import { svgJsx, svgMarkup, type IconNode } from './static-svg'

/* The code the explorer copies. Every snippet reflects the toolbar: a size,
 * stroke or color that isn't the default shows up as a prop, so what you
 * copy draws what you see. */

export const ICONS_PACKAGE = '@youj/icons'

export type SnippetId = 'react' | 'svg' | 'jsx' | 'cli'

export interface Snippet {
  id: SnippetId
  label: string
  /** What the copy button says it copies. */
  noun: string
  lang: 'tsx' | 'svg' | 'sh'
  code: string
}

export interface SnippetOptions {
  size: number
  strokeWidth: number
  ink: Ink
  /** The trigger the inspector previews with, when it isn't the icon's default. */
  trigger?: IconTrigger
  transition?: IconSwapTransition
  direction?: IconSwapDirection | null
}

/** Props that differ from the defaults, in the order a reader expects. */
function props(entries: [string, string | number | undefined][]) {
  return entries
    .filter((e): e is [string, string | number] => e[1] !== undefined)
    .map(([k, v]) => (typeof v === 'number' ? ` ${k}={${v}}` : v.startsWith('{') ? ` ${k}=${v}` : ` ${k}="${v}"`))
    .join('')
}

function inkProp(ink: Ink): [string, string | undefined] {
  if (isCustomInk(ink)) return ['style', `{{ color: '${ink}' }}`]
  const token = INKS.find((i) => i.id === ink)
  return ['className', token?.className || undefined]
}

function common({ size, strokeWidth, ink }: SnippetOptions): [string, string | number | undefined][] {
  return [['size', size === 24 ? undefined : size], ['strokeWidth', strokeWidth === 1.5 ? undefined : strokeWidth], inkProp(ink)]
}

const sortedImports = (names: string[]) => [...new Set(names)].sort().join(', ')

/** The import lines alone: what the inspector's primary button copies. */
export function importSnippet(entry: Entry): string {
  if (entry.kind === 'youj') return `import { ${entry.component} } from '${ICONS_PACKAGE}'`
  const { from, to } = entry
  return `import { ${sortedImports([from.component, to.component, 'IconSwap'])} } from '${ICONS_PACKAGE}'`
}

export function reactSnippet(entry: Entry, o: SnippetOptions): string {
  if (entry.kind === 'youj') {
    const trigger = o.trigger && o.trigger !== entry.Icon.meta.defaultTrigger ? o.trigger : undefined
    const usage = entry.states
      ? `// false shows ${entry.states[0]}, true shows ${entry.states[1]}\n<${entry.component}${props([...common(o), ['active', '{active}']])} />`
      : `<${entry.component}${props([...common(o), ['trigger', trigger]])} />`
    return `${importSnippet(entry)}\n\n${usage}`
  }
  return pairSnippet(entry, o)
}

function pairSnippet(entry: PairEntry, o: SnippetOptions): string {
  const { from, to } = entry
  const direction = o.direction && (o.transition === 'slide' || o.transition === 'wipe') ? o.direction : undefined
  const attrs = props([
    ['from', `{${from.component}}`],
    ['to', `{${to.component}}`],
    ['transition', o.transition && o.transition !== 'scale-blur' ? o.transition : undefined],
    ['direction', direction],
    ['active', '{active}'],
    ...common(o),
  ])
  return `${importSnippet(entry)}\n\n<IconSwap${attrs} />`
}

/** A chain of Youj icons played one swap after another: the list, and a state that steps through it. */
export function chainSnippet(icons: readonly IconEntry[], o: SnippetOptions): string {
  const direction = o.direction && (o.transition === 'slide' || o.transition === 'wipe') ? o.direction : undefined
  const attrs = props([
    ['from', '{icons[step]}'],
    ['to', '{icons[(step + 1) % icons.length]}'],
    ['transition', o.transition && o.transition !== 'scale-blur' ? o.transition : undefined],
    ['direction', direction],
    ['active', '{active}'],
    ...common(o),
  ])
  return `import { useEffect, useState } from 'react'
import { ${sortedImports([...icons.map((e) => e.component), 'IconSwap'])} } from '${ICONS_PACKAGE}'

const icons = [${icons.map((e) => e.component).join(', ')}]

export function IconChain() {
  const [step, setStep] = useState(0)
  const [active, setActive] = useState(false)

  // Swap to the next icon, then move on to it.
  useEffect(() => {
    const timer = setTimeout(
      () => {
        if (!active) return setActive(true)
        setStep((s) => (s + 1) % icons.length)
        setActive(false)
      },
      active ? 700 : 800,
    )
    return () => clearTimeout(timer)
  }, [active, step])

  return <IconSwap key={step}${attrs} />
}`
}

/** The package and the copy-in command for a chain: IconSwap and each icon. */
export function chainInstall(icons: readonly IconEntry[]): { packageCommand: string; cli: string[] } {
  return { packageCommand: `pnpm add ${ICONS_PACKAGE}`, cli: [`npx @youj/cli add ${['icon-swap', ...new Set(icons.map((e) => `icon-${e.name}`))].join(' ')}`] }
}

/** The items the entry needs, copied in with the Youj CLI. */
export function cliSnippet(entry: Entry): string {
  return installCommands(entry).cli.join('\n')
}

/** How to get the entry: the package, or its items copied in with the CLI. */
export function installCommands(entry: Entry): { packageCommand: string; cli: string[] } {
  const item = (e: IconEntry) => `icon-${e.name}`
  const items = entry.kind === 'pair' ? ['icon-swap', ...new Set([item(entry.from), item(entry.to)])] : [item(entry)]
  return { packageCommand: `pnpm add ${ICONS_PACKAGE}`, cli: [`npx @youj/cli add ${items.join(' ')}`] }
}

export function snippetsFor(entry: Entry, nodes: IconNode[] | null, o: SnippetOptions): Snippet[] {
  const svgOptions = { size: o.size, strokeWidth: o.strokeWidth, color: isCustomInk(o.ink) ? o.ink : undefined }
  const out: Snippet[] = [{ id: 'react', label: 'React', noun: 'React code', lang: 'tsx', code: reactSnippet(entry, o) }]
  if (nodes) {
    out.push({ id: 'svg', label: 'SVG', noun: 'SVG', lang: 'svg', code: svgMarkup(nodes, svgOptions) })
    out.push({ id: 'jsx', label: 'JSX', noun: 'static JSX', lang: 'tsx', code: svgJsx(nodes, svgOptions) })
  }
  out.push({ id: 'cli', label: 'Copy in', noun: 'install command', lang: 'sh', code: cliSnippet(entry) })
  return out
}
