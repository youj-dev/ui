import type { Kit, Mode, StyleId } from '../kit'
import type { Fonts } from './fonts'
import type { Styles } from './styles'
import type { Vars } from './variables'

/* The drawing vocabulary: auto-layout frames, paints bound to Color
 * variables, text in the kit's styles, and mode scoping. Every page and
 * component is built from these, so a colour is never a raw value and a size
 * that has a token is bound to it. */

export interface Ctx {
  kit: Kit
  vars: Vars
  styles: Styles
  fonts: Fonts
  /** The component style this build draws: classic (the default) or bezel. */
  style: StyleId
}

let ctx: Ctx | undefined
export function setContext(next: Ctx) {
  ctx = next
}
export function context(): Ctx {
  if (!ctx) throw new Error('draw: no context')
  return ctx
}

/** Whether this build draws the bezel style's anatomy. */
export const bezel = () => context().style === 'bezel'

/** A Color variable name, optionally with the paint's opacity: 'role/line' or ['role/accent', 0.1]. */
export type Ink = string | [string, number]

export function paintVar(variable: Variable, opacity = 1): SolidPaint {
  return figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity }, 'color', variable)
}

export function solid(ink: Ink): SolidPaint {
  const [name, opacity] = Array.isArray(ink) ? ink : [ink, 1]
  return paintVar(context().vars.get('color', name), opacity)
}

const isPaint = (v: unknown): v is Paint => typeof v === 'object' && v !== null && !Array.isArray(v) && 'type' in v

/** A Color variable by name, or a paint made elsewhere (bound to a source variable, say). */
export const fillOf = (ink: Ink | Paint): Paint => (isPaint(ink) ? ink : solid(ink))

type Size = number | 'fill' | 'hug'
type Pad = number | [number, number] | [number, number, number, number]

export interface BoxProps {
  name?: string
  /** Auto layout direction; 'none' positions children absolutely. Default 'col'. */
  dir?: 'row' | 'col' | 'none'
  gap?: number | string
  pad?: Pad
  fill?: Ink | Paint
  stroke?: Ink | Paint
  strokeWidth?: number
  strokeAlign?: 'INSIDE' | 'OUTSIDE' | 'CENTER'
  /** Per-side stroke weights, e.g. { bottom: 1 } for a rule under a row. */
  sides?: Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>
  radius?: number | string
  w?: Size
  h?: Size
  align?: 'start' | 'center' | 'end' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between'
  wrap?: number
  clip?: boolean
  effect?: string
  opacity?: number
}

const pending = new WeakMap<SceneNode, { w?: Size; h?: Size }>()

const ALIGN = { start: 'MIN', center: 'CENTER', end: 'MAX', baseline: 'BASELINE' } as const
const JUSTIFY = { start: 'MIN', center: 'CENTER', end: 'MAX', between: 'SPACE_BETWEEN' } as const

function scaleVar(name: string) {
  return context().vars.get('scale', name)
}

/** Binds a number to a variable when given a token name ('space/4', 'radius/md'), or sets it. */
function setNumber(node: FrameNode | ComponentNode | RectangleNode, field: VariableBindableNodeField, value: number | string) {
  if (typeof value === 'number') {
    // A variant redrawn in another style may still carry the binding from the last run.
    if (node.boundVariables?.[field as keyof typeof node.boundVariables]) node.setBoundVariable(field, null)
    ;(node as unknown as Record<string, number>)[field] = value
    return
  }
  const v = value.startsWith('space/') || value.startsWith('focus/') ? scaleVar(value) : context().vars.get('theme', value)
  node.setBoundVariable(field, v)
}

export function setRadius(node: FrameNode | ComponentNode | RectangleNode, radius: number | string) {
  if (typeof radius === 'number') {
    for (const corner of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius'] as const) if (node.boundVariables?.[corner]) node.setBoundVariable(corner, null)
    node.cornerRadius = radius
    return
  }
  for (const corner of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius'] as const) setNumber(node, corner, radius)
}

function applyPad(node: FrameNode | ComponentNode, pad: Pad) {
  const [t, r, b, l] = typeof pad === 'number' ? [pad, pad, pad, pad] : pad.length === 2 ? [pad[0], pad[1], pad[0], pad[1]] : pad
  node.paddingTop = t
  node.paddingRight = r
  node.paddingBottom = b
  node.paddingLeft = l
}

/** Styles a frame or component in place. */
export async function style<T extends FrameNode | ComponentNode>(node: T, p: BoxProps): Promise<T> {
  if (p.name) node.name = p.name
  node.fills = p.fill ? [fillOf(p.fill)] : []
  if (p.dir !== 'none') {
    node.layoutMode = p.dir === 'row' ? 'HORIZONTAL' : 'VERTICAL'
    if (p.gap !== undefined) setNumber(node, 'itemSpacing', p.gap)
    if (p.pad !== undefined) applyPad(node, p.pad)
    node.counterAxisAlignItems = ALIGN[p.align ?? 'start']
    node.primaryAxisAlignItems = JUSTIFY[p.justify ?? 'start']
    if (p.wrap !== undefined) {
      node.layoutWrap = 'WRAP'
      node.counterAxisSpacing = p.wrap
    }
  } else node.layoutMode = 'NONE'
  node.clipsContent = p.clip ?? false
  if (p.stroke) {
    node.strokes = [fillOf(p.stroke)]
    node.strokeAlign = p.strokeAlign ?? 'INSIDE'
    if (p.sides) {
      node.strokeTopWeight = p.sides.top ?? 0
      node.strokeRightWeight = p.sides.right ?? 0
      node.strokeBottomWeight = p.sides.bottom ?? 0
      node.strokeLeftWeight = p.sides.left ?? 0
    } else node.strokeWeight = p.strokeWidth ?? 1
  } else node.strokes = []
  if (p.radius !== undefined) setRadius(node, p.radius)
  // Reset as well as set: a variant redrawn in the other style keeps its node.
  if (p.effect) await node.setEffectStyleIdAsync(context().styles.effect(p.effect).id)
  else if (node.effectStyleId) {
    await node.setEffectStyleIdAsync('')
    node.effects = []
  }
  node.opacity = p.opacity ?? 1
  size(node, p.w ?? 'hug', p.h ?? 'hug')
  return node
}

/** Sets a node's size: fixed numbers now, hug now (auto layout only), fill once it has an auto-layout parent. */
export function size(node: SceneNode, w: Size, h: Size) {
  const auto = 'layoutMode' in node && node.layoutMode !== 'NONE'
  if (typeof w === 'number' || typeof h === 'number') {
    const n = node as FrameNode
    // An emptied hugging frame (a variant being redrawn) reads 0 on its other axis, which resize() refuses.
    n.resize(typeof w === 'number' ? w : Math.max(1, n.width), typeof h === 'number' ? h : Math.max(1, n.height))
  }
  const n = node as FrameNode
  if (w === 'hug' && (auto || node.type === 'TEXT')) n.layoutSizingHorizontal = 'HUG'
  if (h === 'hug' && (auto || node.type === 'TEXT')) n.layoutSizingVertical = 'HUG'
  if (w === 'fill' || h === 'fill') pending.set(node, { w: w === 'fill' ? 'fill' : undefined, h: h === 'fill' ? 'fill' : undefined })
  applyPending(node)
}

function applyPending(node: SceneNode) {
  const p = pending.get(node)
  const parent = node.parent
  if (!p || !parent || !('layoutMode' in parent) || parent.layoutMode === 'NONE') return
  const n = node as FrameNode
  if (p.w) n.layoutSizingHorizontal = 'FILL'
  if (p.h) n.layoutSizingVertical = 'FILL'
  pending.delete(node)
}

/** Appends children in order and resolves their fill sizing against the new parent. */
export function add<T extends BaseNode & ChildrenMixin>(parent: T, ...children: (SceneNode | null | undefined | false)[]): T {
  for (const child of children) {
    if (!child) continue
    parent.appendChild(child)
    applyPending(child)
  }
  return parent
}

export async function box(p: BoxProps = {}, ...children: (SceneNode | null | undefined | false)[]): Promise<FrameNode> {
  const f = figma.createFrame()
  await style(f, { name: 'Frame', ...p })
  return add(f, ...children)
}

export interface TextProps {
  name?: string
  w?: number | 'fill'
  align?: 'LEFT' | 'CENTER' | 'RIGHT'
  /** One line, cut with an ellipsis when it runs out of room. */
  truncate?: boolean
}

/** Text in one of the kit's text styles, filled with a Color variable. */
export async function text(chars: string, styleName: string, ink: Ink | Paint = 'role/fg', p: TextProps = {}): Promise<TextNode> {
  const { styles, fonts } = context()
  const spec = styles.spec(styleName)
  const t = figma.createText()
  t.fontName = fonts.font(spec.family, spec.weight)
  t.characters = chars
  await t.setTextStyleIdAsync(styles.text(styleName).id)
  t.name = p.name ?? chars.slice(0, 40)
  t.fills = [fillOf(ink)]
  if (p.align) t.textAlignHorizontal = p.align
  if (p.w === 'fill') {
    t.textAutoResize = 'HEIGHT'
    pending.set(t, { w: 'fill' })
  } else if (typeof p.w === 'number') {
    t.resize(p.w, t.height)
    // After the resize, so the height follows the wrapped text whatever resize did to the mode.
    t.textAutoResize = 'HEIGHT'
  } else t.textAutoResize = 'WIDTH_AND_HEIGHT'
  if (p.truncate) {
    t.textTruncation = 'ENDING'
    t.maxLines = 1
  }
  return t
}

/** A plain rectangle: swatches, rules, bars. */
export function rect(name: string, w: number, h: number, fill: Ink | Paint | null, radius: number | string = 0): RectangleNode {
  const r = figma.createRectangle()
  r.name = name
  r.resize(w, h)
  r.fills = fill ? [fillOf(fill)] : []
  if (radius) setRadius(r, radius)
  return r
}

/** A hairline across its parent. */
export function rule(ink: Ink = 'role/line'): RectangleNode {
  const r = rect('Rule', 100, 1, ink)
  pending.set(r, { w: 'fill' })
  return r
}

/** Scopes a subtree to a theme and a mode, where the plan has modes. Returns whether it could. */
export function scope(node: FrameNode | ComponentNode | InstanceNode | SectionNode, theme: string, mode: Mode): boolean {
  const { vars } = context()
  let ok = true
  if (vars.themeModes) node.setExplicitVariableModeForCollection(vars.theme, vars.themeModes[theme]!)
  else ok = theme === vars.applied.theme
  if (vars.colorModes) node.setExplicitVariableModeForCollection(vars.color, vars.colorModes[mode])
  else ok = ok && mode === vars.applied.mode
  return ok
}

/** Adds a vector from path data, positioned in its parent's coordinates (the SVG maps 1:1 onto them). */
export function vector(
  parent: BaseNode & ChildrenMixin,
  d: string,
  paint: { fill?: Paint | null; stroke?: Paint | null; strokeWidth?: number; evenOdd?: boolean },
  name = 'Vector',
): SceneNode {
  const rule = paint.evenOdd ? ' fill-rule="evenodd"' : ''
  const frame = figma.createNodeFromSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><path d="${d}"${rule} fill="#000000"/></svg>`)
  const node = frame.children[0]!
  parent.appendChild(node)
  frame.remove()
  node.name = name
  const shape = node as VectorNode
  shape.fills = paint.fill ? [paint.fill] : []
  shape.strokes = paint.stroke ? [paint.stroke] : []
  if (paint.stroke) {
    shape.strokeWeight = paint.strokeWidth ?? 1
    shape.strokeCap = 'ROUND'
    shape.strokeJoin = 'ROUND'
    shape.strokeAlign = 'CENTER'
  }
  return node
}
