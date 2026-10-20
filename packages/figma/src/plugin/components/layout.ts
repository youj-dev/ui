import { add, bezel, box, context, rect, solid, style, text, type BoxProps, type Ink } from '../draw'
import { drawButton, iconInstance, type SIZES, type VARIANTS } from './button'
import { drawKbd } from './display'
import { drawCheckbox } from './fields'
import { badge, button, clear, controlHeight, eyebrow, fieldLook, figure, icon, iconProperty, instance, menuRow, padInline, panelLook, pick, spacer, surfaceLook, type Deps, type Entry, type Source } from './parts'
import { ref, type SetSpec, type VariantSpec } from './set'

/* Catalog batch: layout. Navigation, layout and lists, each from its file in
 * packages/ui/src/components/ui (see parts.ts for the shared pieces). States
 * are drawn at rest; the motion lives in code. */

const UI = 'packages/ui/src/components/ui/'

export const SOURCES: Source[] = [
  {
    file: `${UI}spinner.tsx`,
    classes: ['<LoaderRingIcon size={size} strokeWidth={Math.max(1.5, 36 / size)} />'],
  },
  {
    file: `${UI}empty.tsx`,
    classes: [
      "'group/empty-header flex max-w-sm flex-col items-center gap-1.5'",
      "'absolute inset-1 -z-1 rounded-lg border border-line bg-band'",
      '"grid size-full place-items-center rounded-xl border border-line bg-key text-fg shadow-sm"',
      "'text-ui-lg font-semibold tracking-tight text-fg'",
    ],
  },
  {
    file: `${UI}aspect-ratio.tsx`,
    classes: ["'relative aspect-(--ratio)'"],
  },
  {
    file: `${UI}typography.tsx`,
    classes: [
      "'scroll-m-20 text-4xl font-semibold tracking-[-0.035em] text-balance text-fg'",
      "'scroll-m-20 text-2xl leading-tight font-semibold tracking-[-0.025em] text-fg [&:not(:first-child)]:mt-10'",
      "'border-s-2 border-line-strong ps-4 text-[0.9375rem] leading-7 text-fg-muted [&:not(:first-child)]:mt-5'",
      "'rounded-sm border border-line bg-well px-[0.375em] py-[0.125em] font-mono text-[0.84em] text-fg'",
    ],
  },
  {
    file: `${UI}scroll-area.tsx`,
    classes: [
      "'data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2.5'",
      "'[clip-path:inset(1px_round_999px)] group-hover/scrollbar:[clip-path:inset(0_round_999px)] active:[clip-path:inset(0_round_999px)]'",
    ],
  },
  {
    file: `${UI}resizable.tsx`,
    classes: [
      "'group/handle relative flex shrink-0 items-center justify-center bg-line outline-none'",
      "'z-10 flex items-center justify-center rounded-sm border border-line bg-chrome-float text-fg-muted shadow-xs'",
      "'h-6 w-3.5 group-aria-[orientation=horizontal]/handle:h-3.5 group-aria-[orientation=horizontal]/handle:w-6'",
    ],
  },
  {
    file: `${UI}countdown.tsx`,
    classes: [
      "'group/countdown inline-flex items-start gap-2 text-4xl font-semibold tracking-tight tabular-nums sm:gap-3 sm:text-5xl'",
      "'flex overflow-clip rounded-lg border border-line bg-surface px-[0.2em] py-[0.12em] leading-none text-fg shadow-xs'",
      '"text-ui-xs font-medium tracking-[0.08em] text-fg-muted uppercase"',
    ],
  },
  {
    file: `${UI}stepper.tsx`,
    classes: [
      "'relative grid size-6 shrink-0 place-items-center rounded-mark border text-ui-sm font-medium tabular-nums'",
      "'data-[status=upcoming]:border-line data-[status=upcoming]:bg-surface data-[status=upcoming]:text-fg-muted'",
      "'data-[status=current]:border-accent data-[status=current]:bg-accent data-[status=current]:text-on-accent data-[status=current]:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-accent)_18%,transparent)]'",
      "'relative overflow-hidden rounded-full bg-line'",
    ],
  },
  {
    file: `${UI}stepper-nav.tsx`,
    classes: ['<nav data-slot="stepper-nav" aria-label={label ?? labels.progress} className={cn(\'w-full\', className)} {...props}>'],
  },
  {
    file: `${UI}anchor-nav.tsx`,
    classes: [
      "'flex min-h-7 flex-1 items-center rounded-e-md py-1 pe-2 text-fg-muted'",
      '"bg-transparent before:absolute before:inset-y-1 before:-start-px before:w-0.5 before:rounded-full before:bg-accent"',
      '"relative isolate flex flex-col border-s border-line"',
    ],
  },
  {
    file: `${UI}app-header.tsx`,
    classes: [
      "rest: 'h-[calc(var(--spacing-control)+--spacing(6))]'",
      "'group/app-header z-40 flex w-full shrink-0 items-center gap-2 border-b border-transparent px-3 text-ui text-fg md:gap-4 md:px-5'",
      "'inline-flex h-control shrink-0 items-center gap-2 rounded-md px-1 text-ui-lg font-semibold tracking-tight text-fg focus-ring'",
      "'justify-start bg-transparent font-normal text-fg-muted shadow-none hover:text-fg md:w-56 lg:w-64'",
    ],
  },
  {
    file: `${UI}app-page.tsx`,
    classes: [
      "'flex w-full min-w-0 flex-col gap-4 p-4 @3xl:gap-5 @3xl:p-6 @6xl:p-8'",
      "'flex flex-wrap items-end justify-between gap-x-4 gap-y-3'",
      '"text-2xl font-semibold tracking-tight text-fg"',
      '"text-ui text-fg-muted"',
    ],
  },
  {
    file: `${UI}bottom-tab-bar.tsx`,
    classes: [
      "'fixed inset-x-0 bottom-0 z-40 border-t border-line yj-glass text-fg'",
      "'group/tab flex min-h-14 w-full flex-col items-center justify-start gap-1 rounded-md pt-2 pb-1.5 text-fg-muted outline-none select-none'",
      "'relative grid h-8 w-14 place-items-center rounded-lg'",
      '"bg-transparent before:absolute before:top-2 before:left-1/2 before:h-8 before:w-14 before:-translate-x-1/2 before:rounded-lg before:bg-selected"',
    ],
  },
  {
    file: `${UI}item-pager.tsx`,
    classes: ['variant="outline"', 'size="icon-xs"', '"ms-1.5 text-ui-sm text-fg-muted tabular-nums whitespace-nowrap"'],
  },
  {
    file: `${UI}wizard.tsx`,
    classes: [
      '"text-ui-lg font-semibold tracking-tight text-fg outline-none"',
      '"flex items-center gap-2 border-t border-line pt-4"',
      '"-mb-3 text-ui-sm text-fg-muted tabular-nums"',
    ],
  },
  {
    file: `${UI}toolbar.tsx`,
    classes: [
      "'flex w-fit items-center gap-1 rounded-lg border border-line bg-chrome-float p-1 text-fg shadow-xs'",
      "'flex items-center gap-0.5 data-[orientation=vertical]:flex-col'",
      "'shrink-0 self-center bg-line data-[orientation=vertical]:mx-1 data-[orientation=vertical]:h-4 data-[orientation=vertical]:w-px'",
      "'h-control-sm w-40 rounded-field-sm px-2'",
    ],
  },
  {
    file: `${UI}capsule.tsx`,
    classes: [
      "'inline-flex max-w-full shrink-0 items-center gap-1 rounded-2xl border border-line bg-chrome-float p-1 text-fg shadow-xs'",
      "default: 'h-[calc(var(--spacing-control)+--spacing(2))]'",
      "'shrink-0 px-2 text-ui-sm whitespace-nowrap text-fg-muted'",
    ],
  },
  {
    file: `${UI}capsule-player.tsx`,
    classes: [
      '"relative aspect-square h-full shrink-0 overflow-hidden rounded-xl bg-band [&>img]:size-full [&>img]:object-cover"',
      '"block truncate text-ui-sm font-medium text-fg"',
      '"relative h-[3px] w-full rounded-full bg-well"',
      '"shrink-0 font-mono text-ui-xs text-fg-muted tabular-nums"',
    ],
  },
  {
    file: `${UI}capsule-search.tsx`,
    classes: [
      "'flex max-w-full shrink-0 cursor-text items-center gap-2 overflow-hidden rounded-2xl border border-line bg-surface ps-3 pe-1 text-fg shadow-xs'",
      "width = { rest: '11rem', open: '18rem' }",
    ],
  },
  {
    file: `${UI}capsule-stepper.tsx`,
    classes: [
      '"h-full bg-transparent text-center font-mono text-ui-lg font-medium text-fg tabular-nums outline-none"',
      '"-ms-1 pe-1 text-ui-sm text-fg-muted"',
    ],
  },
  {
    file: 'packages/ui/src/styles/bezel.css',
    classes: [
      'border-radius: var(--radius-control-lg);\n        background-color: var(--bz-capsule);',
      'border-radius: max(0px, calc(var(--radius-control-lg) - 4px));',
    ],
  },
]

const sans = (weight: 400 | 500 | 600) => context().fonts.font('sans', weight)

/* ── Spinner ────────────────────────────────────────────────────────────── */

function spinnerSpec({ icons }: Deps): SetSpec {
  const ring = pick(icons, 'loader-ring')
  return {
    key: 'component:spinner',
    name: 'Spinner',
    description:
      'Spinner in packages/ui: Youj’s loader-ring icon, a constant 1.5px stroke at small sizes, in the current text colour. In code it turns at a constant rate with a breathing arc; under reduced motion it holds a quarter arc on a faint track. Drawn at rest.',
    variants: ([16, 20, 24, 32] as const).map((px) => ({
      props: { Size: String(px) },
      build: async (c: ComponentNode) => {
        await style(c, { dir: 'row', align: 'center', justify: 'center', w: px, h: px })
        add(c, ref(icon(icons, 'loader-ring', px, 'role/fg-muted'), 'Icon'))
      },
    })),
    properties: [iconProperty(icons, ring, ['loader-ring', 'loader-dots'])],
    columns: 'Size',
    gap: [32, 16],
  }
}

/* ── Empty ──────────────────────────────────────────────────────────────── */

async function drawEmpty(c: ComponentNode, media: 'icon' | 'none', action: boolean, deps: Deps) {
  await style(c, { dir: 'col', align: 'center', gap: 'space/5', pad: 32, w: 400, radius: 'radius/xl' })
  for (const side of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] as const) c.setBoundVariable(side, context().vars.get('scale', 'space/8'))
  const header = await box({ name: 'Header', dir: 'col', align: 'center', gap: 'space/1-5', w: 'fill' })
  if (media === 'icon') {
    // The tile over two plates; in code the plates fan ±10° about their bottom corners.
    const m = await box({ name: 'Media', dir: 'none', w: 48, h: 60 })
    const plateL = rect('Plate', 40, 40, 'role/band', 'radius/lg')
    const plateR = rect('Plate', 40, 40, 'role/band', 'radius/lg')
    for (const p of [plateL, plateR]) {
      p.strokes = [solid('role/line')]
      p.strokeWeight = 1
      p.strokeAlign = 'INSIDE'
    }
    const tile = await box(
      { name: 'Tile', dir: 'row', align: 'center', justify: 'center', w: 48, h: 48, radius: 'radius/xl', fill: 'role/key', stroke: 'role/line', effect: 'Shadow/sm' },
      ref(icon(deps.icons, 'inbox', 20, 'role/fg'), 'Icon'),
    )
    add(m, plateL, plateR, tile)
    plateL.x = -4
    plateL.y = 6
    plateL.rotation = 10
    plateR.x = 12
    plateR.y = 4
    plateR.rotation = -10
    tile.x = 0
    tile.y = 0
    add(header, m)
  }
  add(
    header,
    ref(await text('No messages yet', 'UI/lg/Semibold', 'role/fg', { name: 'Title', align: 'CENTER' }), 'Title'),
    ref(await text('When someone writes to this project, it shows up here.', 'UI/base/Regular', 'role/fg-muted', { name: 'Description', w: 'fill', align: 'CENTER' }), 'Description'),
  )
  add(c, header)
  if (action) {
    const actions = await box({ name: 'Content', dir: 'row', gap: 'space/2', justify: 'center', w: 'fill' })
    const primary = button(deps.get, 'Invite people')
    const secondary = button(deps.get, 'Learn more', { Variant: 'outline' })
    add(actions, primary, secondary)
    add(c, actions)
    primary.isExposedInstance = true
    secondary.isExposedInstance = true
  }
}

function emptySpec(deps: Deps): SetSpec {
  const inbox = pick(deps.icons, 'inbox')
  const variants: VariantSpec[] = []
  for (const media of ['icon', 'none'] as const)
    for (const action of [true, false]) variants.push({ props: { Media: media, Actions: String(action) }, build: (c) => drawEmpty(c, media, action, deps) })
  return {
    key: 'component:empty',
    name: 'Empty',
    description:
      'Empty in packages/ui: what isn’t here yet, why, and what to do about it. The icon sits on a raised tile (role/key, Shadow/sm) over two role/band plates fanned a few degrees out; a semibold ui-lg title, a muted description, and the actions under them. In code the plates fan out as it appears and a little further on hover, where the icon plays.',
    variants,
    properties: [
      { name: 'Title', type: 'TEXT', default: 'No messages yet', field: 'characters' },
      { name: 'Description', type: 'TEXT', default: 'When someone writes to this project, it shows up here.', field: 'characters' },
      iconProperty(deps.icons, inbox, ['inbox', 'search', 'folder', 'file', 'users', 'bell', 'image']),
    ],
    columns: 'Actions',
    gap: [40, 24],
  }
}

/* ── AspectRatio ────────────────────────────────────────────────────────── */

function aspectRatioSpec({ icons }: Deps): SetSpec {
  const W = 240
  const ratios: [string, number][] = [
    ['16:9', 16 / 9],
    ['4:3', 4 / 3],
    ['1:1', 1],
    ['4:5', 4 / 5],
  ]
  return {
    key: 'component:aspect-ratio',
    name: 'Aspect ratio',
    description:
      'AspectRatio in packages/ui: a box that keeps its shape as its width changes (the CSS aspect-ratio), so the space is reserved before an image loads. Drawn as a media placeholder at the common ratios; put an image fill in it, or resize it keeping the ratio (shift-drag).',
    variants: ratios.map(([name, r]) => ({
      props: { Ratio: name },
      build: async (c: ComponentNode) => {
        await style(c, { dir: 'row', align: 'center', justify: 'center', w: r >= 1 ? W : Math.round(W * r * 0.75), h: Math.round((r >= 1 ? W : W * r * 0.75) / r), radius: 'radius/lg', fill: 'role/band', clip: true })
        add(c, icon(icons, 'image', 24, 'role/fg-subtle'))
      },
    })),
    properties: [],
    columns: 'Ratio',
    gap: [32, 16],
  }
}

/* ── Typography ─────────────────────────────────────────────────────────── */

type Element = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'lead' | 'large' | 'small' | 'muted' | 'blockquote' | 'inline-code'

const SAMPLE: Record<Element, string> = {
  h1: 'Ship the kit',
  h2: 'Getting started',
  h3: 'Install the package',
  h4: 'Peer dependencies',
  p: 'Every component reads the theme’s tokens, so a preset change re-themes the whole page at once.',
  lead: 'Accessible components that move with intent.',
  large: 'Are you absolutely sure?',
  small: 'Email address',
  muted: 'Enter your email address.',
  blockquote: '“The best interface is the one you don’t notice.”',
  'inline-code': 'pnpm add @youj/react',
}

async function drawType(c: ComponentNode, el: Element) {
  await style(c, { dir: 'col', w: 480 })
  const fill = (t: TextNode) => ref(t, 'Text')
  const W = { w: 'fill' as const, name: 'Text' }
  let t: TextNode
  switch (el) {
    case 'h1':
      t = await text(SAMPLE.h1, 'Heading/4xl', 'role/fg', W)
      break
    case 'h2':
      t = await text(SAMPLE.h2, 'Heading/2xl', 'role/fg', W)
      break
    case 'h3':
      t = await text(SAMPLE.h3, 'Heading/lg', 'role/fg', W)
      break
    case 'h4':
      t = await text(SAMPLE.h4, 'Body/base', 'role/fg', W)
      t.fontName = sans(600)
      break
    case 'p':
      t = await text(SAMPLE.p, 'Body/base', 'role/fg', W)
      break
    case 'lead':
      t = await text(SAMPLE.lead, 'Body/lg', 'role/fg-muted', W)
      break
    case 'large':
      t = await text(SAMPLE.large, 'UI/lg/Semibold', 'role/fg', W)
      break
    case 'small':
      t = await text(SAMPLE.small, 'UI/sm/Medium', 'role/fg', W)
      break
    case 'muted':
      t = await text(SAMPLE.muted, 'UI/sm/Regular', 'role/fg-muted', W)
      break
    case 'blockquote': {
      const q = await box({ name: 'Blockquote', dir: 'col', pad: [0, 0, 0, 16], w: 'fill', stroke: 'role/line-strong', sides: { left: 2 } })
      add(q, fill(await text(SAMPLE.blockquote, 'Body/base', 'role/fg-muted', W)))
      add(c, q)
      return
    }
    case 'inline-code': {
      const code = await box({ name: 'Code', dir: 'row', pad: [2, 5], radius: 'radius/sm', fill: 'role/well', stroke: 'role/line' })
      add(code, fill(await text(SAMPLE['inline-code'], 'Mono/sm', 'role/fg', { name: 'Text' })))
      add(c, code)
      return
    }
  }
  add(c, fill(t))
}

function typographySpec(): SetSpec {
  const els: Element[] = ['h1', 'h2', 'h3', 'h4', 'p', 'lead', 'large', 'small', 'muted', 'blockquote', 'inline-code']
  return {
    key: 'component:typography',
    name: 'Typography',
    description:
      'Typography in packages/ui: the prose elements (TypographyH1…H4, P, Lead, Large, Small, Muted, Blockquote, InlineCode) in the kit’s text styles. Blockquote a 2px role/line-strong edge, InlineCode a role/well chip. The paragraph’s 15px and the tighter heading tracking are approximated by the nearest styles.',
    variants: els.map((el) => ({ props: { Element: el }, build: (c: ComponentNode) => drawType(c, el) })),
    properties: [{ name: 'Text', type: 'TEXT', default: 'Ship the kit', field: 'characters' }],
    columns: 'Element',
  }
}

/* ── ScrollArea ─────────────────────────────────────────────────────────── */

async function drawScrollArea(c: ComponentNode, orientation: 'vertical' | 'horizontal', bar: boolean) {
  const vertical = orientation === 'vertical'
  const W = vertical ? 240 : 360
  const H = vertical ? 200 : 132
  await style(c, { dir: 'none', w: W, h: H, radius: 'radius/lg', stroke: 'role/line', clip: true })
  const list = await box({ name: 'Viewport', dir: vertical ? 'col' : 'row', gap: vertical ? 0 : 'space/3', pad: vertical ? [4, 16] : 16 })
  if (vertical) {
    for (const tag of ['v1.2.0-beta.1', 'v1.2.0-beta.2', 'v1.2.0-rc.1', 'v1.2.0', 'v1.2.1', 'v1.3.0-beta.1', 'v1.3.0']) {
      const row = await box({ name: 'Row', dir: 'row', pad: [8, 0], w: W - 32, stroke: 'role/line', sides: { bottom: 1 } })
      add(row, await text(tag, 'UI/base/Regular', 'role/fg', { name: 'Tag' }))
      add(list, row)
    }
  } else {
    for (const n of ['Ornella', 'Tom', 'Laura', 'Dmitri', 'Ines']) {
      const card = await box({ name: 'Card', dir: 'col', gap: 'space/2', w: 120 })
      add(card, rect('Photo', 120, 72, 'role/band', 'radius/md'), await text(n, 'UI/sm/Regular', 'role/fg-muted', { name: 'Caption' }))
      add(list, card)
    }
  }
  add(c, list)
  list.x = 0
  list.y = 0
  if (!bar) return
  // The overlay bar (w-2.5, 1px in) shows while hovering or scrolling: a 6px pill thumb on no track.
  const thumb = rect('Thumb', vertical ? 6 : 96, vertical ? 64 : 6, 'role/line-strong', 'radius/full')
  add(c, thumb)
  thumb.x = vertical ? W - 8 : 24
  thumb.y = vertical ? 24 : H - 8
}

function scrollAreaSpec(): SetSpec {
  const variants: VariantSpec[] = []
  for (const orientation of ['vertical', 'horizontal'] as const)
    for (const bar of [true, false]) variants.push({ props: { Orientation: orientation, Scrollbar: bar ? 'shown' : 'hidden' }, build: (c) => drawScrollArea(c, orientation, bar) })
  return {
    key: 'component:scroll-area',
    name: 'Scroll area',
    description:
      'ScrollArea in packages/ui: a viewport with overlay scrollbars that show while you hover or scroll and fade away after, its content fading out at the edges it can scroll toward. The thumb is a 6px pill (8px with the pointer on the bar). Drawn with the bar shown and hidden; the edge fade lives in code.',
    variants,
    properties: [],
    columns: 'Scrollbar',
    gap: [40, 24],
  }
}

/* ── Resizable ──────────────────────────────────────────────────────────── */

async function drawResizable(c: ComponentNode, orientation: 'horizontal' | 'vertical', grip: boolean, deps: Deps) {
  const horizontal = orientation === 'horizontal'
  await style(c, { dir: horizontal ? 'row' : 'col', w: 400, h: 220, radius: 'radius/lg', stroke: 'role/line', clip: true })
  const panel = async (name: string, size: number) => {
    const p = await box({ name: 'Panel', dir: 'col', align: 'center', justify: 'center', w: horizontal ? size : 'fill', h: horizontal ? 'fill' : size })
    add(p, await text(name, 'UI/base/Medium', 'role/fg-muted', { name: 'Label' }))
    return p
  }
  // The separator: a 1px role/line, with an optional grip (h-6 w-3.5, rotated for a horizontal line) on it.
  const handle = await box({ name: 'Handle', dir: 'row', align: 'center', justify: 'center', w: horizontal ? 1 : 'fill', h: horizontal ? 'fill' : 1, fill: 'role/line' })
  if (grip) {
    handle.clipsContent = false
    const g = await box(
      { name: 'Grip', dir: 'row', align: 'center', justify: 'center', w: horizontal ? 14 : 24, h: horizontal ? 24 : 14, radius: 'radius/sm', fill: 'role/chrome-float', stroke: 'role/line', effect: 'Shadow/xs' },
      icon(deps.icons, horizontal ? 'grip' : 'grip-horizontal', 12, 'role/fg-muted'),
    )
    add(handle, g)
    g.layoutPositioning = 'ABSOLUTE'
    g.x = horizontal ? -7 : 188
    g.y = horizontal ? 98 : -7
  }
  add(c, await panel('Sidebar', 140), handle, await panel('Content', 100))
  const last = c.children[c.children.length - 1] as FrameNode
  if (horizontal) last.layoutSizingHorizontal = 'FILL'
  else last.layoutSizingVertical = 'FILL'
}

function resizableSpec(deps: Deps): SetSpec {
  const variants: VariantSpec[] = []
  for (const orientation of ['horizontal', 'vertical'] as const)
    for (const grip of [true, false]) variants.push({ props: { Orientation: orientation, Handle: String(grip) }, build: (c) => drawResizable(c, orientation, grip, deps) })
  return {
    key: 'component:resizable',
    name: 'Resizable',
    description:
      'ResizablePanelGroup in packages/ui: panels split by a 1px role/line separator, with an optional grip (`withHandle`, role/chrome-float with Shadow/xs) where the split isn’t otherwise obvious. In code hovering wakes a 3px accent rail after a beat, dragging lights it in the focus colour and the grip fuses its dots.',
    variants,
    properties: [],
    columns: 'Handle',
    gap: [40, 24],
  }
}

/* ── Countdown ──────────────────────────────────────────────────────────── */

async function drawCountdown(c: ComponentNode, state: 'running' | 'complete') {
  await style(c, { dir: 'row', gap: 'space/3', align: 'start' })
  const ink: Ink = state === 'running' ? 'role/fg' : 'role/fg-muted'
  const units: [string, string][] = state === 'running' ? [['02', 'Days'], ['14', 'Hours'], ['36', 'Minutes'], ['09', 'Seconds']] : [['00', 'Days'], ['00', 'Hours'], ['00', 'Minutes'], ['00', 'Seconds']]
  for (const [digits, unit] of units) {
    const u = await box({ name: 'Unit', dir: 'col', align: 'center', gap: 'space/2' })
    // px 0.2em, py 0.12em of the 48px digits.
    const face = await box({ name: 'Digits', dir: 'row', pad: [6, 10], radius: 'radius/lg', fill: 'role/surface', stroke: 'role/line', effect: 'Shadow/xs' })
    add(face, await text(digits, 'Heading/5xl', ink, { name: 'Digits' }))
    add(u, face, await text(unit, 'UI/xs/Caps', 'role/fg-muted', { name: 'Unit' }))
    add(c, u)
  }
}

function countdownSpec(): SetSpec {
  return {
    key: 'component:countdown',
    name: 'Countdown',
    description:
      'Countdown in packages/ui: days, hours, minutes and seconds left to a date, each pair of digits on a raised role/surface face with its unit in muted capitals under it. In code each digit rolls on change and the faces turn muted once it reaches zero (Complete) or before the first reading.',
    variants: (['running', 'complete'] as const).map((state) => ({ props: { State: state }, build: (c: ComponentNode) => drawCountdown(c, state) })),
    properties: [],
    columns: 'State',
    gap: [48, 16],
  }
}

/* ── Stepper (and StepperNav) ───────────────────────────────────────────── */

type StepStatus = 'complete' | 'current' | 'upcoming' | 'error'

async function stepDisc(status: StepStatus, n: number, check: ComponentNode, alert: ComponentNode) {
  const look: Record<StepStatus, { fill: Ink; edge: Ink; ink: string }> = {
    upcoming: { fill: 'role/surface', edge: 'role/line', ink: 'role/fg-muted' },
    current: { fill: 'role/accent', edge: 'role/accent', ink: 'role/on-accent' },
    complete: { fill: 'role/accent-subtle', edge: 'role/accent-line', ink: 'role/accent-text' },
    error: { fill: 'role/surface', edge: 'role/danger', ink: 'role/danger-text' },
  }
  const l = look[status]
  // rounded-mark: a disc in pill themes, the xs control corner otherwise (the button corner follows the same switch).
  const disc = await box({ name: 'Indicator', dir: 'row', align: 'center', justify: 'center', w: 24, h: 24, radius: 'bezel/pill', fill: l.fill, stroke: l.edge })
  if (status === 'complete') add(disc, iconInstance(check, 14, l.ink))
  else if (status === 'error') add(disc, iconInstance(alert, 14, l.ink))
  else add(disc, await text(String(n), 'UI/sm/Medium', l.ink, { name: 'Number' }))
  if (status !== 'current') return disc
  // The current disc's 3px accent/18 halo, outside its box so the discs stay in line.
  const holder = await box({ name: 'Indicator', dir: 'none', w: 24, h: 24 })
  const halo = await box({ name: 'Halo', dir: 'none', w: 30, h: 30, radius: 'bezel/pill', fill: ['role/accent', 0.18] })
  add(holder, halo, disc)
  halo.x = -3
  halo.y = -3
  disc.x = 0
  disc.y = 0
  return holder
}

async function drawStepper(c: ComponentNode, orientation: 'horizontal' | 'vertical', current: number, deps: Deps) {
  const check = pick(deps.icons, 'check').rest
  const alert = pick(deps.icons, 'alert-triangle').rest
  const steps = [
    ['Account', 'Your details'],
    ['Workspace', 'Name and members'],
    ['Billing', 'Optional'],
    ['Review', 'Confirm and create'],
  ]
  const horizontal = orientation === 'horizontal'
  await style(c, { dir: horizontal ? 'row' : 'col', align: 'start', gap: horizontal ? 'space/3' : 0, w: horizontal ? 720 : 280 })
  for (let i = 0; i < steps.length; i++) {
    const status: StepStatus = i < current ? 'complete' : i === current ? 'current' : 'upcoming'
    const last = i === steps.length - 1
    const item = await box({ name: 'Step', dir: horizontal ? 'row' : 'col', align: 'start', gap: horizontal ? 'space/3' : 0, w: horizontal && !last ? 'fill' : 'hug' })
    const head = await box({ name: 'Label', dir: 'row', align: 'start', gap: 'space/2-5' })
    const disc = await stepDisc(status, i + 1, check, alert)
    const words = await box({ name: 'Text', dir: 'col', pad: horizontal ? 0 : [2, 0, 0, 0] })
    add(
      words,
      await text(steps[i]![0]!, 'UI/base/Medium', status === 'upcoming' ? 'role/fg-muted' : 'role/fg', { name: 'Title' }),
      await text(steps[i]![1]!, 'UI/sm/Regular', 'role/fg-muted', { name: 'Description' }),
    )
    add(head, disc, words)
    add(item, head)
    if (!last) {
      const filled = i < current
      if (horizontal) {
        const line = await box({ name: 'Connector', dir: 'row', pad: [12, 0, 0, 0], w: 'fill' })
        add(line, rect('Line', 24, 1, filled ? 'role/accent' : 'role/line', 'radius/full'))
        ;(line.children[0] as RectangleNode).layoutSizingHorizontal = 'FILL'
        add(item, line)
      } else {
        const line = await box({ name: 'Connector', dir: 'row', pad: [4, 0, 4, 12], h: 32 })
        add(line, rect('Line', 1, 24, filled ? 'role/accent' : 'role/line', 'radius/full'))
        ;(line.children[0] as RectangleNode).layoutSizingVertical = 'FILL'
        add(item, line)
      }
    }
    add(c, item)
  }
}

function stepperSpec(deps: Deps): SetSpec {
  const variants: VariantSpec[] = []
  for (const orientation of ['horizontal', 'vertical'] as const)
    for (const current of [1, 3]) variants.push({ props: { Orientation: orientation, Current: String(current + 1) }, build: (c) => drawStepper(c, orientation, current, deps) })
  return {
    key: 'component:stepper',
    name: 'Stepper',
    description:
      'Stepper in packages/ui (and StepperNav, the same steps as links in a nav landmark): numbered discs joined by connectors. Done steps are an accent-tinted disc with a check, the current one the accent with a 3px accent/18 halo, upcoming ones a quiet surface disc; an invalid step turns danger. In code the connector fills as a step completes and the check draws itself; on phones the titles drop and the discs stay.',
    variants,
    properties: [],
    columns: 'Current',
    gap: [40, 32],
  }
}

/* ── Shared: drawn buttons, keys and the capsule ──────────────────────────── */

type ButtonVariant = (typeof VARIANTS)[number]
type ButtonSize = (typeof SIZES)[number]

/** A button drawn by Button's own builder, with any icon (an instance can't recolour a swapped icon). */
async function drawnButton(deps: Deps, variant: ButtonVariant, size: ButtonSize, iconName: string | null, label = '', state: 'rest' | 'hover' | 'disabled' = 'rest') {
  const f = figma.createFrame()
  await drawButton(f, variant, size, state, label, iconName ? pick(deps.icons, iconName).rest : null, false)
  f.name = label || `${iconName} button`
  return f
}

/** A keycap drawn by Kbd's own builder. */
async function kbd(chars: string) {
  const f = figma.createFrame()
  await drawKbd(f, chars, null)
  f.name = 'Kbd'
  return f
}

/** The capsule (capsule.tsx; bezel.css "Capsules"): a floating pill, 4px in, everything nested at the concentric corner. */
function capsuleLook(): Partial<BoxProps> {
  return bezel()
    ? { fill: 'bezel/capsule', stroke: ['role/fg', 0.06], effect: 'Shadow/sm', radius: 'bezel/pill', pad: 4, gap: 'space/1' }
    : { fill: 'role/chrome-float', stroke: 'role/line', effect: 'Shadow/xs', radius: 'radius/2xl', pad: 4, gap: 'space/1' }
}
/** The corner of what sits inside a capsule: radius-control-lg − 4px in Bezel, rounded-xl in Classic. */
const capsuleInner = () => (bezel() ? 'bezel/pill' : 'radius/xl')
/** CapsuleLabel: muted ui-sm, Bezel's mono capital eyebrow. */
const capsuleLabel = async (chars: string) => {
  const l = await box({ name: 'Label', dir: 'row', pad: [0, 8] })
  add(l, ref(await eyebrow(chars), 'Label'))
  return l
}

/* ── AnchorNav ──────────────────────────────────────────────────────────── */

async function drawAnchorNav(c: ComponentNode, active: number) {
  await style(c, { dir: 'col', gap: 'space/2', w: 220 })
  add(c, ref(await text('On this page', 'UI/sm/Medium', 'role/fg', { name: 'Title' }), 'Title'))
  const items: [string, number][] = [
    ['Installation', 0],
    ['Usage', 0],
    ['Props', 1],
    ['Accessibility', 1],
    ['Motion', 0],
    ['Examples', 0],
  ]
  const list = await box({ name: 'List', dir: 'col', w: 'fill', stroke: 'role/line', sides: { left: 1 } })
  for (let i = 0; i < items.length; i++) {
    const [label, depth] = items[i]!
    const on = i === active
    const row = await box({ name: on ? 'Item (current)' : 'Item', dir: 'row', align: 'center', pad: [4, 8, 4, depth ? 24 : 12], w: 'fill' })
    row.minHeight = 28
    add(row, await text(label, 'UI/base/Regular', on ? 'role/fg' : 'role/fg-muted', { name: 'Label' }))
    if (on) {
      // The sliding indicator: a 2px accent bar over the list's edge, 4px in from the row's ends.
      const bar = rect('Indicator', 2, 20, 'role/accent', 'radius/full')
      add(row, bar)
      bar.layoutPositioning = 'ABSOLUTE'
      bar.x = -1
      bar.y = 4
    }
    add(list, row)
  }
  add(c, list)
}

function anchorNavSpec(): SetSpec {
  return {
    key: 'component:anchor-nav',
    name: 'Anchor nav',
    description:
      'AnchorNav in packages/ui: “On this page” links along a role/line edge, nested ones further in, the section in view in full ink with a 2px accent bar on the edge. In code the bar slides between links as you scroll (scroll-spy), and a click scrolls smoothly (instantly under reduced motion).',
    variants: (['top', 'nested'] as const).map((at) => ({ props: { Current: at }, build: (c: ComponentNode) => drawAnchorNav(c, at === 'top' ? 0 : 2) })),
    properties: [{ name: 'Title', type: 'TEXT', default: 'On this page', field: 'characters' }],
    columns: 'Current',
    gap: [48, 16],
  }
}

/* ── AppHeader ──────────────────────────────────────────────────────────── */

async function drawAppHeader(c: ComponentNode, state: 'rest' | 'surface' | 'condensed', deps: Deps) {
  const surface = state !== 'rest'
  // Height: the control height plus 24 (16 condensed), as block padding around control-height content.
  await style(c, { dir: 'row', align: 'center', gap: 'space/4', pad: [12, 20], w: 960, fill: surface ? 'role/chrome' : undefined, stroke: surface ? 'role/line' : clear(), sides: { bottom: 1 }, effect: state === 'condensed' ? 'Shadow/xs' : undefined })
  c.setBoundVariable('paddingTop', context().vars.get('scale', state === 'condensed' ? 'space/2' : 'space/3'))
  c.setBoundVariable('paddingBottom', context().vars.get('scale', state === 'condensed' ? 'space/2' : 'space/3'))
  padInline(c, 'space/5')
  const brand = await box({ name: 'Brand', dir: 'row', align: 'center', gap: 'space/2', pad: [0, 4] })
  controlHeight(brand)
  add(brand, ref(icon(deps.icons, 'shapes', 20, 'role/fg'), 'Logo'), ref(await text('Youj', 'UI/lg/Semibold', 'role/fg', { name: 'Name' }), 'Name'))
  const nav = await box({ name: 'Nav', dir: 'row', align: 'center', gap: 'space/1' })
  for (const [i, l] of ['Docs', 'Components', 'Pricing'].entries()) add(nav, await drawnButton(deps, 'ghost', 'sm', null, l, i === 0 ? 'hover' : 'rest'))
  // AppHeaderSearch: an outline button read as a field, 224 wide, its label muted and the ⌘K keys at the end.
  const search = await box({ name: 'Search', dir: 'row', align: 'center', gap: 'space/2', w: 224, radius: 'bezel/pill', stroke: 'role/line' })
  padInline(search, 'space/3', 'space/1-5')
  controlHeight(search)
  add(
    search,
    icon(deps.icons, 'search', 16, 'role/fg-muted'),
    ref(await text('Search…', 'UI/base/Regular', 'role/fg-muted', { name: 'Placeholder', w: 'fill', truncate: true }), 'Placeholder'),
    await box({ name: 'Shortcut', dir: 'row', gap: 'space/1' }, await kbd('⌘'), await kbd('K')),
  )
  const actions = await box({ name: 'Actions', dir: 'row', align: 'center', gap: 'space/2' })
  const avatar = instance(deps.get, 'avatar', { Size: 'default', Content: 'initials' })
  add(actions, search, await drawnButton(deps, 'ghost', 'icon', 'sun'), avatar)
  add(c, brand, nav, await spacer(), actions)
}

function appHeaderSpec(deps: Deps): SetSpec {
  return {
    key: 'component:app-header',
    name: 'App header',
    description:
      'AppHeader in packages/ui: the brand, the primary links and the actions (a field-like search with ⌘K, an icon button, the avatar) on one bar, the control height plus 24 tall. At the top of the page it has no surface; once content scrolls under it it takes the glass chrome and a hairline (Surface), and condenses by 8 with a small shadow (Condensed). Under md the links fold into a menu sheet. In code the height, surface and shadow ease on the base token.',
    variants: (['rest', 'surface', 'condensed'] as const).map((state) => ({ props: { State: state }, build: (c: ComponentNode) => drawAppHeader(c, state, deps) })),
    properties: [
      { name: 'Name', type: 'TEXT', default: 'Youj', field: 'characters' },
      { name: 'Placeholder', type: 'TEXT', default: 'Search…', field: 'characters' },
      iconProperty(deps.icons, pick(deps.icons, 'shapes'), ['shapes', 'hexagon', 'sparkles', 'zap', 'rocket'], 'Logo'),
    ],
    columns: 'State',
    gap: [24, 24],
  }
}

/* ── AppPage ──────────────────────────────────────────────────────────── */

async function drawAppPage(c: ComponentNode, actions: boolean, deps: Deps) {
  await style(c, { dir: 'col', gap: 'space/5', pad: 32, w: 960 })
  const heading = await box({ name: 'Heading', dir: 'col', gap: 'space/1', w: 'fill' })
  add(heading, await text('Customers', 'Heading/2xl', 'role/fg', { name: 'Title' }), await text('Every account you bill, how it’s doing, and who looks after it.', 'UI/base/Regular', 'role/fg-muted', { name: 'Description' }))
  const header = await box({ name: 'Header', dir: 'row', align: 'end', gap: 'space/4', w: 'fill' }, heading)
  if (actions) add(header, await box({ name: 'Actions', dir: 'row', align: 'center', gap: 'space/2' }, await drawnButton(deps, 'outline', 'sm', 'upload', 'Import'), await drawnButton(deps, 'default', 'sm', 'plus', 'New customer')))
  const body = await box({ name: 'Your sections', dir: 'row', align: 'center', justify: 'center', w: 'fill', h: 160, radius: 'radius/xl', fill: 'role/band' }, await text('Your sections', 'UI/sm/Regular', 'role/fg-muted', { name: 'Hint' }))
  add(c, header, body)
}

function appPageSpec(deps: Deps): SetSpec {
  return {
    key: 'component:app-page',
    name: 'App page',
    description:
      'AppPage in packages/ui: a page inside an app frame. The header sets the title (2xl semibold), a muted line under it and the actions at its end, aligned to the bottom; the sections stack under it on the page’s gutter (16, 24 from a 48rem page, 32 from 72rem). Width in code: page (1280 centered), fill, or readable (1024 centered, for a single form).',
    variants: (['with', 'none'] as const).map((a) => ({ props: { Actions: a }, build: (c: ComponentNode) => drawAppPage(c, a === 'with', deps) })),
    properties: [],
    columns: 'Actions',
    gap: [32, 32],
  }
}

/* ── BottomTabBar ───────────────────────────────────────────────────────── */

async function drawBottomTabBar(c: ComponentNode, active: number, deps: Deps) {
  await style(c, { dir: 'row', pad: [0, 4], w: 390, fill: 'role/chrome', stroke: 'role/line', sides: { top: 1 } })
  const tabs: [string, string, number | null][] = [
    ['Home', 'home', null],
    ['Search', 'search', null],
    ['Inbox', 'inbox', 3],
    ['Profile', 'user', null],
  ]
  for (let i = 0; i < tabs.length; i++) {
    const [label, iconName, badge] = tabs[i]!
    const on = i === active
    const ink = on ? 'role/fg' : 'role/fg-muted'
    const tab = await box({ name: on ? 'Tab (current)' : 'Tab', dir: 'col', align: 'center', gap: 'space/1', pad: [8, 0, 6, 0], w: 'fill', radius: 'radius/md' })
    tab.minHeight = 56
    const pill = await box({ name: 'Icon', dir: 'row', align: 'center', justify: 'center', w: 56, h: 32, radius: 'radius/lg', fill: on ? 'role/selected' : undefined }, icon(deps.icons, iconName, 20, ink))
    if (badge !== null) {
      // The count: an accent pill ringed in the canvas, at the icon's top end.
      const b = await box({ name: 'Badge', dir: 'row', align: 'center', justify: 'center', pad: [0, 4], h: 16, radius: 'radius/full', fill: 'role/accent', stroke: 'role/canvas', strokeWidth: 2, strokeAlign: 'OUTSIDE' })
      b.minWidth = 16
      const n = await text(String(badge), 'UI/xs/Medium', 'role/on-accent', { name: 'Count' })
      n.fontName = sans(600)
      add(b, n)
      add(pill, b)
      b.layoutPositioning = 'ABSOLUTE'
      b.x = 34
      b.y = 2
    }
    add(tab, pill, await text(label, 'UI/xs/Medium', ink, { name: 'Label' }))
    add(c, tab)
  }
}

function bottomTabBarSpec(deps: Deps): SetSpec {
  return {
    key: 'component:bottom-tab-bar',
    name: 'Bottom tab bar',
    description:
      'BottomTabBar in packages/ui: a phone’s primary navigation pinned to the bottom, glass chrome over a hairline. Each tab is an icon over a ui-xs label; the current one is in full ink on a role/selected pill, which in code slides between tabs. A count or dot rides the icon’s top end in the accent. Drawn at a 390 phone width.',
    variants: (['home', 'inbox'] as const).map((at) => ({ props: { Current: at }, build: (c: ComponentNode) => drawBottomTabBar(c, at === 'home' ? 0 : 2, deps) })),
    properties: [],
    columns: 'Current',
    gap: [32, 16],
  }
}

/* ── ItemPager ──────────────────────────────────────────────────────────── */

async function drawItemPager(c: ComponentNode, at: 'middle' | 'first', deps: Deps) {
  await style(c, { dir: 'row', align: 'center', gap: 'space/1' })
  const down = await drawnButton(deps, 'outline', 'icon-xs', 'chevron-down')
  const up = await drawnButton(deps, 'outline', 'icon-xs', 'chevron-up', '', at === 'first' ? 'disabled' : 'rest')
  const pos = await box({ name: 'Position', dir: 'row', pad: [0, 0, 0, 6] })
  add(pos, ref(figure(await text(at === 'first' ? '1 of 248' : '12 of 248', 'UI/sm/Regular', 'role/fg-muted', { name: 'Position' }), 400), 'Position'))
  add(c, down, up, pos)
}

function itemPagerSpec(deps: Deps): SetSpec {
  return {
    key: 'component:item-pager',
    name: 'Item pager',
    description:
      'ItemPager in packages/ui: next and previous record (an inbox, a review queue) as two outline icon-xs buttons, then the position in muted figures. J and K step while focus is in the pager (or anywhere, `shortcuts="global"`); each button’s tooltip shows its key. At the first record Previous is disabled.',
    variants: (['middle', 'first'] as const).map((at) => ({ props: { Position: at }, build: (c: ComponentNode) => drawItemPager(c, at, deps) })),
    properties: [{ name: 'Position', type: 'TEXT', default: '12 of 248', field: 'characters' }],
    columns: 'Position',
    gap: [32, 16],
  }
}

/* ── Wizard ─────────────────────────────────────────────────────────────── */

async function drawWizard(c: ComponentNode, invalid: boolean, deps: Deps) {
  await style(c, { dir: 'col', gap: 'space/6', w: 720 })
  const stepper = instance(deps.get, 'stepper', { Orientation: 'horizontal', Current: '2' })
  const body = await box({ name: 'Body', dir: 'col', gap: 'space/2', w: 'fill' })
  const step = await box({ name: 'Step', dir: 'col', gap: 'space/4', w: 'fill' })
  const titles = await box({ name: 'Heading', dir: 'col', gap: 'space/1', w: 'fill' })
  add(
    titles,
    ref(await text('Workspace', 'UI/lg/Semibold', 'role/fg', { name: 'Title' }), 'Title'),
    ref(await text('Name your workspace and invite the people you work with.', 'UI/base/Regular', 'role/fg-muted', { name: 'Description', w: 'fill' }), 'Description'),
  )
  const field = instance(deps.get, 'field', { State: invalid ? 'invalid' : 'default' })
  add(step, titles, field)
  add(body, await text('Step 2 of 4', 'UI/sm/Regular', 'role/fg-muted', { name: 'Summary' }), step)
  const footer = await box({ name: 'Footer', dir: 'row', align: 'center', gap: 'space/2', pad: [16, 0, 0, 0], w: 'fill', stroke: 'role/line', sides: { top: 1 } })
  const back = button(deps.get, 'Back', { Variant: 'ghost' })
  const skip = button(deps.get, 'Skip', { Variant: 'outline' })
  const next = button(deps.get, 'Next')
  add(footer, back, await spacer(), skip, next)
  add(c, stepper, body, footer)
  for (const i of [stepper, field, back, skip, next]) i.isExposedInstance = true
  field.layoutSizingHorizontal = 'FILL'
}

function wizardSpec(deps: Deps): SetSpec {
  return {
    key: 'component:wizard',
    name: 'Wizard',
    description:
      'Wizard in packages/ui: a Stepper over the current step (a muted “Step 2 of 4”, the step’s title and description, its fields) and a footer on a hairline with Back, Skip for an optional step, and Next (Finish on the last). Next runs the step’s validation first; a failing step shows its error. In code steps slide in from the side they come from and the height eases on the smooth spring.',
    variants: (['rest', 'invalid'] as const).map((state) => ({ props: { State: state }, build: (c: ComponentNode) => drawWizard(c, state === 'invalid', deps) })),
    properties: [
      { name: 'Title', type: 'TEXT', default: 'Workspace', field: 'characters' },
      { name: 'Description', type: 'TEXT', default: 'Name your workspace and invite the people you work with.', field: 'characters' },
    ],
    columns: 'State',
    gap: [48, 16],
  }
}

/* ── Toolbar ────────────────────────────────────────────────────────────── */

/** A Toggle key at toggleVariants' sm size (the toolbar's default): pressed is fg/10 with full ink. */
async function toolKey(deps: Deps, iconName: string, pressed: boolean) {
  const k = await box({ name: pressed ? 'Toggle (pressed)' : 'Toggle', dir: 'row', align: 'center', justify: 'center', radius: 'bezel/pill', fill: pressed ? ['role/fg', 0.1] : undefined })
  padInline(k, 'space/1-5')
  controlHeight(k, 'control/sm')
  k.setBoundVariable('minWidth', context().vars.get('theme', 'control/sm'))
  add(k, icon(deps.icons, iconName, 14, pressed ? 'role/fg' : 'role/fg-muted'))
  return k
}

async function drawToolbar(c: ComponentNode, orientation: 'horizontal' | 'vertical', deps: Deps) {
  const horizontal = orientation === 'horizontal'
  await style(c, { dir: horizontal ? 'row' : 'col', align: 'center', gap: 'space/1', pad: 4, radius: 'radius/lg', fill: 'role/chrome-float', stroke: 'role/line', effect: 'Shadow/xs' })
  const group = async (...keys: [string, boolean][]) => {
    const g = await box({ name: 'Group', dir: horizontal ? 'row' : 'col', align: 'center', gap: 'space/0-5' })
    for (const [n, p] of keys) add(g, await toolKey(deps, n, p))
    return g
  }
  const sep = () => rect('Separator', horizontal ? 1 : 16, horizontal ? 16 : 1, 'role/line')
  add(c, await group(['bold', true], ['italic', false], ['underline', true]), sep(), await group(['align-left', true], ['align-center', false], ['align-right', false]), sep(), await group(['link', false], ['image', false]))
  if (!horizontal) return
  // ToolbarInput: a small field, w-40.
  const input = await box({ name: 'Input', dir: 'row', align: 'center', w: 160, ...(bezel() ? { fill: 'role/field', radius: 'bezel/field-radius' } : { stroke: 'role/line-control', radius: 'bezel/field-radius' }) })
  padInline(input, 'space/2')
  controlHeight(input, 'control/sm')
  add(input, await text('Search…', 'UI/base/Regular', 'role/fg-muted', { name: 'Placeholder', w: 'fill', truncate: true }))
  add(c, sep(), input)
}

function toolbarSpec(deps: Deps): SetSpec {
  return {
    key: 'component:toolbar',
    name: 'Toolbar',
    description:
      'Toolbar in packages/ui (Base UI Toolbar): groups of Toggle keys at the sm size on a floating chrome bar, split by short separators, with an optional small field. Pressed keys are a neutral fg/10 with full ink. One tab stop; the arrow keys move between items. Horizontal or vertical.',
    variants: (['horizontal', 'vertical'] as const).map((o) => ({ props: { Orientation: o }, build: (c: ComponentNode) => drawToolbar(c, o, deps) })),
    properties: [],
    columns: 'Orientation',
    gap: [48, 16],
  }
}

/* ── Capsule family ─────────────────────────────────────────────────────── */

async function drawCapsule(c: ComponentNode, size: 'default' | 'sm', deps: Deps) {
  await style(c, { dir: 'row', align: 'center', ...capsuleLook() })
  const sm = size === 'sm'
  add(
    c,
    await capsuleLabel('Preview'),
    await drawnButton(deps, 'ghost', sm ? 'icon-xs' : 'icon-sm', 'copy'),
    await drawnButton(deps, 'ghost', sm ? 'icon-xs' : 'icon-sm', 'share'),
    await drawnButton(deps, 'default', sm ? 'xs' : 'sm', null, 'Publish'),
  )
}

function capsuleSpec(deps: Deps): SetSpec {
  return {
    key: 'component:capsule',
    name: 'Capsule',
    description:
      'Capsule in packages/ui: a floating pill bar (chrome-float on a hairline, 4px in, the control height plus 8 tall) for a few related actions over a canvas, a map or media. In Bezel it is a touch above the surface with a lit top edge, its labels mono capitals and everything inside at the concentric corner. Capsule Toggle, Player, Search and Stepper are built on it.',
    variants: (['default', 'sm'] as const).map((size) => ({ props: { Size: size }, build: (c: ComponentNode) => drawCapsule(c, size, deps) })),
    properties: [{ name: 'Label', type: 'TEXT', default: 'Preview', field: 'characters' }],
    columns: 'Size',
    gap: [32, 16],
  }
}

async function drawCapsulePlayer(c: ComponentNode, playing: boolean, deps: Deps) {
  await style(c, { dir: 'row', align: 'center', ...capsuleLook(), w: 416 })
  const art = await box({ name: 'Art', dir: 'row', align: 'center', justify: 'center', radius: capsuleInner(), fill: 'role/band', clip: true }, icon(deps.icons, 'music', 16, 'role/fg-subtle'))
  controlHeight(art)
  art.layoutSizingHorizontal = 'FIXED'
  art.setBoundVariable('width', context().vars.get('theme', 'control/default'))
  const meta = await box({ name: 'Meta', dir: 'col', gap: 'space/1', pad: [0, 6], w: 'fill' })
  const line = await box({ name: 'Line', dir: 'row', align: 'center', gap: 'space/2', w: 'fill' })
  add(line, ref(await text('Night Drive · Vela', 'UI/sm/Medium', 'role/fg', { name: 'Title', w: 'fill', truncate: true }), 'Title'), await text('1:24 / 3:51', 'Mono/xs', 'role/fg-muted', { name: 'Time' }))
  // The rail: a 3px well with the played part in ink.
  const rail = await box({ name: 'Rail', dir: 'row', align: 'center', w: 'fill', h: 10 })
  const track = await box({ name: 'Track', dir: 'row', w: 'fill', h: 3, radius: 'radius/full', fill: 'role/well', clip: true }, rect('Progress', 88, 3, 'role/fg', 'radius/full'))
  add(rail, track)
  add(meta, line, rail)
  const play = await drawnButton(deps, 'default', 'icon', playing ? 'circle-pause' : 'play')
  add(c, art, meta, await drawnButton(deps, 'ghost', 'icon-sm', 'skip-back'), play, await drawnButton(deps, 'ghost', 'icon-sm', 'skip-forward'))
}

function capsulePlayerSpec(deps: Deps): SetSpec {
  return {
    key: 'component:capsule-player',
    name: 'Capsule player',
    description:
      'CapsulePlayer in packages/ui: a now-playing capsule. Cover art at the concentric corner, the title (with its artist muted) over a 3px seek rail in ink, the time in mono, and previous, play/pause (the primary icon button) and next. In code the title rolls when the track changes and the rail’s thumb shows on hover.',
    variants: [false, true].map((playing) => ({ props: { Playing: String(playing) }, build: (c: ComponentNode) => drawCapsulePlayer(c, playing, deps) })),
    properties: [{ name: 'Title', type: 'TEXT', default: 'Night Drive · Vela', field: 'characters' }],
    columns: 'Playing',
    gap: [32, 16],
  }
}

async function drawCapsuleSearch(c: ComponentNode, state: 'rest' | 'focus', size: 'default' | 'sm', deps: Deps) {
  const look = capsuleLook()
  const focus = state === 'focus'
  await style(c, { dir: 'row', align: 'center', ...look, gap: 'space/2', pad: [4, 4, 4, 12], w: focus ? 288 : 176, fill: bezel() ? 'bezel/capsule' : 'role/surface', stroke: focus ? 'role/focus' : look.stroke, effect: focus ? 'Focus/field' : look.effect })
  const field = await box({ name: 'Field', dir: 'row', align: 'center', w: 'fill' })
  controlHeight(field, size === 'sm' ? 'control/sm' : 'control/default')
  add(field, ref(await text(focus ? 'Inbox' : 'Search', 'UI/base/Regular', focus ? 'role/fg' : 'role/fg-muted', { name: 'Value', w: 'fill', truncate: true }), 'Value'))
  const end = focus ? await drawnButton(deps, 'ghost', size === 'sm' ? 'icon-xs' : 'icon-sm', 'x') : await box({ name: 'Hint', dir: 'row', gap: 'space/1', pad: [0, 6, 0, 0] }, await kbd('⌘'), await kbd('K'))
  add(c, icon(deps.icons, 'search', 16, 'role/fg-muted'), field, end)
}

function capsuleSearchSpec(deps: Deps): SetSpec {
  const variants: VariantSpec[] = []
  for (const state of ['rest', 'focus'] as const)
    for (const size of ['default', 'sm'] as const) variants.push({ props: { Size: size, State: state }, build: (c) => drawCapsuleSearch(c, state, size, deps) })
  return {
    key: 'component:capsule-search',
    name: 'Capsule search',
    description:
      'CapsuleSearch in packages/ui: a search field as a capsule, 176 wide at rest with its ⌘K hint, opening to 288 when focused or filled, where the hint gives way to a clear button and the edge turns the focus colour with its halo. In code the width morphs on the smooth spring and the shortcut focuses it from anywhere.',
    variants,
    properties: [{ name: 'Value', type: 'TEXT', default: 'Search', field: 'characters' }],
    columns: 'State',
    gap: [32, 16],
  }
}

async function drawCapsuleStepper(c: ComponentNode, size: 'default' | 'sm', deps: Deps) {
  await style(c, { dir: 'row', align: 'center', ...capsuleLook(), gap: 'space/0-5' })
  const disc: ButtonSize = size === 'sm' ? 'icon-xs' : 'icon-sm'
  const win = await box({ name: 'Window', dir: 'row', align: 'center', gap: 'space/1', pad: [0, 4], radius: capsuleInner() })
  controlHeight(win, size === 'sm' ? 'control/sm' : 'control/default')
  add(win, ref(await text('120', 'Mono/base/Medium', 'role/fg', { name: 'Value' }), 'Value'), ref(await text('BPM', 'UI/sm/Regular', 'role/fg-muted', { name: 'Unit' }), 'Unit'))
  add(c, await capsuleLabel('Tempo'), await drawnButton(deps, 'ghost', disc, 'minus'), win, await drawnButton(deps, 'ghost', disc, 'plus'))
}

function capsuleStepperSpec(deps: Deps): SetSpec {
  return {
    key: 'component:capsule-stepper',
    name: 'Capsule stepper',
    description:
      'CapsuleStepper in packages/ui: a number field as a capsule: an eyebrow, minus and plus ghost discs either side of the value in mono with its unit small and muted after it. Arrow keys, Page keys and scrubbing step it; in code the value rolls up or down with the change on the snappy spring.',
    variants: (['default', 'sm'] as const).map((size) => ({ props: { Size: size }, build: (c: ComponentNode) => drawCapsuleStepper(c, size, deps) })),
    properties: [
      { name: 'Label', type: 'TEXT', default: 'Tempo', field: 'characters' },
      { name: 'Value', type: 'TEXT', default: '120', field: 'characters' },
      { name: 'Unit', type: 'TEXT', default: 'BPM', field: 'characters' },
    ],
    columns: 'Size',
    gap: [32, 16],
  }
}

/* ── Shared: a bare checkbox mark ────────────────────────────────────────── */

/** Checkbox's box drawn by its own builder, without the label. */
async function checkMark(checked: 'true' | 'false' | 'indeterminate') {
  const f = figma.createFrame()
  await drawCheckbox(f, checked, 'rest', 'Label', false)
  f.children[f.children.length - 1]!.remove()
  f.name = 'Checkbox'
  return f
}

/* ── Presentation ───────────────────────────────────────────────────────── */

async function drawPresentation(c: ComponentNode, as: 'popover' | 'sheet', deps: Deps) {
  const rows: [string, string, string][] = [
    ['Edit', 'pencil', '⌘E'],
    ['Duplicate', 'copy', '⌘D'],
    ['Share', 'share', '⇧⌘S'],
    ['Archive', 'archive', ''],
  ]
  if (as === 'popover') {
    await style(c, { dir: 'col', w: 216, ...panelLook() })
    for (const [i, [l, n, k]] of rows.entries()) add(c, await menuRow(l, { icon: icon(deps.icons, n, 16, i === 1 ? 'role/fg' : 'role/fg-muted'), trailing: k || undefined, on: i === 1 }))
    return
  }
  // The sheet: full width up to a phone column, rounded on top, a grab handle, 48px rows in the touch size, no shortcuts.
  await style(c, { dir: 'col', pad: [4, 6, 8, 6], w: 390, fill: 'role/overlay', stroke: 'role/line', sides: { top: 1, left: 1, right: 1 }, effect: 'Shadow/lg' })
  c.topLeftRadius = 0
  for (const corner of ['topLeftRadius', 'topRightRadius'] as const) c.setBoundVariable(corner, context().vars.get('theme', 'radius/2xl'))
  const handle = await box({ name: 'Handle', dir: 'row', justify: 'center', pad: [4, 0, 8, 0], w: 'fill' }, rect('Grip', 36, 4, 'role/well', 'radius/full'))
  add(c, handle)
  for (const [i, [l, n]] of rows.entries()) {
    const row = await box({ name: 'Item', dir: 'row', align: 'center', gap: 'space/3', pad: [0, 12], w: 'fill', h: 48, radius: 'radius/lg', fill: i === 1 ? 'role/hover' : undefined })
    add(row, icon(deps.icons, n, 20, 'role/fg-muted'), await text(l, 'Body/base', 'role/fg', { name: 'Label', w: 'fill' }))
    add(c, row)
  }
}

function presentationSpec(deps: Deps): SetSpec {
  return {
    key: 'component:presentation',
    name: 'Presentation',
    description:
      'How an overlay is presented where it is operated (presentation.tsx, used by Select, Dropdown menu, Combobox and the pickers). Under a mouse it is a popover that grows out of its trigger; under a thumb (or `presentation="sheet"`) the same menu rises as a bottom sheet: rounded on top with a grab handle, 48px rows in the touch type size and no keyboard hints, over the scrim. In code it is pulled down to dismiss.',
    variants: (['popover', 'sheet'] as const).map((as) => ({ props: { Presentation: as }, build: (c: ComponentNode) => drawPresentation(c, as, deps) })),
    properties: [],
    columns: 'Presentation',
    gap: [48, 16],
  }
}

/* ── Carousel ───────────────────────────────────────────────────────────── */

async function drawCarousel(c: ComponentNode, at: 'first' | 'middle', deps: Deps) {
  const W = 360
  await style(c, { dir: 'col', align: 'center', gap: 'space/2', pad: [0, 48], w: W + 96 })
  const stage = await box({ name: 'Viewport', dir: 'row', align: 'center', justify: 'center', w: W, h: 220, radius: 'radius/xl', fill: 'role/band' })
  add(stage, ref(await text(at === 'first' ? '1' : '3', 'Heading/4xl', 'role/fg-muted', { name: 'Slide' }), 'Slide'))
  const row = await box({ name: 'Slides', dir: 'row', align: 'center', gap: 'space/3', w: 'hug' })
  const prev = await drawnButton(deps, 'outline', 'icon-sm', 'chevron-left', '', at === 'first' ? 'disabled' : 'rest')
  const next = await drawnButton(deps, 'outline', 'icon-sm', 'chevron-right')
  for (const b of [prev, next]) b.fills = [solid('role/chrome-float')]
  add(row, prev, stage, next)
  c.paddingLeft = 0
  c.paddingRight = 0
  // CarouselDots: 6px dots 24 apart (gap-4.5), the current one in ink.
  const dots = await box({ name: 'Dots', dir: 'row', align: 'center', gap: 18, pad: [8, 0] })
  for (let i = 0; i < 5; i++) add(dots, rect(i === (at === 'first' ? 0 : 2) ? 'Dot (current)' : 'Dot', 6, 6, i === (at === 'first' ? 0 : 2) ? 'role/fg' : 'role/well', 'radius/full'))
  add(c, row, dots)
}

function carouselSpec(deps: Deps): SetSpec {
  return {
    key: 'component:carousel',
    name: 'Carousel',
    description:
      'Carousel in packages/ui (Embla): one slide at a time, outline icon-sm Previous and Next on chrome-float outside the viewport (disabled at the ends), and CarouselDots under it, 6px dots 24 apart with the current one in ink. In code the slides glide and a pill slides between the dots; thumbnails and autoplay (with a ring that counts down) are optional parts.',
    variants: (['first', 'middle'] as const).map((at) => ({ props: { Slide: at }, build: (c: ComponentNode) => drawCarousel(c, at, deps) })),
    properties: [{ name: 'Slide', type: 'TEXT', default: '1', field: 'characters' }],
    columns: 'Slide',
    gap: [32, 16],
  }
}

/* ── TreeView ───────────────────────────────────────────────────────────── */

async function drawTreeView(c: ComponentNode, multiple: boolean, deps: Deps) {
  await style(c, { dir: 'col', w: 260 })
  const INDENT = 14
  // [name, level, kind, open, selected/checked, meta]
  const rows: [string, number, 'folder' | 'file', boolean, boolean, string][] = [
    ['src', 1, 'folder', true, false, ''],
    ['components', 2, 'folder', true, false, ''],
    ['button.tsx', 3, 'file', false, true, '4 KB'],
    ['dialog.tsx', 3, 'file', false, multiple, '9 KB'],
    ['lib', 2, 'folder', false, false, ''],
    ['package.json', 1, 'file', false, false, '1 KB'],
  ]
  for (const [name, level, kind, open, on, meta] of rows) {
    const row = await box({ name: on ? 'Row (selected)' : 'Row', dir: 'row', align: 'center', gap: 'space/1-5', pad: [0, 8, 0, (level - 1) * INDENT + 4], w: 'fill', radius: 'radius/md', fill: on && !multiple ? 'role/selected' : undefined })
    controlHeight(row, 'control/sm')
    // Indent guides at each ancestor level from the second.
    for (let i = 0; i < level - 1 && level >= 2; i++) {
      const g = rect('Guide', 1, 32, 'role/line')
      add(row, g)
      g.layoutPositioning = 'ABSOLUTE'
      g.x = i * INDENT + 12
      g.y = 0
      g.constraints = { horizontal: 'MIN', vertical: 'STRETCH' }
    }
    const chev = await box({ name: 'Chevron', dir: 'row', align: 'center', justify: 'center', w: 16, h: 16 })
    if (kind === 'folder') add(chev, icon(deps.icons, open ? 'chevron-down' : 'chevron-right', 14, 'role/fg-muted'))
    add(row, chev)
    if (multiple) add(row, await checkMark(on ? 'true' : name === 'components' ? 'indeterminate' : 'false'))
    add(row, icon(deps.icons, kind === 'folder' ? (open ? 'folder-open' : 'folder') : name.endsWith('.json') ? 'file-json' : 'file-code', 16, 'role/fg-muted'))
    add(row, await text(name, 'UI/base/Regular', 'role/fg', { name: 'Name', w: 'fill', truncate: true }))
    if (meta) add(row, await text(meta, 'UI/xs/Regular', 'role/fg-muted', { name: 'Meta' }))
    add(c, row)
  }
}

function treeViewSpec(deps: Deps): SetSpec {
  return {
    key: 'component:tree-view',
    name: 'Tree view',
    description:
      'TreeView in packages/ui: a file tree of small-control rows, 14px further in per level, with faint indent guides, a chevron for each branch, folder and file icons and an optional muted meta. Single selection is the role/selected key; multiple selection adds Checkbox marks (indeterminate for a partly checked folder). In code branches open on the smooth spring, typeahead and arrow keys move the focus, and long trees virtualize.',
    variants: (['single', 'multiple'] as const).map((mode) => ({ props: { Selection: mode }, build: (c: ComponentNode) => drawTreeView(c, mode === 'multiple', deps) })),
    properties: [],
    columns: 'Selection',
    gap: [48, 16],
  }
}

/* ── SortableList ───────────────────────────────────────────────────────── */

async function drawSortableList(c: ComponentNode, lifted: boolean, deps: Deps) {
  await style(c, { dir: 'col', gap: 'space/1-5', w: 320 })
  for (const [i, label] of ['Design review', 'Write the changelog', 'Cut the release', 'Announce it'].entries()) {
    const up = lifted && i === 1
    const item = await box({ name: up ? 'Item (lifted)' : 'Item', dir: 'row', align: 'center', gap: 'space/2', pad: [6, 8], w: 'fill', radius: 'radius/lg', fill: 'role/surface', stroke: up ? 'role/focus' : 'role/line', effect: up ? 'Shadow/lg' : undefined })
    item.setBoundVariable('minHeight', context().vars.get('theme', 'control/default'))
    const handle = await box({ name: 'Handle', dir: 'row', align: 'center', justify: 'center', w: 24, h: 24, radius: 'radius/md', fill: up ? 'role/selected' : undefined }, icon(deps.icons, 'grip', 16, up ? 'role/fg' : 'role/fg-muted'))
    add(item, handle, await text(label, 'UI/base/Regular', 'role/fg', { name: 'Label', w: 'fill', truncate: true }))
    add(c, item)
  }
}

function sortableListSpec(deps: Deps): SetSpec {
  return {
    key: 'component:sortable-list',
    name: 'Sortable list',
    description:
      'SortableList in packages/ui: rows on role/surface with a hairline, each with a grip handle that picks it up (a button, so the keyboard can lift it with Space and move it with the arrows). A lifted row takes the focus edge and Shadow/lg; in code it scales up a touch and the others make room on the smooth spring.',
    variants: (['rest', 'lifted'] as const).map((state) => ({ props: { State: state }, build: (c: ComponentNode) => drawSortableList(c, state === 'lifted', deps) })),
    properties: [],
    columns: 'State',
    gap: [48, 16],
  }
}

/* ── Kanban ─────────────────────────────────────────────────────────────── */

async function drawKanban(c: ComponentNode, overLimit: boolean, deps: Deps) {
  await style(c, { dir: 'row', align: 'start', gap: 'space/3', pad: 4 })
  const columns: [string, [string, string, string][], number | null][] = [
    ['Backlog', [['Dark mode for charts', 'Design', 'secondary'], ['Export to CSV', 'Feature', 'secondary']], null],
    ['In progress', [['Command palette search', 'Feature', 'default'], ['Fix focus trap', 'Bug', 'danger'], ['Onboarding copy', 'Docs', 'secondary']], overLimit ? 2 : null],
    ['Done', [['Release 0.1', 'Release', 'success']], null],
  ]
  for (const [title, cards, limit] of columns) {
    const col = await box({ name: 'Column', dir: 'col', w: 288, radius: 'radius/xl' })
    const over = limit !== null && cards.length > limit
    const head = await box({ name: 'Header', dir: 'row', align: 'center', gap: 'space/2', pad: [10, 12, 6, 12], w: 'fill', fill: over ? ['role/warning', 0.12] : undefined })
    for (const corner of ['topLeftRadius', 'topRightRadius'] as const) head.setBoundVariable(corner, context().vars.get('theme', 'radius/xl'))
    add(head, await text(title, 'UI/base/Medium', over ? 'role/warning-text' : 'role/fg', { name: 'Title' }), badge(deps.get, limit !== null ? `${cards.length}/${limit}` : String(cards.length), over ? 'warning' : 'secondary'), await spacer(), await drawnButton(deps, 'ghost', 'icon-xs', 'sidebar'))
    const list = await box({ name: 'Cards', dir: 'col', gap: 'space/2', pad: [0, 8, 8, 8], w: 'fill' })
    for (const [name, tag, tone] of cards) {
      const card = await box({ name: 'Card', dir: 'col', gap: 'space/2', pad: 16, w: 'fill', ...surfaceLook() })
      const meta = await box({ name: 'Meta', dir: 'row', align: 'center', gap: 'space/2', w: 'fill' })
      add(meta, badge(deps.get, tag, tone), await spacer(), instance(deps.get, 'avatar', { Size: 'sm', Content: 'initials' }))
      add(card, await text(name, 'UI/base/Medium', 'role/fg', { name: 'Title', w: 'fill' }), meta)
      add(list, card)
    }
    const addCard = await drawnButton(deps, 'ghost', 'sm', 'plus', 'Add card')
    addCard.layoutSizingHorizontal = 'FIXED'
    addCard.resize(272, addCard.height)
    addCard.primaryAxisAlignItems = 'MIN'
    const foot = await box({ name: 'Footer', dir: 'row', pad: [0, 8, 8, 8], w: 'fill' }, addCard)
    add(col, head, list, foot)
    add(c, col)
  }
}

function kanbanSpec(deps: Deps): SetSpec {
  return {
    key: 'component:kanban',
    name: 'Kanban',
    description:
      'Kanban in packages/ui: columns 288 wide, each headed by its title, a count badge (count over limit when it has a WIP limit; the header washes warning when it is over) and a collapse button, then cards (small Cards with your content: here a title, a tag and an assignee) and an “Add card” row. In code cards drag between columns with a lifted ghost and a dashed drop target, columns collapse to a 44 rail, and swimlanes split the board in rows.',
    variants: (['within', 'over'] as const).map((limit) => ({ props: { Limit: limit }, build: (c: ComponentNode) => drawKanban(c, limit === 'over', deps) })),
    properties: [],
    columns: 'Limit',
    gap: [40, 24],
  }
}

/* ── ActionList ─────────────────────────────────────────────────────────── */

type Tone = 'neutral' | 'accent' | 'info' | 'success' | 'warning' | 'danger'
const TILE: Record<Tone, [Ink, string]> = {
  neutral: ['role/band', 'role/fg-muted'],
  accent: ['role/accent-subtle', 'role/accent-text'],
  info: ['role/info-subtle', 'role/info-text'],
  success: ['role/success-subtle', 'role/success-text'],
  warning: ['role/warning-subtle', 'role/warning-text'],
  danger: ['role/danger-subtle', 'role/danger-text'],
}

async function drawActionList(c: ComponentNode, emphasis: boolean, deps: Deps) {
  await style(c, { dir: 'col', gap: 'space/3', w: 520 })
  const header = await box({ name: 'Header', dir: 'row', align: 'start', gap: 'space/3', w: 'fill' })
  const titles = await box({ name: 'Titles', dir: 'col', gap: 'space/0-5', w: 'fill' })
  const count = await box({ name: 'Count', dir: 'row', align: 'center', justify: 'center', pad: [0, 6], h: 20, radius: 'radius/full', fill: 'role/band' }, await text('3', 'UI/sm/Medium', 'role/fg-muted', { name: 'Count' }))
  add(titles, await box({ name: 'Title', dir: 'row', align: 'center', gap: 'space/2' }, ref(await text('Needs your attention', 'UI/lg/Semibold', 'role/fg', { name: 'Title' }), 'Title'), count), await text('Things blocking the next release.', 'UI/sm/Regular', 'role/fg-muted', { name: 'Description' }))
  add(header, titles, button(deps.get, 'View all', { Variant: 'ghost', Size: 'sm' }))
  const items = await box({ name: 'Items', dir: 'col', w: 'fill' })
  const rows: [string, string, Tone, string, string, string][] = [
    ['Card expires in 3 days', 'Visa ending 4242', 'warning', 'alert-triangle', 'Due Fri', 'Update'],
    ['2 invites waiting', 'ada@acme.dev, lin@acme.dev', 'accent', 'mail', '2', 'Resend'],
    ['Domain verified', 'youj.dev', 'success', 'check-circle', 'Done', 'Open'],
  ]
  for (const [i, [title, detail, tone, iconName, meta, action]] of rows.entries()) {
    const emph = emphasis && i === 0
    const row = await box({
      name: emph ? 'Item (emphasis)' : 'Item',
      dir: 'row',
      align: 'center',
      gap: 'space/3',
      pad: emph ? [12, 12] : [12, 0],
      w: 'fill',
      radius: emph ? 'radius/lg' : undefined,
      fill: emph ? TILE[tone][0] : undefined,
      stroke: emph ? `role/${tone}-line` : i > 0 && !(emphasis && i === 1) ? 'role/line' : undefined,
      sides: emph ? undefined : { top: 1 },
    })
    const tile = await box({ name: 'Icon', dir: 'row', align: 'center', justify: 'center', w: 36, h: 36, radius: 'radius/lg', fill: emph ? 'role/surface' : TILE[tone][0] }, icon(deps.icons, iconName, 16, emph ? 'role/fg' : TILE[tone][1]))
    const words = await box({ name: 'Text', dir: 'col', gap: 'space/0-5', w: 'fill' })
    add(words, await text(title, 'UI/base/Medium', 'role/fg', { name: 'Title' }), await text(detail, 'UI/sm/Regular', 'role/fg-muted', { name: 'Detail', w: 'fill', truncate: true }))
    const chip = await box({ name: 'Meta', dir: 'row', align: 'center', pad: [0, 8], h: 24, radius: 'radius/full', fill: TILE[tone][0] }, await text(meta, 'UI/sm/Medium', TILE[tone][1], { name: 'Meta' }))
    add(row, tile, words, chip, button(deps.get, action, { Variant: 'outline', Size: 'sm' }))
    add(items, row)
  }
  add(c, header, items)
}

function actionListSpec(deps: Deps): SetSpec {
  return {
    key: 'component:action-list',
    name: 'Action list',
    description:
      'ActionList in packages/ui: a titled list of things to act on, with a count and an optional header action. Each row is a 36px tone tile, a title over a muted detail, a tone chip (a due date, a count) and its action, rows split by hairlines. `emphasis` lifts a row onto its tone’s wash with a ring and turns its tile to the surface. Rows enter and leave through PresenceList in code; under a narrow container the meta and action wrap under the title.',
    variants: [false, true].map((emphasis) => ({ props: { Emphasis: String(emphasis) }, build: (c: ComponentNode) => drawActionList(c, emphasis, deps) })),
    properties: [{ name: 'Title', type: 'TEXT', default: 'Needs your attention', field: 'characters' }],
    columns: 'Emphasis',
    gap: [48, 16],
  }
}

/* ── PropertyList ───────────────────────────────────────────────────────── */

async function drawPropertyList(c: ComponentNode, stacked: boolean, deps: Deps) {
  await style(c, { dir: 'col', w: stacked ? 280 : 440 })
  const value = async (kind: string) => {
    const v = await box({ name: 'Value', dir: 'row', align: 'center', gap: 'space/2', w: 'fill' })
    if (kind === 'person') {
      const a = await box({ name: 'Avatar', dir: 'row', align: 'center', justify: 'center', w: 20, h: 20, radius: 'radius/full', fill: 'role/band' }, await text('AL', 'UI/xs/Medium', 'role/fg-muted', { name: 'Initials' }))
      add(v, a, await text('Ada Lovelace', 'UI/base/Regular', 'role/fg', { name: 'Name' }))
    } else if (kind === 'status') add(v, rect('Dot', 8, 8, 'role/success', 'radius/full'), await text('Active', 'UI/base/Regular', 'role/fg', { name: 'Status' }))
    else if (kind === 'tag') add(v, badge(deps.get, 'Enterprise', 'secondary'), badge(deps.get, 'EU', 'secondary'))
    else if (kind === 'progress') {
      const track = await box({ name: 'Track', dir: 'row', w: 'fill', h: 6, radius: 'radius/full', fill: ['role/fg', 0.1], clip: true }, rect('Indicator', 120, 6, 'role/accent', 'radius/full'))
      add(v, track, await text('64%', 'UI/sm/Regular', 'role/fg', { name: 'Value' }))
    } else add(v, figure(await text(kind, 'UI/base/Regular', 'role/fg', { name: 'Text' }), 400))
    return v
  }
  const rows: [string, string, string][] = [
    ['Owner', 'user', 'person'],
    ['Status', 'circle-dot', 'status'],
    ['Plan', 'tag', 'tag'],
    ['Seats used', 'users', 'progress'],
    ['Renews', 'calendar', 'Mar 4, 2027'],
    ['Annual value', 'dollar-sign', '$24,000'],
  ]
  for (const [label, iconName, kind] of rows) {
    // Rows are at least 40 (min-h-10): 10 above and below a 20px line.
    const row = await box({ name: 'Property', dir: stacked ? 'col' : 'row', align: stacked ? 'start' : 'center', gap: stacked ? 'space/1' : 'space/3', pad: stacked ? [4, 0] : [10, 0], w: 'fill' })
    const term = await box({ name: 'Label', dir: 'row', align: 'center', gap: 'space/2-5', w: stacked ? 'fill' : 144 })
    add(term, icon(deps.icons, iconName, 16, 'role/fg-muted'), await text(label, 'UI/base/Regular', 'role/fg-muted', { name: 'Label', w: 'fill', truncate: true }))
    add(row, term, await value(kind))
    add(c, row)
  }
}

function propertyListSpec(deps: Deps): SetSpec {
  return {
    key: 'component:property-list',
    name: 'Property list',
    description:
      'PropertyList in packages/ui: a record’s fields as label and value rows (a 144px label column with a muted 16px icon, rows at least 40 tall). The values are its typed parts: PropertyPerson (a 20px avatar), PropertyStatus (a tone dot), PropertyTag (secondary badges), PropertyProgress, PropertyDate and PropertyMoney (tabular). In a narrow container the label stacks over the value; `onEdit` adds an edit button on hover.',
    variants: (['columns', 'stacked'] as const).map((layout) => ({ props: { Layout: layout }, build: (c: ComponentNode) => drawPropertyList(c, layout === 'stacked', deps) })),
    properties: [],
    columns: 'Layout',
    gap: [48, 16],
  }
}

/* ── InspectorPanel ─────────────────────────────────────────────────────── */

async function drawInspectorPanel(c: ComponentNode, enabled: boolean, deps: Deps) {
  await style(c, { dir: 'col', w: 260 })
  const header = await box({ name: 'Header', dir: 'row', align: 'center', gap: 'space/2', w: 'fill' })
  header.setBoundVariable('minHeight', context().vars.get('theme', 'control/default'))
  const type = await box({ name: 'Type', dir: 'row', align: 'center', gap: 'space/1', pad: [0, 4], radius: 'radius/sm' })
  add(type, ref(await text('Drop shadow', 'UI/base/Medium', 'role/fg', { name: 'Title', truncate: true }), 'Title'), icon(deps.icons, 'chevron-down', 14, 'role/fg-muted'))
  const actions = await box({ name: 'Actions', dir: 'row', align: 'center', gap: 'space/0-5' })
  for (const n of ['eye', 'trash', 'chevron-up']) {
    const b = await drawnButton(deps, 'ghost', 'icon-xs', n)
    for (const v of b.findAll((x) => x.type === 'VECTOR')) {
      const vec = v as VectorNode
      if (Array.isArray(vec.strokes) && vec.strokes.length) vec.strokes = [solid('role/fg-subtle')]
    }
    add(actions, b)
  }
  add(header, await checkMark(enabled ? 'true' : 'false'), type, await spacer(), actions)
  const body = await box({ name: 'Body', dir: 'col', gap: 'space/2', pad: [2, 0, 12, 0], w: 'fill', opacity: enabled ? undefined : 0.5 })
  const fieldOf = async (prefix: string, v: string) => {
    const f = await box({ name: 'Field', dir: 'row', align: 'center', gap: 'space/1-5', w: 'fill', ...fieldLook() })
    f.strokesIncludedInLayout = true
    padInline(f, 'space/2')
    controlHeight(f, 'control/sm')
    add(f, await text(prefix, 'UI/sm/Regular', 'role/fg-muted', { name: 'Prefix' }), figure(await text(v, 'UI/sm/Regular', 'role/fg', { name: 'Value', w: 'fill', truncate: true }), 400))
    return f
  }
  const row = async (label: string, ...fields: FrameNode[]) => {
    const r = await box({ name: 'Row', dir: 'row', align: 'center', gap: 'space/2', w: 'fill' })
    const fs = await box({ name: 'Fields', dir: 'row', align: 'center', gap: 'space/1-5', w: 'fill' })
    add(fs, ...fields)
    add(r, await text(label, 'UI/sm/Regular', 'role/fg-muted', { name: 'Label', w: 88, truncate: true }), fs)
    return r
  }
  add(body, await row('Offset', await fieldOf('X', '0'), await fieldOf('Y', '4')), await row('Blur', await fieldOf('B', '12'), await fieldOf('S', '−2')), await row('Colour', await fieldOf('#', '000000'), await fieldOf('%', '24')))
  add(c, header, body)
}

function inspectorPanelSpec(deps: Deps): SetSpec {
  return {
    key: 'component:inspector-panel',
    name: 'Inspector panel',
    description:
      'InspectorPanel in packages/ui: one property group of a design tool’s side panel (a shadow, a stroke, a fill). The header carries what its props ask for: a checkbox to switch the group on (off dims the body and disables its fields), the title as a menu to change its type, eye, add and remove icon buttons in the subtle ink, and a chevron that collapses the body. InspectorRow lays a label (88) beside one or two small fields.',
    variants: [true, false].map((enabled) => ({ props: { Enabled: String(enabled) }, build: (c: ComponentNode) => drawInspectorPanel(c, enabled, deps) })),
    properties: [{ name: 'Title', type: 'TEXT', default: 'Drop shadow', field: 'characters' }],
    columns: 'Enabled',
    gap: [48, 16],
  }
}

/* ── The entries ────────────────────────────────────────────────────────── */

const doc = (name: string, title: string, usage: string, tokens: string, files = `${UI}${name}.tsx`) => ({ key: `component:${name}`, title, usage, tokens, file: files })

export const ENTRIES: Entry[] = [
  {
    doc: doc('spinner', 'Spinner', '<Spinner size={20} />', 'The loader-ring icon in the current ink (role/fg-muted here)  ·  1.5px stroke at small sizes  ·  16, 20, 24, 32'),
    spec: (d) => spinnerSpec(d),
  },
  {
    doc: doc(
      'empty',
      'Empty',
      '<Empty><EmptyHeader><EmptyMedia variant="icon"><InboxIcon /></EmptyMedia><EmptyTitle>No messages yet</EmptyTitle><EmptyDescription>…</EmptyDescription></EmptyHeader><EmptyContent><Button>…</Button></EmptyContent></Empty>',
      'Tile role/key on role/line, radius/xl, Shadow/sm, 48  ·  Plates role/band on role/line, radius/lg  ·  Title UI/lg/Semibold  ·  Description UI/base role/fg-muted  ·  Gap space/5, padding space/8',
    ),
    spec: (d) => emptySpec(d),
  },
  {
    doc: doc('aspect-ratio', 'Aspect ratio', '<AspectRatio ratio={16 / 9}><img className="size-full object-cover" … /></AspectRatio>', 'Placeholder role/band, radius/lg, image icon role/fg-subtle  ·  16:9, 4:3, 1:1, 4:5'),
    spec: (d) => aspectRatioSpec(d),
  },
  {
    doc: doc('typography', 'Typography', '<TypographyH1>Ship the kit</TypographyH1>  ·  <TypographyP>…</TypographyP>  ·  <TypographyInlineCode>…</TypographyInlineCode>', 'H1 Heading/4xl  ·  H2 Heading/2xl  ·  H3 Heading/lg  ·  P Body/base  ·  Lead Body/lg role/fg-muted  ·  Blockquote role/line-strong 2px  ·  Code Mono/sm on role/well'),
    spec: () => typographySpec(),
  },
  {
    doc: doc('scroll-area', 'Scroll area', '<ScrollArea className="h-72" aria-label="Tags">…</ScrollArea>', 'Thumb role/line-strong, 6px pill on no track, 1px in  ·  Frame here role/line, radius/lg'),
    spec: () => scrollAreaSpec(),
  },
  {
    doc: doc('resizable', 'Resizable', '<ResizablePanelGroup orientation="horizontal"><ResizablePanel defaultSize={30} /><ResizableHandle withHandle /><ResizablePanel /></ResizablePanelGroup>', 'Separator role/line, 1px  ·  Grip role/chrome-float on role/line, radius/sm, Shadow/xs, 14 × 24  ·  Rail role/accent-line on hover, role/focus while dragged (code)'),
    spec: (d) => resizableSpec(d),
  },
  {
    doc: doc('countdown', 'Countdown', '<Countdown to="2026-12-31T23:59:59Z" />', 'Faces role/surface on role/line, radius/lg, Shadow/xs  ·  Digits Heading/5xl role/fg (muted once complete)  ·  Units UI/xs/Caps role/fg-muted  ·  Gap space/3'),
    spec: () => countdownSpec(),
  },
  {
    doc: doc(
      'stepper',
      'Stepper',
      '<Stepper steps={steps} current={1} />  ·  <StepperNav steps={steps} current={1} href={(i) => `/setup/${i}`} />',
      'Disc 24, bezel/pill: upcoming role/surface on role/line, current role/accent with a role/accent 18% halo, done role/accent-subtle on role/accent-line with a check, error role/danger  ·  Connector role/line → role/accent  ·  Title UI/base/Medium, description UI/sm role/fg-muted',
      `${UI}stepper.tsx · ${UI}stepper-nav.tsx`,
    ),
    spec: (d) => stepperSpec(d),
  },
  {
    doc: doc('anchor-nav', 'Anchor nav', '<AnchorNav items={[{ id: "install", label: "Installation" }, { id: "props", label: "Props", depth: 1 }]} />', 'Title UI/sm/Medium  ·  Links UI/base role/fg-muted, current role/fg  ·  Edge role/line  ·  Indicator role/accent, 2px  ·  Rows 28, nested 12 further in'),
    spec: () => anchorNavSpec(),
  },
  {
    doc: doc('app-header', 'App header', '<AppHeader><AppHeaderBrand href="/">…</AppHeaderBrand><AppHeaderNav>…</AppHeaderNav><AppHeaderActions><AppHeaderSearch /></AppHeaderActions></AppHeader>', 'Height control/default + space/6 (condensed + space/4)  ·  Surface role/chrome over a role/line hairline  ·  Condensed Shadow/xs  ·  Brand UI/lg/Semibold  ·  Search outline, 224, role/fg-muted with Kbd'),
    spec: (d) => appHeaderSpec(d),
  },
  {
    doc: doc('app-page', 'App page', '<AppPage title="Customers" description="Every account you bill." actions={<Button>New customer</Button>} width="fill">…</AppPage>', 'Title Heading/2xl role/fg, description UI/base role/fg-muted, gap space/1  ·  Actions buttons sm, gap space/2, at the end  ·  Header to sections space/5  ·  Gutter 16 / 24 / 32 by page width'),
    spec: (d) => appPageSpec(d),
  },
  {
    doc: doc('bottom-tab-bar', 'Bottom tab bar', '<BottomTabBar><BottomTabBarItem href="/" icon={<HomeIcon />} label="Home" active /></BottomTabBar>', 'Bar role/chrome over a role/line hairline  ·  Tabs 56 high, label UI/xs/Medium role/fg-muted → role/fg  ·  Current pill role/selected, 56 × 32, radius/lg  ·  Badge role/accent ringed role/canvas'),
    spec: (d) => bottomTabBarSpec(d),
  },
  {
    doc: doc('item-pager', 'Item pager', '<ItemPager index={11} total={248} onIndexChange={setIndex} />', 'Buttons outline icon-xs, chevrons 14  ·  Position UI/sm role/fg-muted, tabular (Bezel: mono)  ·  Gap space/1'),
    spec: (d) => itemPagerSpec(d),
  },
  {
    doc: doc('wizard', 'Wizard', '<Wizard onComplete={create}><WizardStep title="Account">…</WizardStep><WizardStep title="Workspace" validate={check}>…</WizardStep></Wizard>', 'Stepper instance  ·  Summary UI/sm role/fg-muted  ·  Title UI/lg/Semibold, description UI/base role/fg-muted  ·  Field instance  ·  Footer over role/line: ghost Back, outline Skip, default Next  ·  Gaps space/6, space/4'),
    spec: (d) => wizardSpec(d),
  },
  {
    doc: doc('toolbar', 'Toolbar', '<Toolbar><ToolbarGroup><ToolbarToggle aria-label="Bold"><BoldIcon /></ToolbarToggle></ToolbarGroup><ToolbarSeparator /><ToolbarInput placeholder="Search…" /></Toolbar>', 'Bar role/chrome-float on role/line, radius/lg, Shadow/xs, 4 in  ·  Keys control/sm, bezel/pill, pressed role/fg at 10%  ·  Separator role/line, 16  ·  Input control/sm, 160'),
    spec: (d) => toolbarSpec(d),
  },
  {
    doc: doc('capsule', 'Capsule', '<Capsule><CapsuleLabel>Preview</CapsuleLabel><Button size="sm">Publish</Button></Capsule>', 'Fill role/chrome-float on role/line, Shadow/xs, radius/2xl (Bezel: bezel/capsule, a 6% fg ring, Shadow/sm, bezel/pill)  ·  4 in, height control + 8  ·  Label UI/sm role/fg-muted (Bezel: Bezel/Eyebrow)'),
    spec: (d) => capsuleSpec(d),
  },
  {
    doc: doc('capsule-player', 'Capsule player', '<CapsulePlayer title="Night Drive" subtitle="Vela" duration={231} playing={playing} onPlayingChange={setPlaying} />', 'Capsule, 416  ·  Art role/band at the concentric corner, control/default square  ·  Title UI/sm/Medium  ·  Time Mono/xs role/fg-muted  ·  Rail role/well 3px, played role/fg  ·  Play default icon button, skip ghost icon-sm'),
    spec: (d) => capsulePlayerSpec(d),
  },
  {
    doc: doc('capsule-search', 'Capsule search', '<CapsuleSearch placeholder="Search" onSubmit={search} />', 'Capsule on role/surface (Bezel: bezel/capsule)  ·  176 at rest, 288 open  ·  Focus role/focus with Focus/field  ·  Icon role/fg-muted, 16  ·  Hint Kbd ⌘K, clear ghost icon-sm'),
    spec: (d) => capsuleSearchSpec(d),
  },
  {
    doc: doc('capsule-stepper', 'Capsule stepper', '<CapsuleStepper label="Tempo" unit="BPM" defaultValue={120} min={40} max={240} />', 'Capsule  ·  Value Mono/base/Medium role/fg, unit UI/sm role/fg-muted  ·  Discs ghost icon-sm (sm: icon-xs)  ·  Window control height, concentric corner'),
    spec: (d) => capsuleStepperSpec(d),
  },
  {
    doc: doc('presentation', 'Presentation', '<DropdownMenuContent presentation="sheet">…</DropdownMenuContent>  ·  useSheetPresentation()', 'Popover: role/overlay (Bezel bezel/popover), role/line, Shadow/md, radius/xl  ·  Sheet: role/overlay, radius/2xl on top, Shadow/lg, handle role/well 36 × 4, rows 48 in Body/base, hover role/hover'),
    spec: (d) => presentationSpec(d),
  },
  {
    doc: doc('carousel', 'Carousel', '<Carousel><CarouselContent><CarouselItem>…</CarouselItem></CarouselContent><CarouselPrevious /><CarouselNext /><CarouselDots /></Carousel>', 'Slide here role/band, radius/xl  ·  Previous / Next outline icon-sm on role/chrome-float  ·  Dots role/well 6px, 24 apart, current role/fg'),
    spec: (d) => carouselSpec(d),
  },
  {
    doc: doc('tree-view', 'Tree view', '<TreeView items={files} selectionMode="multiple" icons />', 'Rows control/sm, radius/md, 14 per level  ·  Selected role/selected  ·  Guides role/line  ·  Chevron and icons role/fg-muted  ·  Name UI/base, meta UI/xs role/fg-muted', `${UI}tree-view/`),
    spec: (d) => treeViewSpec(d),
  },
  {
    doc: doc('sortable-list', 'Sortable list', '<SortableList value={order} onValueChange={setOrder}><SortableListItem value="a"><SortableListHandle />Design review</SortableListItem></SortableList>', 'Rows role/surface on role/line, radius/lg, min control/default  ·  Handle 24, radius/md, grip role/fg-muted (held role/selected)  ·  Lifted role/focus edge, Shadow/lg  ·  Gap space/1-5'),
    spec: (d) => sortableListSpec(d),
  },
  {
    doc: doc('kanban', 'Kanban', '<Kanban columns={columns} cards={cards} renderCard={(card) => …} onCardsChange={setCards} />', 'Columns 288, radius/xl  ·  Header UI/base/Medium, count Badge secondary (over limit: warning, header role/warning at 12%)  ·  Cards small Card on role/surface  ·  Add card ghost sm', `${UI}kanban/`),
    spec: (d) => kanbanSpec(d),
  },
  {
    doc: doc('action-list', 'Action list', '<ActionList title="Needs your attention" count={3}><ActionListItem icon={<MailIcon />} tone="accent" title="2 invites waiting" meta="2" action={<Button size="sm">Resend</Button>} /></ActionList>', 'Title UI/lg/Semibold, count role/band  ·  Tiles 36, radius/lg, role/<tone>-subtle with role/<tone>-text  ·  Rows split by role/line, space/3  ·  Emphasis role/<tone>-subtle with a role/<tone>-line ring'),
    spec: (d) => actionListSpec(d),
  },
  {
    doc: doc('property-list', 'Property list', '<PropertyList><PropertyListItem icon={<UserIcon />} label="Owner"><PropertyPerson name="Ada Lovelace" /></PropertyListItem></PropertyList>', 'Label column 144, UI/base role/fg-muted with a 16px icon  ·  Rows min 40  ·  Values UI/base role/fg: avatar 20, status dot, Badge secondary, progress role/accent'),
    spec: (d) => propertyListSpec(d),
  },
  {
    doc: doc('inspector-panel', 'Inspector panel', '<InspectorPanel title="Drop shadow" enabled={on} onEnabledChange={setOn} visible onRemove={remove}><InspectorRow label="Offset">…</InspectorRow></InspectorPanel>', 'Header control/default: Checkbox, title UI/base/Medium with a 14px chevron, ghost icon-xs actions role/fg-subtle  ·  Rows: label UI/sm role/fg-muted, 88; fields control/sm  ·  Off: body at 50%'),
    spec: (d) => inspectorPanelSpec(d),
  },
]
