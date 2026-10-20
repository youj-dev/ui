import { add, bezel, box, context, rect, solid, style, text } from '../draw'
import type { IconBuild } from '../icons'
import { iconInstance } from './button'
import { instanceOf, ref, type SetSpec, type VariantSpec } from './set'

/* Card and Tabs: containers that compose other components. The card's footer
 * holds real Button instances; the tab lists hold Tabs/Trigger instances,
 * exposed so their labels edit from the list. */

export const SOURCES = [
  {
    file: 'packages/ui/src/components/ui/card.tsx',
    classes: [
      'group/card relative flex flex-col gap-(--card-spacing) rounded-(--card-radius) border border-line bg-surface py-(--card-spacing) text-ui text-fg shadow-xs',
      '[--card-spacing:calc(var(--spacing)*(5_-_var(--ui--compact,0)))] data-[size=sm]:[--card-spacing:calc(var(--spacing)*(4_-_var(--ui--compact,0)))]',
      'has-data-[slot=card-footer]:pb-0',
      "'text-ui-lg leading-snug font-semibold tracking-tight text-fg group-data-[size=sm]/card:text-ui'",
      "'text-ui text-fg-muted'",
      'flex items-center gap-2 rounded-b-[calc(var(--card-radius,var(--radius-surface))-1px)] border-t border-line bg-band px-(--card-spacing) py-3',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/tabs.tsx',
    classes: [
      'relative inline-flex shrink-0 items-center gap-1.5 rounded-md text-ui font-medium whitespace-nowrap select-none',
      'hover:text-fg data-active:text-fg',
      "'h-control-lg px-3 focus-visible:-outline-offset-2'",
      "'h-full rounded-choice-key px-2.5 focus-visible:outline-offset-0'",
      // The pill key's soft layers and its edge (3:1 against the track in light), and the underline's stroke-wide line (1px until a theme sets it).
      "'rounded-choice-key bg-key shadow-sm-soft inset-ring-(length:--yj-stroke-width) inset-ring-(--ui--key-edge)'",
      "'gap-0.5 rounded-choice [--ui--choice-inset:2px] p-(--ui--choice-inset)', horizontal ? 'h-control w-fit max-w-full bg-well'",
      'data-[variant=underline]:data-[orientation=horizontal]:shadow-[inset_0_calc(-1*var(--yj-stroke-width,1px))_0_var(--color-line)]',
    ],
  },
  {
    file: 'packages/motion/src/components/youj/transitions/sliding-indicator.tsx',
    classes: ["variant === 'pill' ? 'rounded-md bg-selected' : 'h-0.5 rounded-full bg-fg'"],
  },
]

/* ── Card ──────────────────────────────────────────────────────────────── */

/**
 * Bezel's card (bezel.css): an instrument panel. The head is one line (the
 * title, its description as a muted "/ subtitle", a recessed disc at the
 * end); the content and footer are sections split by hairlines, each a step
 * lighter than the one above; the footer starts with a mono capital status.
 * --card-spacing is 24px (sm 16px); the head pads 0.875 of it, the footer 0.7.
 */
async function drawBezelCard(c: ComponentNode, size: 'default' | 'sm', footer: boolean, button: ComponentSetNode, more: ComponentNode) {
  const { vars } = context()
  const spaceVar = size === 'default' ? 'space/6' : 'space/4'
  const space = size === 'default' ? 24 : 16
  await style(c, { dir: 'col', gap: 0, pad: 0, w: 360, radius: 'radius/xl', fill: 'role/surface', stroke: 'role/line', effect: 'Shadow/sm', clip: true })
  const inline = (n: FrameNode) => {
    n.setBoundVariable('paddingLeft', vars.get('scale', spaceVar))
    n.setBoundVariable('paddingRight', vars.get('scale', spaceVar))
  }
  const headPad = Math.round(space * 0.875)
  const header = await box({ name: 'Header', dir: 'row', gap: 0, align: 'center', pad: [headPad, space], w: 'fill', stroke: 'role/line', sides: { bottom: 1 } })
  header.strokesIncludedInLayout = true
  const subtitle = await box(
    { name: 'Subtitle', dir: 'row', align: 'center', w: 'fill' },
    // The slash hangs in a 1.5em gutter, centred, in the subtle ink.
    await text('/', 'UI/base/Regular', 'role/fg-subtle', { name: 'Slash', w: 21, align: 'CENTER' }),
    ref(await text('Ready 12s ago', 'UI/base/Regular', 'role/fg-muted', { name: 'Description', w: 'fill', truncate: true }), 'Description'),
  )
  const disc = await box({ name: 'Action', dir: 'row', align: 'center', justify: 'center', w: 28, h: 28, radius: 'bezel/pill', fill: 'role/well' }, iconInstance(more, 16, 'role/fg-muted'))
  add(
    header,
    ref(await text('Deploy preview', size === 'default' ? 'Bezel/Title' : 'UI/lg/Medium', 'role/fg', { name: 'Title' }), 'Title'),
    subtitle,
    await box({ name: 'Gap', w: 12, h: 1 }),
    disc,
  )
  const content = await box({ name: 'Content', dir: 'col', pad: [space, space], w: 'fill', fill: 'bezel/section-1' })
  content.setBoundVariable('paddingTop', vars.get('scale', spaceVar))
  content.setBoundVariable('paddingBottom', vars.get('scale', spaceVar))
  add(content, await text('Every commit to a branch gets its own preview. Share it with reviewers before it ships.', 'UI/base/Regular', 'role/fg', { name: 'Body', w: 'fill' }))
  add(c, header, content)
  for (const n of [header, content]) inline(n)
  if (!footer) return
  const footPad = Math.round(space * 0.7)
  const f = await box({ name: 'Footer', dir: 'row', gap: 'space/2', align: 'center', pad: [footPad, space], w: 'fill', fill: 'bezel/section-2', stroke: 'role/line', sides: { top: 1 } })
  f.strokesIncludedInLayout = true
  inline(f)
  const cancel = instanceOf(button, { Variant: 'secondary', Size: 'sm', State: 'rest' })
  const open = instanceOf(button, { Variant: 'default', Size: 'sm', State: 'rest' })
  add(f, ref(await text('Build 4f2a', 'Bezel/Eyebrow', 'role/fg-muted', { name: 'Status' }), 'Status'), await box({ name: 'Spacer', w: 'fill', h: 1 }), cancel, open)
  setLabel(cancel, 'Dismiss')
  setLabel(open, 'Open')
  add(c, f)
  for (const i of [cancel, open]) i.isExposedInstance = true
}

export function cardSpec(button: ComponentSetNode, icons: Map<string, IconBuild>): SetSpec {
  const bz = bezel()
  const more = (icons.get('more-horizontal') ?? icons.get('ellipsis') ?? icons.get('arrow-up-right') ?? [...icons.values()][0]!).rest
  const variants: VariantSpec[] = []
  for (const size of ['default', 'sm'] as const)
    for (const footer of [true, false])
      variants.push({
        props: { Size: size, Footer: String(footer) },
        build: async (c) => {
          if (bz) return drawBezelCard(c, size, footer, button, more)
          const space = size === 'default' ? 20 : 16
          const spaceVar = size === 'default' ? 'space/5' : 'space/4'
          await style(c, { dir: 'col', gap: spaceVar, pad: [space, 0, footer ? 0 : space, 0], w: 360, radius: 'radius/xl', fill: 'role/surface', stroke: 'role/line', effect: 'Shadow/xs', clip: true })
          const { vars } = context()
          c.setBoundVariable('paddingTop', vars.get('scale', spaceVar))
          if (!footer) c.setBoundVariable('paddingBottom', vars.get('scale', spaceVar))
          const header = figma.createFrame()
          await style(header, { name: 'Header', dir: 'col', gap: 'space/1', pad: [0, space], w: 'fill' })
          add(
            header,
            ref(await text('Deploy preview', size === 'default' ? 'UI/lg/Semibold' : 'UI/base/Semibold', 'role/fg', { name: 'Title', w: 'fill' }), 'Title'),
            ref(await text('Ready 12s ago on youj-docs', 'UI/base/Regular', 'role/fg-muted', { name: 'Description', w: 'fill' }), 'Description'),
          )
          const content = figma.createFrame()
          await style(content, { name: 'Content', dir: 'col', pad: [0, space], w: 'fill' })
          add(content, await text('Every commit to a branch gets its own preview. Share it with reviewers before it ships.', 'UI/base/Regular', 'role/fg', { name: 'Body', w: 'fill' }))
          add(c, header, content)
          for (const n of [header, content]) {
            n.setBoundVariable('paddingLeft', vars.get('scale', spaceVar))
            n.setBoundVariable('paddingRight', vars.get('scale', spaceVar))
          }
          if (footer) {
            const f = figma.createFrame()
            await style(f, { name: 'Footer', dir: 'row', gap: 'space/2', align: 'center', pad: [12, space], w: 'fill', fill: 'role/band', stroke: 'role/line', sides: { top: 1 } })
            f.strokesIncludedInLayout = true
            f.setBoundVariable('paddingLeft', vars.get('scale', spaceVar))
            f.setBoundVariable('paddingRight', vars.get('scale', spaceVar))
            const cancel = instanceOf(button, { Variant: 'outline', Size: 'sm', State: 'rest' })
            const open = instanceOf(button, { Variant: 'default', Size: 'sm', State: 'rest' })
            add(f, cancel, open)
            setLabel(cancel, 'Dismiss')
            setLabel(open, 'Open preview')
            add(c, f)
            for (const i of [cancel, open]) i.isExposedInstance = true
          }
        },
      })
  return {
    key: 'component:card',
    name: 'Card',
    description: bz
      ? 'Card in packages/ui, in Bezel: an instrument panel. The head is one line (title, “/ subtitle”, a recessed disc); content and footer are sections on hairlines, each a step lighter (bezel/section-*); the footer opens with a mono capital status. `lift` and `spotlight` are motion and live in code.'
      : 'Card in packages/ui: a hairline-bordered surface with a header, content and a recessed footer. `lift` (rises 2px on hover) and `spotlight` (a pointer-tracked light) are motion and live in code.',
    variants,
    properties: [
      { name: 'Title', type: 'TEXT', default: 'Deploy preview', field: 'characters' },
      { name: 'Description', type: 'TEXT', default: bz ? 'Ready 12s ago' : 'Ready 12s ago on youj-docs', field: 'characters' },
      ...(bz ? [{ name: 'Status', type: 'TEXT' as const, default: 'Build 4f2a', field: 'characters' as const }] : []),
    ],
    columns: 'Footer',
    gap: [40, 40],
  }
}

/** Sets an instance's Label text property, whatever its #id. */
export function setLabel(instance: InstanceNode, value: string, property = 'Label') {
  const key = Object.keys(instance.componentProperties).find((k) => k.split('#')[0] === property)
  if (key) instance.setProperties({ [key]: value })
}

/* ── Tabs ──────────────────────────────────────────────────────────────── */

const TRIGGER_STATES = ['rest', 'hover', 'active', 'focus', 'disabled'] as const
type TriggerState = (typeof TRIGGER_STATES)[number]

async function drawTrigger(c: ComponentNode, variant: 'underline' | 'pill', state: TriggerState) {
  const on = state === 'hover' || state === 'active'
  const ink = on ? 'role/fg' : 'role/fg-muted'
  const { vars } = context()
  if (bezel()) {
    // Bezel: both variants are drawn as a key in a recessed track, which is the pill look; the code's default underline look (labels on a hairline, accent bar) is not drawn here yet.
    await style(c, {
      dir: 'row',
      align: 'center',
      justify: 'center',
      gap: 'space/1-5',
      pad: [0, 12],
      h: 26,
      radius: 'bezel/key-radius',
      fill: state === 'active' ? 'role/key' : undefined,
      effect: state === 'active' ? 'Bezel/key' : undefined,
      opacity: state === 'disabled' ? 0.5 : undefined,
    })
    c.setBoundVariable('paddingLeft', vars.get('scale', 'space/3'))
    c.setBoundVariable('paddingRight', vars.get('scale', 'space/3'))
    if (state === 'focus') {
      c.strokes = [solid('role/focus')]
      c.strokeWeight = 2
      c.strokeAlign = 'OUTSIDE'
    }
    add(c, ref(await text('Overview', 'UI/base/Medium', state === 'active' ? 'role/fg' : ink, { name: 'Label' }), 'Label'))
    return
  }
  if (variant === 'underline') {
    await style(c, { dir: 'row', align: 'center', justify: 'center', gap: 'space/1-5', pad: [0, 12], radius: 'radius/xl', opacity: state === 'disabled' ? 0.5 : undefined })
    c.layoutSizingVertical = 'FIXED'
    c.setBoundVariable('height', vars.get('theme', 'control/lg'))
  } else {
    await style(c, {
      dir: 'row',
      align: 'center',
      justify: 'center',
      gap: 'space/1-5',
      pad: [0, 10],
      h: 28,
      radius: 'bezel/key-radius',
      fill: state === 'active' ? 'role/overlay' : undefined,
      effect: state === 'active' ? 'Shadow/sm' : undefined,
      stroke: state === 'active' ? 'ui/key-edge' : undefined,
      opacity: state === 'disabled' ? 0.5 : undefined,
    })
    if (state === 'focus') {
      c.strokes = [solid('role/focus')]
      c.strokeWeight = 2
      c.strokeAlign = 'OUTSIDE'
    }
  }
  add(c, ref(await text('Overview', 'UI/base/Medium', ink, { name: 'Label' }), 'Label'))
  if (variant !== 'underline') return

  // Absolute layers over the auto layout: the hover pill (inset 6px), the focus ring around it, the active bar.
  const w = c.width
  const h = c.height
  const overlay = (node: RectangleNode, x: number, y: number, width: number, height: number, vertical: ConstraintType) => {
    add(c, node)
    node.layoutPositioning = 'ABSOLUTE'
    node.x = x
    node.y = y
    node.resize(width, height)
    node.constraints = { horizontal: 'STRETCH', vertical }
    return node
  }
  if (state === 'hover') {
    const pill = overlay(rect('Hover', 10, 10, 'role/hover', 'radius/md'), 6, 6, w - 12, h - 12, 'STRETCH')
    c.insertChild(0, pill)
  }
  if (state === 'focus') {
    const ring = overlay(rect('Focus ring', 10, 10, null, 'radius/md'), 6, 6, w - 12, h - 12, 'STRETCH')
    ring.strokes = [solid('role/focus')]
    ring.strokeWeight = 2
    ring.strokeAlign = 'INSIDE'
  }
  if (state === 'active') overlay(rect('Indicator', 10, 2, 'role/fg', 'radius/full'), 0, h - 2, w, 2, 'MAX')
}

export function triggerSpec(): SetSpec {
  const variants: VariantSpec[] = []
  for (const variant of ['underline', 'pill'] as const)
    for (const state of TRIGGER_STATES) variants.push({ props: { Variant: variant, State: state }, build: (c) => drawTrigger(c, variant, state) })
  return {
    key: 'component:tabs-trigger',
    name: 'Tabs/Trigger',
    description:
      'TabsTrigger in packages/ui. In code the selection is a motion SlidingIndicator that glides between tabs on the smooth spring (and retargets mid-glide); underline tabs add a hover pill that follows the pointer. Here each state is drawn in place.',
    variants,
    properties: [{ name: 'Label', type: 'TEXT', default: 'Overview', field: 'characters' }],
    columns: 'State',
  }
}

export function tabsSpec(trigger: ComponentSetNode): SetSpec {
  const labels = ['Overview', 'Activity', 'Settings']
  return {
    key: 'component:tabs',
    name: 'Tabs',
    description: 'A TabsList with three triggers, the first selected. The triggers are exposed instances: edit their labels and states from here.',
    variants: (['underline', 'pill'] as const).map((variant) => ({
      props: { Variant: variant },
      build: async (c: ComponentNode) => {
        const { vars } = context()
        const bz = bezel()
        if (bz) {
          // Bezel: a recessed pill track, 3px in, keys 2px apart.
          await style(c, { dir: 'row', gap: 2, pad: 3, radius: 'bezel/pill', fill: 'role/well' })
          c.layoutSizingVertical = 'FIXED'
          c.setBoundVariable('height', vars.get('theme', 'control/default'))
        } else if (variant === 'underline') {
          await style(c, { dir: 'row', gap: 'space/1', stroke: 'role/line', sides: { bottom: 1 } })
        } else {
          await style(c, { dir: 'row', gap: 'space/0-5', pad: 2, radius: 'bezel/pill', fill: 'role/band' })
          c.layoutSizingVertical = 'FIXED'
          c.setBoundVariable('height', vars.get('theme', 'control/default'))
        }
        labels.forEach((label, i) => {
          const t = instanceOf(trigger, { Variant: variant, State: i === 0 ? 'active' : 'rest' })
          add(c, t)
          setLabel(t, label)
          t.isExposedInstance = true
          if (variant === 'pill' || bz) t.layoutSizingVertical = 'FILL'
        })
      },
    })),
    properties: [],
    columns: 'Variant',
    gap: [48, 16],
  }
}
