import { add, bezel, context, solid, style, text, type Ink } from '../draw'
import type { IconBuild } from '../icons'
import { ref, type SetSpec, type VariantSpec } from './set'

/* Button, from packages/ui/src/components/ui/button.variants.ts (buttonVariants).
 * Every look is a token: fill, text, border, the xs shadow, the control
 * height, padding and radius for each size. Hover mirrors the hover classes;
 * Focus wears the focus-ring style; Disabled is 50% opacity. The border is
 * there on every variant, transparent unless it's Outline, as in code, so the
 * sizes line up. The leading icon is an instance you can swap. */

export const SOURCE = {
  file: 'packages/ui/src/components/ui/button.variants.ts',
  classes: [
    'rounded-button border border-transparent bg-clip-padding font-medium',
    'bg-action text-on-action shadow-xs yj-solid-hover',
    'bg-hover text-fg hover:bg-hover',
    'border-line bg-transparent text-fg shadow-xs hover:bg-hover',
    'text-fg-muted hover:bg-hover hover:text-fg',
    'bg-danger text-on-accent shadow-xs yj-solid-hover',
    'text-accent underline-offset-4 hover:underline',
    'h-control-xs gap-1 rounded-button-xs px-2 text-ui-sm',
    'h-control-sm rounded-button-sm gap-1.5 px-2.5 text-ui',
    'h-control gap-1.5 px-3 text-ui',
    'h-control-lg gap-2 rounded-button-lg px-4 text-ui-lg',
    'size-control',
    'size-control-xs',
    'size-control-sm',
    'size-control-lg',
    'data-disabled:not-data-loading:opacity-50',
  ],
}

// Variant and size values are the code's props verbatim (<Button variant="outline" size="sm">).
export const VARIANTS = ['default', 'secondary', 'outline', 'ghost', 'danger', 'link'] as const
export const SIZES = ['xs', 'sm', 'default', 'lg', 'icon-xs', 'icon-sm', 'icon', 'icon-lg'] as const
const STATES = ['rest', 'hover', 'focus', 'disabled'] as const
type Variant = (typeof VARIANTS)[number]
type Size = (typeof SIZES)[number]
type State = (typeof STATES)[number]

interface Look {
  fill: Ink | null
  text: string
  border: string | null
  shadow: boolean
  hover: { fill: Ink | null; text?: string }
}

export const LOOKS: Record<Variant, Look> = {
  default: { fill: 'role/action', text: 'role/on-action', border: null, shadow: true, hover: { fill: ['role/action', 0.9] } },
  secondary: { fill: 'role/hover', text: 'role/fg', border: null, shadow: false, hover: { fill: ['role/fg', 0.1] } },
  outline: { fill: null, text: 'role/fg', border: 'role/line', shadow: true, hover: { fill: 'role/hover' } },
  ghost: { fill: null, text: 'role/fg-muted', border: null, shadow: false, hover: { fill: 'role/hover', text: 'role/fg' } },
  danger: { fill: 'role/danger', text: 'role/on-accent', border: null, shadow: true, hover: { fill: ['role/danger', 0.9] } },
  // The link is text in the accent, underlined on hover (and, in code, on focus-free hover only); no fill, border or shadow.
  link: { fill: null, text: 'role/accent', border: null, shadow: false, hover: { fill: null } },
}

/** The icon sizes are a square at the control height of the text size they pair with (size-control, -xs, -sm, -lg) and no label. */
const ICON_SIZE: Partial<Record<Size, { base: Exclude<Size, `icon${string}`>; icon: number }>> = {
  'icon-xs': { base: 'xs', icon: 14 },
  'icon-sm': { base: 'sm', icon: 16 },
  icon: { base: 'default', icon: 16 },
  'icon-lg': { base: 'lg', icon: 20 },
}

export const SIZE_SPEC: Record<Exclude<Size, `icon${string}`>, { height: string; gap: string; px: string; text: string; icon: number }> = {
  xs: { height: 'control/xs', gap: 'space/1', px: 'space/2', text: 'UI/sm/Medium', icon: 14 },
  sm: { height: 'control/sm', gap: 'space/1-5', px: 'space/2-5', text: 'UI/base/Medium', icon: 16 },
  default: { height: 'control/default', gap: 'space/1-5', px: 'space/3', text: 'UI/base/Medium', icon: 16 },
  lg: { height: 'control/lg', gap: 'space/2', px: 'space/4', text: 'UI/lg/Medium', icon: 16 },
}

/** An icon instance at a given size, recoloured to an ink (strokes and fills that were the icon's ink). */
export function iconInstance(icon: ComponentNode, px: number, ink: string): InstanceNode {
  const inst = icon.createInstance()
  inst.rescale(px / 24)
  inst.name = 'Icon'
  const paint = solid(ink)
  for (const node of inst.findAll((n) => n.type === 'VECTOR')) {
    const v = node as VectorNode
    const isInk = (p: readonly Paint[] | PluginAPI['mixed']) => Array.isArray(p) && p.length > 0 && p[0]!.type === 'SOLID' && !!(p[0] as SolidPaint).boundVariables?.color
    if (isInk(v.strokes)) v.strokes = [paint]
    if (isInk(v.fills)) v.fills = [paint]
  }
  return inst
}

/** A transparent 1px border, so every variant has the same box as in code. */
const clearBorder = (): SolidPaint => ({ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 0 })

/** Bezel (bezel.css): every button a pill, a little wider; the primary in ink with the page colour as text (a 10% page-colour wash on hover); secondary a raised pill in dark, a white one on an inset hairline in light. */
// lg's 18px (spacing × 4.5) has no spacing token.
const BEZEL_PX: Record<Exclude<Size, `icon${string}`>, string | number> = { xs: 'space/2-5', sm: 'space/3', default: 'space/3-5', lg: 18 }
const BEZEL_LOOKS: Partial<Record<Variant, Look>> = {
  default: { fill: 'role/fg', text: 'role/canvas', border: null, shadow: true, hover: { fill: 'role/fg' } },
  secondary: { fill: 'role/control', text: 'role/fg', border: 'bezel/secondary-ring', shadow: false, hover: { fill: 'bezel/secondary-hover' } },
}

export async function drawButton(c: ComponentNode | FrameNode, variant: Variant, size: Size, state: State, label: string, icon: ComponentNode | null, withRefs: boolean) {
  const bz = bezel()
  const look = (bz && BEZEL_LOOKS[variant]) || LOOKS[variant]
  const square = ICON_SIZE[size]
  const base = square?.base ?? (size as Exclude<Size, `icon${string}`>)
  const s = { ...(bz ? { ...SIZE_SPEC[base], px: BEZEL_PX[base] } : SIZE_SPEC[base]), ...(square && { icon: square.icon, px: 0 }) }
  const hover = state === 'hover'
  const fill = hover ? look.hover.fill : look.fill
  const ink = hover && look.hover.text ? look.hover.text : look.text
  await style(c, {
    dir: 'row',
    gap: s.gap,
    align: 'center',
    justify: 'center',
    fill: fill ?? undefined,
    // Both looks read the theme's button corner (ui.css --radius-button*); the kit draws every size at the default size's.
    radius: 'bezel/pill',
    effect: state === 'focus' ? 'Focus/ring' : look.shadow ? 'Shadow/xs' : bz && variant === 'secondary' ? 'Bezel/lift' : undefined,
    opacity: state === 'disabled' ? 0.5 : undefined,
  })
  // The ink primary's hover lays the page colour over it at 10%.
  if (bz && variant === 'default' && hover) c.fills = [solid('role/fg'), solid(['role/canvas', 0.1])]
  c.strokes = [look.border ? solid(look.border) : clearBorder()]
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'
  c.strokesIncludedInLayout = true
  const { vars } = context()
  if (typeof s.px === 'number') {
    c.setBoundVariable('paddingLeft', null)
    c.setBoundVariable('paddingRight', null)
    c.paddingLeft = s.px
    c.paddingRight = s.px
  } else {
    c.setBoundVariable('paddingLeft', vars.get('scale', s.px))
    c.setBoundVariable('paddingRight', vars.get('scale', s.px))
  }
  c.layoutSizingVertical = 'FIXED'
  c.setBoundVariable('height', vars.get('theme', s.height))
  if (square) {
    c.layoutSizingHorizontal = 'FIXED'
    c.setBoundVariable('width', vars.get('theme', s.height))
    if (icon) {
      const i = iconInstance(icon, s.icon, ink)
      add(c, i)
      if (withRefs) ref(i, 'Icon')
    }
    return
  }
  if (icon) {
    const i = iconInstance(icon, s.icon, ink)
    add(c, i)
    if (withRefs) ref(i, 'Icon', 'Leading icon')
    i.visible = !withRefs
  }
  const t = await text(label, s.text, ink, { name: 'Label' })
  if (variant === 'link' && hover) t.textDecoration = 'UNDERLINE'
  add(c, withRefs ? ref(t, 'Label') : t)
}

export function buttonSpec(icons: Map<string, IconBuild>): SetSpec {
  const plus = icons.get('plus') ?? [...icons.values()][0]!
  const preferred = ['plus', 'arrow-right', 'check', 'download', 'search', 'copy', 'send', 'trash', 'settings', 'mail']
    .map((n) => icons.get(n))
    .filter((b): b is IconBuild => !!b)
    .map((b) => ({ type: b.node.type === 'COMPONENT_SET' ? ('COMPONENT_SET' as const) : ('COMPONENT' as const), key: b.node.key }))
  const variants: VariantSpec[] = []
  // Figma's default variant is the top-left one, so the default size leads the columns.
  const columns: Size[] = ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg']
  for (const variant of VARIANTS)
    for (const state of STATES)
      for (const size of columns) {
        variants.push({
          props: { Variant: variant, Size: size, State: state },
          build: (c) => drawButton(c, variant, size, state, 'Button', plus.rest, true),
        })
      }
  return {
    key: 'component:button',
    name: 'Button',
    description:
      `buttonVariants in packages/ui (Base UI Button)${bezel() ? ', in Bezel: pills, the primary in ink, secondary a raised pill (bezel.css)' : ''}. Variant × Size × State. The icon sizes are square and hold only the icon (swap it with the Icon property); Link is text in the accent, underlined on hover. Text and the leading icon are properties. In code the press scales to 0.97 on the instant token (none under reduced motion) and \`loading\`/\`onAction\` morph the label; those live in code.`,
    variants,
    properties: [
      { name: 'Label', type: 'TEXT', default: 'Button', field: 'characters' },
      { name: 'Leading icon', type: 'BOOLEAN', default: false, field: 'visible' },
      { name: 'Icon', type: 'INSTANCE_SWAP', default: plus.rest.id, preferred, field: 'mainComponent' },
    ],
    columns: 'Size',
  }
}
