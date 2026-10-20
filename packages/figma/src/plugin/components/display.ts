import { add, bezel, context, rect, solid, style, text, type Ink } from '../draw'
import type { IconBuild } from '../icons'
import { iconInstance } from './button'
import { ref, type SetSpec, type VariantSpec } from './set'

/* The small display pieces: Separator, Kbd, Skeleton, Avatar, Alert and
 * Tooltip, each from its file in packages/ui/src/components/ui. Banner, the
 * announcement bar, sits with them. */

export const SOURCES = [
  {
    file: 'packages/ui/src/components/ui/separator.tsx',
    classes: ["'shrink-0 bg-line data-[orientation=horizontal]:h-[var(--yj-stroke-width,1px)] data-[orientation=horizontal]:w-full"],
  },
  {
    file: 'packages/ui/src/components/ui/kbd.tsx',
    classes: [
      "'pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-0.5 rounded-sm px-1 select-none'",
      "'border border-line bg-key font-sans text-ui-xs font-medium text-fg-muted shadow-[inset_0_-1px_0_var(--color-line)]'",
      "cn('inline-flex items-center gap-1', inText, className)",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/skeleton.tsx',
    classes: ["'relative overflow-hidden rounded-md bg-band'"],
  },
  {
    file: 'packages/ui/src/components/ui/avatar.tsx',
    classes: [
      "'group/avatar relative isolate flex size-8 shrink-0 rounded-full bg-band select-none'",
      "'after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:border after:border-line-subtle'",
      "'data-[size=lg]:size-10 data-[size=sm]:size-6'",
      "'flex size-full items-center justify-center rounded-full bg-band text-ui-sm font-medium text-fg-muted uppercase'",
      "'group-data-[size=sm]/avatar:text-ui-xs group-data-[size=lg]/avatar:text-ui'",
      "'absolute end-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-success ring-2 ring-canvas select-none'",
      "'group-data-[size=sm]/avatar:size-1.5 group-data-[size=default]/avatar:size-2 group-data-[size=lg]/avatar:size-2.5'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/alert.variants.ts',
    classes: [
      "'group/alert grid w-full grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 rounded-lg border px-[calc(var(--spacing)*(3.5_-_0.5*var(--ui--compact,0)))] py-[calc(var(--spacing)*(3_-_0.5*var(--ui--compact,0)))] text-start text-ui",
      "info: 'border-accent-line bg-accent-subtle [--alert-icon:var(--color-accent)]'",
      "success: 'border-success-line bg-success-subtle [--alert-icon:var(--color-success)]'",
      "warning: 'border-warning-line bg-warning-subtle [--alert-icon:var(--color-warning)]'",
      "danger: 'border-danger-line bg-danger-subtle [--alert-icon:var(--color-danger)]'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/alert.tsx',
    classes: [
      'info: <InfoIcon trigger="mount" size={16}',
      'success: <CheckCircleIcon trigger="mount" size={16}',
      'warning: <AlertTriangleIcon trigger="mount" size={16}',
      'danger: <OctagonAlertIcon trigger="mount" size={16}',
      "cn('flex min-w-0 flex-col gap-0.5', icon === false && 'col-span-2')",
      "cn('leading-5 font-medium text-fg",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/banner.variants.ts',
    classes: [
      "'group/banner relative flex min-h-10 w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-ui'",
      "default: 'border-b border-line bg-band text-fg ",
      "inverse: 'bg-fg text-canvas ",
      "accent: 'bg-accent text-on-accent ",
      "warning: 'border-b border-warning-line bg-warning-subtle text-fg ",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/banner.tsx',
    classes: [
      "'inline-flex shrink-0 items-center gap-1 rounded-sm font-medium underline decoration-current/35 underline-offset-3 focus-ring'",
      '<ArrowRightIcon size={14} aria-hidden',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/tooltip.tsx',
    classes: [
      "'yj-tooltip inline-flex w-fit max-w-xs items-center gap-2 rounded-md border px-2 py-1 text-ui-sm font-medium text-balance'",
      "'border-transparent bg-inverse text-fg shadow-sm'",
      "'has-data-[slot=kbd]:pe-1'",
      "'**:data-[slot=kbd]:border-line **:data-[slot=kbd]:bg-band **:data-[slot=kbd]:text-fg-muted **:data-[slot=kbd]:shadow-none'",
    ],
  },
]

const scaleVar = (name: string) => context().vars.get('scale', name)
const clear = (): SolidPaint => ({ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 0 })
const pick = (icons: Map<string, IconBuild>, ...names: string[]) => names.map((n) => icons.get(n)).find(Boolean) ?? [...icons.values()][0]!

/* ── Separator ──────────────────────────────────────────────────────────── */

export function separatorSpec(): SetSpec {
  return {
    key: 'component:separator',
    name: 'Separator',
    description: 'Separator in packages/ui: a line in role/line as heavy as the theme’s stroke (a 1px hairline by default). Horizontal fills its row; vertical stretches to its row’s height. Resize the instance.',
    variants: (['horizontal', 'vertical'] as const).map((orientation) => ({
      props: { Orientation: orientation },
      build: async (c: ComponentNode) => {
        await style(c, { dir: 'none', w: orientation === 'horizontal' ? 240 : 1, h: orientation === 'horizontal' ? 1 : 40, fill: 'role/line' })
      },
    })),
    properties: [],
    columns: 'Orientation',
    gap: [48, 16],
  }
}

/* ── Kbd ────────────────────────────────────────────────────────────────── */

/** The keycap's depth: a 1px inset bottom edge in the border colour. */
function keyEdge(ink = 'role/line'): Effect {
  const base: InnerShadowEffect = { type: 'INNER_SHADOW', color: { r: 0, g: 0, b: 0, a: 1 }, offset: { x: 0, y: -1 }, radius: 0, spread: 0, visible: true, blendMode: 'NORMAL' }
  return figma.variables.setBoundVariableForEffect(base, 'color', context().vars.get('color', ink))
}

export async function drawKbd(c: ComponentNode | FrameNode, chars: string, property: string | null) {
  // Bezel: a 22px raised chip in mono, 6px corners, its foot an 8% fg edge.
  const bz = bezel()
  await style(c, { dir: 'row', gap: 'space/0-5', align: 'center', justify: 'center', pad: [0, 4], h: bz ? 22 : 20, radius: bz ? 6 : 'radius/sm', fill: bz ? 'role/key' : 'role/band', stroke: 'role/line' })
  c.strokesIncludedInLayout = true
  c.minWidth = bz ? 22 : 20
  c.setBoundVariable('paddingLeft', scaleVar(bz ? 'space/1-5' : 'space/1'))
  c.setBoundVariable('paddingRight', scaleVar(bz ? 'space/1-5' : 'space/1'))
  c.effects = [keyEdge(bz ? 'bezel/edge' : 'role/line')]
  const t = await text(chars, bz ? 'Mono/xs' : 'UI/xs/Medium', 'role/fg-muted', { name: 'Key' })
  add(c, property ? ref(t, property) : t)
}

export function kbdSpec(): SetSpec {
  return {
    key: 'component:kbd',
    name: 'Kbd',
    description: 'Kbd in packages/ui: a recessed keycap, 20px tall and at least 20px wide, with a hairline and a 1px bottom edge for depth. Group keys with 4px between them for a combination (KbdGroup).',
    variants: (['symbol', 'word'] as const).map((content) => ({
      props: { Content: content },
      build: (c: ComponentNode) => drawKbd(c, content === 'symbol' ? '⌘' : 'Shift', content === 'symbol' ? 'Symbol' : 'Word'),
    })),
    // A symbol and a word are different text, so each has its own property.
    properties: [
      { name: 'Symbol', type: 'TEXT', default: '⌘', field: 'characters' },
      { name: 'Word', type: 'TEXT', default: 'Shift', field: 'characters' },
    ],
    columns: 'Content',
    gap: [32, 16],
  }
}

/* ── Skeleton ───────────────────────────────────────────────────────────── */

export function skeletonSpec(): SetSpec {
  const shapes = { line: [240, 16, 'radius/md'], block: [240, 96, 'radius/md'], circle: [40, 40, 'radius/full'] } as const
  return {
    key: 'component:skeleton',
    name: 'Skeleton',
    description:
      'Skeleton in packages/ui: a recessed role/band block, rounded-md unless you round it. In code a band of light crosses it on the shimmer token (reversed under RTL, gone under reduced motion). Size the instance to the content it stands in for.',
    variants: (Object.keys(shapes) as (keyof typeof shapes)[]).map((shape) => ({
      props: { Shape: shape },
      build: async (c: ComponentNode) => {
        const [w, h, radius] = shapes[shape]
        await style(c, { dir: 'none', w, h, radius, fill: 'role/band', clip: true })
      },
    })),
    properties: [],
    columns: 'Shape',
    gap: [32, 16],
  }
}

/* ── Avatar ─────────────────────────────────────────────────────────────── */

const AVATAR = {
  sm: { px: 24, text: 'UI/xs/Medium', dot: 6, icon: 14 },
  default: { px: 32, text: 'UI/sm/Medium', dot: 8, icon: 16 },
  lg: { px: 40, text: 'UI/base/Medium', dot: 10, icon: 20 },
} as const

async function drawAvatar(c: ComponentNode, size: keyof typeof AVATAR, content: 'initials' | 'icon', user: ComponentNode) {
  const s = AVATAR[size]
  await style(c, { dir: 'row', align: 'center', justify: 'center', w: s.px, h: s.px, radius: 'radius/full', fill: 'role/band', stroke: ['role/fg', 0.1] })
  if (content === 'initials') {
    add(c, ref(await text('LH', s.text, 'role/fg-muted', { name: 'Initials' }), 'Initials'))
  } else add(c, iconInstance(user, s.icon, 'role/fg-muted'))
  // The status dot sits on the bottom-end edge, ringed in the page colour.
  const dot = rect('Status', s.dot, s.dot, 'role/success', 'radius/full')
  dot.strokes = [solid('role/canvas')]
  dot.strokeWeight = 2
  dot.strokeAlign = 'OUTSIDE'
  add(c, ref(dot, 'Status'))
  dot.layoutPositioning = 'ABSOLUTE'
  dot.x = s.px - s.dot
  dot.y = s.px - s.dot
  dot.constraints = { horizontal: 'MAX', vertical: 'MAX' }
  // Off by default, as the Status property is.
  dot.visible = false
}

export function avatarSpec(icons: Map<string, IconBuild>): SetSpec {
  const user = pick(icons, 'user').rest
  const variants: VariantSpec[] = []
  for (const content of ['initials', 'icon'] as const)
    for (const size of ['default', 'sm', 'lg'] as const) variants.push({ props: { Size: size, Content: content }, build: (c) => drawAvatar(c, size, content, user) })
  return {
    key: 'component:avatar',
    name: 'Avatar',
    description:
      'Avatar in packages/ui: a round role/band tile with a foreground/10 edge; the fallback is uppercase initials (or an icon). For a photo, give the instance an image fill. AvatarBadge is the Status dot. In code the image fades in on the base token once it loads.',
    variants,
    properties: [
      { name: 'Initials', type: 'TEXT', default: 'LH', field: 'characters' },
      { name: 'Status', type: 'BOOLEAN', default: false, field: 'visible' },
    ],
    columns: 'Size',
    gap: [32, 16],
  }
}

/* ── Alert ──────────────────────────────────────────────────────────────── */

const ALERT_TITLE = 'Heads up'
const ALERT_BODY = 'Review the changes below before you publish.'

const ALERT = {
  info: { tone: 'role/accent', edge: 0.25, wash: 0.06, icon: 'info' },
  success: { tone: 'role/success', edge: 0.3, wash: 0.06, icon: 'check-circle' },
  warning: { tone: 'role/warning', edge: 0.35, wash: 0.07, icon: 'alert-triangle' },
  danger: { tone: 'role/danger', edge: 0.3, wash: 0.06, icon: 'octagon-alert' },
} as const

export function alertSpec(icons: Map<string, IconBuild>): SetSpec {
  return {
    key: 'component:alert',
    name: 'Alert',
    description:
      'Alert in packages/ui: a hairline box washed in its tone (6–7%) with the tone’s icon, a medium title and a muted description. In code the icon plays once as the alert appears (none under reduced motion) and a dismissible alert collapses away.',
    variants: (Object.keys(ALERT) as (keyof typeof ALERT)[]).map((variant) => ({
      props: { Variant: variant },
      build: async (c: ComponentNode) => {
        const a = ALERT[variant]
        // One Title and one Description property across the set, so every variant shows the same copy.
        await style(c, { dir: 'row', gap: 'space/3', align: 'start', pad: [12, 14], w: 360, radius: 'radius/lg', fill: [a.tone, a.wash], stroke: [a.tone, a.edge] })
        c.setBoundVariable('paddingLeft', scaleVar('space/3-5'))
        c.setBoundVariable('paddingRight', scaleVar('space/3-5'))
        c.setBoundVariable('paddingTop', scaleVar('space/3'))
        c.setBoundVariable('paddingBottom', scaleVar('space/3'))
        const iconRow = figma.createFrame()
        await style(iconRow, { name: 'Icon', dir: 'row', align: 'center', h: 20 })
        add(iconRow, iconInstance(pick(icons, a.icon, 'info').rest, 16, a.tone))
        const body = figma.createFrame()
        await style(body, { name: 'Content', dir: 'col', gap: 'space/0-5', w: 'fill' })
        add(
          body,
          ref(await text(ALERT_TITLE, 'UI/base/Medium', 'role/fg', { name: 'Title', w: 'fill' }), 'Title'),
          ref(await text(ALERT_BODY, 'UI/base/Regular', 'role/fg-muted', { name: 'Description', w: 'fill' }), 'Description', 'Show description'),
        )
        add(c, iconRow, body)
      },
    })),
    properties: [
      { name: 'Title', type: 'TEXT', default: ALERT_TITLE, field: 'characters' },
      { name: 'Description', type: 'TEXT', default: ALERT_BODY, field: 'characters' },
      { name: 'Show description', type: 'BOOLEAN', default: true, field: 'visible' },
    ],
    columns: 'Variant',
    gap: [32, 16],
  }
}

/* ── Banner ─────────────────────────────────────────────────────────────── */

const BANNER_TITLE = 'Youj 0.1 is out'
const BANNER_ACTION = 'Read the notes'

const BANNER: Record<string, { fill: Ink; ink: string; edge: Ink | null }> = {
  default: { fill: 'role/band', ink: 'role/fg', edge: ['role/line', 1] },
  inverse: { fill: 'role/fg', ink: 'role/canvas', edge: null },
  accent: { fill: 'role/accent', ink: 'role/on-accent', edge: null },
  warning: { fill: 'role/warning-subtle', ink: 'role/fg', edge: 'role/warning-line' },
}

export function bannerSpec(icons: Map<string, IconBuild>): SetSpec {
  return {
    key: 'component:banner',
    name: 'Banner',
    description:
      'Banner in packages/ui: a full-bleed announcement bar, 40px at least, its message and action link centered on one line. Default is a role/band bar over a hairline; inverse flips the page colours; accent fills with the accent; warning washes the warning tone at 12% over a 35% hairline. Resize the instance to the width of the page. In code a dismiss button sits at the end and closes the bar by collapsing its height.',
    variants: Object.keys(BANNER).map((variant) => ({
      props: { Variant: variant },
      build: async (c: ComponentNode) => {
        const b = BANNER[variant]!
        await style(c, { dir: 'row', gap: 'space/3', align: 'center', justify: 'center', pad: [8, 16], w: 720, h: 40, fill: b.fill, ...(b.edge ? { stroke: b.edge, sides: { bottom: 1 } } : {}) })
        add(c, ref(await text(BANNER_TITLE, 'UI/base/Regular', b.ink, { name: 'Title' }), 'Title'))
        const action = figma.createFrame()
        await style(action, { name: 'Action', dir: 'row', gap: 'space/1', align: 'center' })
        add(
          action,
          await text(BANNER_ACTION, 'UI/base/Medium', b.ink, { name: 'Label' }),
          iconInstance(pick(icons, 'arrow-right').rest, 14, b.ink),
        )
        add(c, ref(action, 'Show action'))
      },
    })),
    properties: [
      { name: 'Title', type: 'TEXT', default: BANNER_TITLE, field: 'characters' },
      { name: 'Show action', type: 'BOOLEAN', default: true, field: 'visible' },
    ],
    columns: 'Variant',
    gap: [32, 16],
  }
}

/* ── Tooltip ────────────────────────────────────────────────────────────── */

export function tooltipSpec(): SetSpec {
  return {
    key: 'component:tooltip',
    name: 'Tooltip',
    description:
      'TooltipContent in packages/ui: an inverted chip (the foreground as its fill) with medium ui-sm text, and a keycap for a shortcut. In code it drifts 3px off its trigger on the fast token. Dark mode in code sets a raised chip with a line-strong edge instead of inverting; the kit, bound to role/fg, shows the inverted chip in both modes.',
    variants: [false, true].map((shortcut) => ({
      props: { Shortcut: String(shortcut) },
      build: async (c: ComponentNode) => {
        // Bezel: 8px corners, 4 × 9px padding.
        const bz = bezel()
        await style(c, { dir: 'row', gap: 'space/2', align: 'center', pad: shortcut ? [4, 4, 4, bz ? 9 : 8] : [4, bz ? 9 : 8], radius: bz ? 8 : 'radius/md', fill: 'role/fg', effect: 'Shadow/sm' })
        c.strokes = [clear()]
        c.strokesIncludedInLayout = true
        add(c, ref(await text('Copy link', 'UI/sm/Medium', 'role/canvas', { name: 'Label' }), 'Label'))
        if (!shortcut) return
        // Kbd inside a tooltip: border background/20, fill background/12, text background/85, no edge.
        const key = figma.createFrame()
        await style(key, { name: 'Kbd', dir: 'row', align: 'center', justify: 'center', pad: [0, 4], h: 20, radius: 'radius/sm', fill: ['role/canvas', 0.12], stroke: ['role/canvas', 0.2] })
        key.strokesIncludedInLayout = true
        key.minWidth = 20
        add(key, ref(await text('⌘C', 'UI/xs/Medium', ['role/canvas', 0.85] as Ink, { name: 'Key' }), 'Shortcut'))
        add(c, key)
      },
    })),
    properties: [
      { name: 'Label', type: 'TEXT', default: 'Copy link', field: 'characters' },
      { name: 'Shortcut', type: 'TEXT', default: '⌘C', field: 'characters' },
    ],
    columns: 'Shortcut',
    gap: [32, 16],
  }
}
