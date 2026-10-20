import { add, bezel, box, context, style, text, type BoxProps, type Ink } from '../draw'
import type { IconBuild } from '../icons'
import { bezelFieldLook } from './bezel'
import { iconInstance } from './button'
import { setLabel } from './panels'
import { instanceOf, type Props, type SetSpec } from './set'

/* The shared pieces the catalog's sets are drawn from (catalog.ts): an
 * entry's shape, and the surfaces the components have in common (the field
 * control, the overlay panel, the card surface), each in the style the build
 * draws. The earlier sets keep their own copies of these; new ones use these. */

export interface Doc {
  key: string
  title: string
  usage: string
  tokens: string
  /** The component's file(s) under packages/ui/src/components/ui, joined with ' · '. */
  file: string
}

export interface Deps {
  icons: Map<string, IconBuild>
  /** A set built earlier on the page, by key without `component:` (Button, Input, Badge…). */
  get: (key: string) => ComponentSetNode
}

/** One set on the Components page: its reference line and its spec. */
export interface Entry {
  doc: Doc
  spec: (deps: Deps) => SetSpec
}

/** Class-string fragments a drawing follows, checked by test/sources.test.ts. */
export interface Source {
  file: string
  classes: string[]
}

export const scaleVar = (name: string) => context().vars.get('scale', name)
export const themeVar = (name: string) => context().vars.get('theme', name)
/** A clear paint: a border that keeps its box but doesn't show. */
export const clear = (): SolidPaint => ({ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 0 })

/** An icon by the first of its names the set has. */
export const pick = (icons: Map<string, IconBuild>, ...names: string[]) => names.map((n) => icons.get(n)).find(Boolean) ?? [...icons.values()][0]!

/** An icon instance by name, at a size, in an ink. */
export const icon = (icons: Map<string, IconBuild>, name: string | string[], px: number, ink: string) => iconInstance(pick(icons, ...(Array.isArray(name) ? name : [name])).rest, px, ink)

/** The instance-swap property for an icon, with a few likely picks offered first. */
export function iconProperty(icons: Map<string, IconBuild>, fallback: IconBuild, picks: string[], name = 'Icon') {
  const preferred = picks
    .map((n) => icons.get(n))
    .filter((b): b is IconBuild => !!b)
    .map((b) => ({ type: b.node.type === 'COMPONENT_SET' ? ('COMPONENT_SET' as const) : ('COMPONENT' as const), key: b.node.key }))
  return { name, type: 'INSTANCE_SWAP' as const, default: fallback.rest.id, preferred, field: 'mainComponent' as const }
}

/** Binds a frame's inline padding to spacing tokens. */
export function padInline(c: FrameNode | ComponentNode, start: string, end = start) {
  c.setBoundVariable('paddingLeft', scaleVar(start))
  c.setBoundVariable('paddingRight', scaleVar(end))
}

/** Binds a frame's block padding to spacing tokens. */
export function padBlock(c: FrameNode | ComponentNode, top: string, bottom = top) {
  c.setBoundVariable('paddingTop', scaleVar(top))
  c.setBoundVariable('paddingBottom', scaleVar(bottom))
}

/** Fixes a frame's height to a control-height token (control/default, control/sm…). */
export function controlHeight(c: FrameNode | ComponentNode, token = 'control/default') {
  c.layoutSizingVertical = 'FIXED'
  c.setBoundVariable('height', themeVar(token))
}

/** Fixes a frame to a square of a control-height token. */
export function controlSquare(c: FrameNode | ComponentNode, token = 'control/default') {
  controlHeight(c, token)
  c.layoutSizingHorizontal = 'FIXED'
  c.setBoundVariable('width', themeVar(token))
}

/** A label in the component's voice: Bezel's mono capital eyebrow, or the ui-sm muted label in Classic. */
export const eyebrow = (chars: string, name = 'Label', ink: Ink = 'role/fg-muted') => text(chars, bezel() ? 'Bezel/Eyebrow' : 'UI/sm/Regular', ink, { name })

/** A figure: Bezel sets values in the mono family. */
export function figure(t: TextNode, weight: 400 | 500 = 500): TextNode {
  if (bezel()) t.fontName = context().fonts.font('mono', weight)
  return t
}

/** A figure in a text style, mono in Bezel. */
export const value = async (chars: string, styleName: string, ink: Ink = 'role/fg', name = 'Value') => figure(await text(chars, styleName, ink, { name }))

export type FieldState = 'rest' | 'hover' | 'focus' | 'open' | 'invalid' | 'disabled'

/**
 * The field control (fieldControlClass): Bezel's filled well, or Classic's
 * outlined box, by state. `area` is the multi-line corner.
 */
export function fieldLook(state: FieldState = 'rest', area = false): Partial<BoxProps> {
  if (bezel()) return bezelFieldLook(state, area)
  return {
    radius: area ? 'bezel/field-area-radius' : 'bezel/field-radius',
    stroke: state === 'hover' ? 'role/fg-subtle' : state === 'focus' || state === 'open' ? 'role/focus' : state === 'invalid' ? 'role/danger' : 'role/line-control',
    fill: state === 'disabled' ? 'role/band' : undefined,
    effect: state === 'focus' ? 'Focus/field' : undefined,
    opacity: state === 'disabled' ? 0.5 : undefined,
  }
}

/** Styles a frame as a one-line field control: the look, a control height, the field's inline padding. */
export async function field<T extends FrameNode | ComponentNode>(c: T, p: { state?: FieldState; w?: number | 'fill' | 'hug'; height?: string; gap?: string; px?: string } = {}): Promise<T> {
  await style(c, { dir: 'row', align: 'center', gap: p.gap ?? 'space/2', w: p.w ?? 240, ...fieldLook(p.state) })
  c.strokesIncludedInLayout = true
  padInline(c, p.px ?? (bezel() ? 'space/3' : 'space/2-5'))
  controlHeight(c, p.height ?? 'control/default')
  return c
}

/** A frame styled as a field control. */
export const fieldBox = async (name: string, p: Parameters<typeof field>[1] = {}) => field(await box({ name }), p)

/** The overlay panel (menus, popovers, palettes): role/overlay (bezel/popover in Bezel), a hairline, Shadow/md, the overlay corner. */
export function panelLook(p: { pad?: number; radius?: string } = {}): Partial<BoxProps> {
  return { fill: bezel() ? 'bezel/popover' : 'role/overlay', stroke: 'role/line', effect: 'Shadow/md', radius: p.radius ?? 'radius/xl', pad: p.pad ?? (bezel() ? 5 : 4) }
}

/** The dialog surface: bezel/dialog in Bezel, role/overlay in Classic, Shadow/lg, the 2xl corner. */
export function dialogLook(): Partial<BoxProps> {
  return { fill: bezel() ? 'bezel/dialog' : 'role/overlay', stroke: 'role/line', effect: 'Shadow/lg', radius: bezel() ? 'radius/2xl' : 'radius/xl', clip: true }
}

/** The card surface: role/surface on a hairline, the xl corner, Shadow/sm in Bezel and Shadow/xs in Classic. */
export function surfaceLook(): Partial<BoxProps> {
  return { fill: 'role/surface', stroke: 'role/line', effect: bezel() ? 'Shadow/sm' : 'Shadow/xs', radius: 'radius/xl' }
}

/** A menu row: a label with an optional leading icon and trailing text, highlighted with the cursor key. */
export async function menuRow(label: string, p: { icon?: InstanceNode; trailing?: string; on?: boolean; danger?: boolean; w?: number | 'fill' } = {}) {
  const row = await box({ name: 'Item', dir: 'row', gap: 'space/2', align: 'center', pad: [4, 8], w: p.w ?? 'fill', radius: 'bezel/menu-row-radius', fill: p.on ? (p.danger ? 'role/danger-subtle' : 'role/cursor') : undefined })
  padInline(row, 'space/2')
  row.setBoundVariable('minHeight', themeVar('control/sm'))
  if (p.icon) add(row, p.icon)
  add(row, await text(label, 'UI/base/Regular', p.danger ? 'role/danger-text' : 'role/fg', { name: 'Label', w: 'fill', truncate: true }))
  if (p.trailing) add(row, await text(p.trailing, bezel() ? 'Mono/sm' : 'UI/sm/Regular', 'role/fg-muted', { name: 'Trailing' }))
  return row
}

/** A Button instance from the Button set, its label set. */
export function button(get: Deps['get'], label: string, props: Partial<Props> = {}) {
  const i = instanceOf(get('button'), { Variant: 'default', Size: 'default', State: 'rest', ...props })
  if (label) setLabel(i, label)
  return i
}

/** A Badge instance, its label set. */
export function badge(get: Deps['get'], label: string, variant = 'default') {
  const i = instanceOf(get('badge'), { Variant: variant })
  setLabel(i, label)
  return i
}

/** An instance of any set built earlier, by its variant properties. */
export const instance = (get: Deps['get'], key: string, props: Props) => instanceOf(get(key), props)

/** An initials disc, as Avatar draws it: role/band with a faint edge, initials in muted ink. */
export async function initials(chars: string, px = 32, styleName = 'UI/sm/Medium') {
  return box({ name: 'Avatar', dir: 'row', align: 'center', justify: 'center', w: px, h: px, radius: 'radius/full', fill: 'role/band', stroke: 'role/line-subtle' }, await text(chars, styleName, 'role/fg-muted', { name: 'Initials' }))
}

/** A spacer that takes the rest of a row. */
export const spacer = () => box({ name: 'Spacer', w: 'fill', h: 1 })
