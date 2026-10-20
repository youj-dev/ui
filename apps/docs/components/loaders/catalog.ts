import { durations } from '@youj/core'
import type { LoaderLabelEffect, LoaderLabelPosition } from '@youj/loaders'

/* The loaders as the gallery shows them: one entry per registry item
 * (`loader-<id>`), read on the server, with the snippets and the search
 * the gallery and its code dialog share. */

export interface LoaderEntry {
  id: string
  title: string
  /** Its export from its own entry, @youj/loaders/<id>. */
  component: string
  category: string
  technique: string
  tags: string[]
  description: string
  /** Beats per loop (a beat is the deliberate duration token). */
  beats: number
  /** Its colored parts, in the order its `colors` prop colors them, each with the theme role it takes by default. */
  colors?: { part: string; role: string; color: string }[]
  /** Its place in the gallery, from 1. */
  number: number
}

export interface CategoryEntry {
  id: string
  title: string
  blurb: string
}

export const itemName = (id: string) => `loader-${id}`
export const importLine = (entry: LoaderEntry) => `import { ${entry.component} } from '@youj/loaders/${entry.id}'`
/** Where `npx youj add` writes it, through the app's @/ alias. */
export const installedPath = (entry: LoaderEntry) => `@/components/youj/loaders/${entry.category}/${entry.id}`

/** A loop's length in seconds at a speed, in the site's theme (the precise tempo). */
export const loopSeconds = (entry: LoaderEntry, speed = 1) => (entry.beats * durations.deliberate) / 1000 / speed

/** The faces a shown label can take: the theme's label voice, or one of the theme's own faces, or a serif. */
export type LabelFont = 'theme' | 'sans' | 'mono' | 'serif'

export const LABEL_FONTS: { value: LabelFont; label: string; css: string | undefined }[] = [
  { value: 'theme', label: 'Theme', css: undefined },
  { value: 'sans', label: 'Sans', css: 'var(--font-sans)' },
  { value: 'mono', label: 'Mono', css: 'var(--font-mono)' },
  { value: 'serif', label: 'Serif', css: 'ui-serif, Georgia, serif' },
]

/** A shown label's type size, px, for a drawing of `size` px when it's left to the kit (it grows with the drawing). */
export const autoLabelSize = (size: number) => Math.round(Math.min(13, Math.max(11, size * 0.075)))

/**
 * The label as the gallery sets it: its text, one label a line (the accessible name either way), and whether it's
 * shown, where and how it moves, and its type over or under the drawing: capitals, a face and a size (null: the kit's,
 * growing with the drawing). Beside the drawing a label takes the line's own type, so those three apply over or under it.
 */
export interface LabelLook {
  text: string
  show: boolean
  position: LoaderLabelPosition
  effect: LoaderLabelEffect
  caps: boolean
  font: LabelFont
  fontSize: number | null
}

export const DEFAULT_LABEL: LabelLook = { text: 'Loading results', show: false, position: 'bottom', effect: 'pulse', caps: false, font: 'theme', fontSize: null }

/** Whether the label's type (capitals, face, size) is the gallery's to set: shown, over or under the drawing. */
export const labelTypeSet = (label: LabelLook) => label.show && (label.position === 'bottom' || label.position === 'top')

/** The label's type as the kit's custom properties (--yj-label-case, --yj-label-font, --yj-label-size), only what's set. */
export function labelType(label: LabelLook): Record<string, string> {
  if (!labelTypeSet(label)) return {}
  const vars: Record<string, string> = {}
  if (label.caps) vars['--yj-label-case'] = 'uppercase'
  const font = LABEL_FONTS.find((f) => f.value === label.font)?.css
  if (font) vars['--yj-label-font'] = font
  if (label.fontSize !== null) vars['--yj-label-size'] = `${label.fontSize}px`
  return vars
}

/** The label as the gallery opens with it: shown, scrambling through three lines (the component's own defaults stay `DEFAULT_LABEL`, which the code is written against). */
export const GALLERY_LABEL: LabelLook = { ...DEFAULT_LABEL, text: 'Loading…\nSyncing changes\nAlmost there…', show: true, effect: 'scramble' }

/** The label's lines, as the labels they are: trimmed, blank ones dropped. */
export const labelLines = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

/** The `label` prop for the label set: one string, several (a list), or nothing for the default. */
export function labelValue(label: LabelLook): string | string[] | undefined {
  const lines = labelLines(label.text)
  return lines.length > 1 ? lines : lines[0]
}

/** Where a shown label sits and how it moves, as the gallery names them. */
export const LABEL_POSITIONS: { value: LoaderLabelPosition; label: string }[] = [
  { value: 'bottom', label: 'Bottom' },
  { value: 'top', label: 'Top' },
  { value: 'start', label: 'Start' },
  { value: 'end', label: 'End' },
]
export const LABEL_EFFECTS: { value: LoaderLabelEffect; label: string; hint: string }[] = [
  { value: 'pulse', label: 'Pulse', hint: 'A light sweeps through it' },
  { value: 'wave', label: 'Wave', hint: 'Its letters lift in a wave' },
  { value: 'type', label: 'Type', hint: 'Typed behind a caret' },
  { value: 'scramble', label: 'Scramble', hint: 'Resolves out of noise' },
  { value: 'slide', label: 'Slide', hint: 'The line rolls up' },
  { value: 'none', label: 'None', hint: 'Holds still' },
]

export interface Look {
  size: number
  /** Seconds a loop takes. */
  cycle: number
  /** The `color` prop (the primary): a token reference or a color, or undefined for the text color. */
  ink: string | undefined
  /** The `accentColor` prop (the secondary): a token reference or a color, or undefined for the theme's accent. */
  accent: string | undefined
  /** The `colors` prop: left out for Mono (its two colors alone), `'theme'` for its parts in the theme's colors, or its parts' colors in order (an empty one is left to the theme), only as far as the last one set. */
  colors?: 'theme' | readonly string[]
  label: LabelLook
}

/** The `colors` prop for the parts as picked, with Theme on: `'theme'` when none is picked, else up to the last one picked, the ones before it left empty (to the theme). */
export function colorsValue(entry: LoaderEntry, picked: readonly (string | undefined)[]): 'theme' | string[] {
  const parts = entry.colors ?? []
  const last = parts.reduce((at, _, i) => (picked[i] === undefined ? at : i + 1), 0)
  return last ? parts.slice(0, last).map((_, i) => picked[i] ?? '') : 'theme'
}

/** A size as the prop is best written: a named size where it is one, else px. */
const NAMED: Record<number, string> = { 24: 'sm', 64: 'lg' }
const sizeProp = (px: number) => (px === 40 ? null : NAMED[px] ? `size="${NAMED[px]}"` : `size={${px}}`)

/** A string prop as JSX writes it: in quotes, or in braces when it holds a quote. */
const stringProp = (name: string, value: string) => (value.includes('"') ? `${name}={${JSON.stringify(value)}}` : `${name}="${value}"`)

/** A string in code: in single quotes, or double where it holds a single one and no double, as Prettier writes it. */
const jsString = (value: string) =>
  value.includes("'") && !value.includes('"') ? JSON.stringify(value) : `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

/** The label's props: its text (left out when empty, for the default "Loading"; a list when there are several), then where and how it shows, where that isn't the default, and its type, as the kit's custom properties in Tailwind's words. */
function labelProps(label: LabelLook) {
  const props: string[] = []
  const value = labelValue(label)
  if (Array.isArray(value)) props.push(`label={[${value.map(jsString).join(', ')}]}`)
  else if (value) props.push(stringProp('label', value))
  if (label.show) {
    props.push('showLabel')
    if (label.position !== DEFAULT_LABEL.position) props.push(`labelPosition="${label.position}"`)
    if (label.effect !== DEFAULT_LABEL.effect) props.push(`labelEffect="${label.effect}"`)
  }
  const type = Object.entries(labelType(label)).map(([name, css]) => `[${name}:${css.replace(/,\s*/g, ',').replace(/\s+/g, '_')}]`)
  if (type.length) props.push(`className="${type.join(' ')}"`)
  return props
}

/** The props for the look chosen in the gallery: only what differs from its defaults. */
function lookProps(entry: LoaderEntry, look: Look) {
  const props: string[] = []
  const size = sizeProp(look.size)
  if (size) props.push(size)
  const speed = Math.round((loopSeconds(entry) / look.cycle) * 100) / 100
  if (speed !== 1) props.push(`speed={${speed}}`)
  if (look.ink) props.push(`color="${look.ink}"`)
  if (look.accent) props.push(`accentColor="${look.accent}"`)
  if (look.colors && entry.colors) props.push(look.colors === 'theme' ? 'colors="theme"' : `colors={[${look.colors.map(jsString).join(', ')}]}`)
  return [...props, ...labelProps(look.label)]
}

/** The element on one line while it's short, else a prop a line (`indent` is where the element starts), as Prettier writes it. */
function element(component: string, props: string[], indent = '') {
  const line = `<${component}${props.map((p) => ` ${p}`).join('')} />`
  if (line.length <= 80) return line
  return `<${component}\n${props.map((p) => `${indent}  ${p}`).join('\n')}\n${indent}/>`
}

/** The JSX for a loader with the look chosen in the gallery: only what differs from its defaults. */
export function usage(entry: LoaderEntry, look?: Look) {
  const props = look ? lookProps(entry, look) : labelProps(DEFAULT_LABEL)
  const short = element(entry.component, props)
  const body = short.includes('\n') ? `  if (loading)\n    return (\n      ${element(entry.component, props, '      ')}\n    )` : `  if (loading) return ${short}`
  return `${importLine(entry)}

export function Results({ loading }: { loading: boolean }) {
${body}
  // …
}`
}

/** What Copy code copies: the import, and the loader with the look chosen in the gallery. */
export function copyCode(entry: LoaderEntry, look: Look) {
  return `${importLine(entry)}

${element(entry.component, lookProps(entry, look))}`
}

/** The same from the copy the CLI writes. */
export function copiedUsage(entry: LoaderEntry, look?: Look) {
  const props = look ? lookProps(entry, look) : ['size="lg"', 'label="Preparing your workspace"', 'showLabel']
  return `import { ${entry.component} } from '${installedPath(entry)}'

${element(entry.component, props)}`
}
