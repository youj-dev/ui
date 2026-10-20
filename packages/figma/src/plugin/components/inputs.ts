import { add, bezel, box, context, rect, setRadius, solid, style, text, vector, type Ink } from '../draw'
import { drawButton, iconInstance } from './button'
import { button, clear, controlHeight, controlSquare, eyebrow, field, fieldLook, figure, icon, instance, padBlock, padInline, pick, scaleVar, spacer, themeVar, type Deps, type Entry, type FieldState, type Source } from './parts'
import { ref, type SetSpec, type VariantSpec } from './set'

/* Catalog batch: inputs. Each entry draws one component from its file in
 * packages/ui/src/components/ui (see parts.ts for the shared pieces). */

export const SOURCES: Source[] = [
  {
    file: 'packages/ui/src/components/ui/native-select.tsx',
    classes: [
      "'h-control appearance-none truncate ps-2.5 pe-8 disabled:opacity-100'",
      "'data-[size=sm]:h-control-sm data-[size=sm]:rounded-field-sm data-[size=sm]:ps-2 data-[size=sm]:pe-7'",
      "'data-[size=lg]:h-control-lg data-[size=lg]:rounded-field-lg data-[size=lg]:ps-3 data-[size=lg]:pe-9 data-[size=lg]:text-ui-lg'",
      "'pointer-events-none absolute end-2.5 top-1/2 flex -translate-y-1/2 text-fg-muted'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/button-group.variants.ts',
    classes: [
      "'[&>[data-slot]:has(~[data-slot])]:rounded-e-none',",
      "'[&>[data-slot]~[data-slot]]:rounded-s-none [&>[data-slot]~[data-slot]]:border-s-0',",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/button-group.tsx',
    classes: ["'flex items-center gap-2 rounded-md border border-line bg-band px-2.5 text-ui font-medium text-fg-muted'"],
  },
  {
    file: 'packages/ui/src/components/ui/toggle-group.tsx',
    classes: [
      "'rounded-none shadow-[inset_0_calc(-1*var(--yj-stroke-width,1px))_0_var(--color-line)]'",
      "'rounded-choice bg-well [--ui--choice-inset:2px] p-(--ui--choice-inset)'",
      "'data-pressed:bg-transparent data-pressed:shadow-[inset_0_-2px_0_var(--color-accent)]'",
      "'data-pressed:bg-key data-pressed:shadow-sm-soft data-pressed:inset-ring-(length:--yj-stroke-width) data-pressed:inset-ring-(--ui--key-edge)'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/segmented-control.tsx',
    classes: ["variant={variant === 'pill' ? 'pill' : 'segmented'}"],
  },
  {
    file: 'packages/ui/src/components/ui/capsule.tsx',
    classes: [
      "'inline-flex max-w-full shrink-0 items-center gap-1 rounded-2xl border border-line bg-chrome-float p-1 text-fg shadow-xs'",
      "default: 'h-[calc(var(--spacing-control)+--spacing(2))]',",
      "'shrink-0 px-2 text-ui-sm whitespace-nowrap text-fg-muted'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/capsule-toggle.tsx',
    classes: ['variant="pill"', 'className="h-full bg-transparent p-0"'],
  },
  {
    file: 'packages/ui/src/components/ui/theme-toggle.tsx',
    classes: ["const icon = { light: <SunIcon />, dark: <MoonIcon />, system: <MonitorIcon /> }", 'variant="ghost"', "size={size ?? 'icon'}"],
  },
  {
    file: 'packages/ui/src/components/ui/async-button.tsx',
    classes: [
      "'data-[state=error]:border-transparent data-[state=error]:text-on-accent! data-[state=error]:opacity-100!'",
      "'data-[state=success]:border-transparent data-[state=success]:text-on-accent! data-[state=success]:opacity-100!'",
      '<Spinner label={null} />',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/inline-confirm.tsx',
    classes: ['variant="outline"', "variant={destructive ? 'danger' : 'default'}", "contentClassName=\"gap-1.5\""],
  },
  {
    file: 'packages/ui/src/components/ui/input-group.tsx',
    classes: [
      "'group/input-group relative flex h-control w-full min-w-0 items-center rounded-field border border-(--ui--field-line) bg-(--ui--field-fill)',",
      "'block-end': 'order-last w-full justify-start px-2.5 pb-2 [.border-t]:pt-2',",
      "'icon-xs': 'size-control-xs rounded-field-xs p-0',",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/input-otp.tsx',
    classes: [
      "'relative grid h-control-lg w-control-lg min-w-8 shrink place-items-center p-0 text-base font-medium tabular-nums',",
      'className="h-px w-2.5 shrink-0 rounded-full bg-fg-subtle"',
      'className="absolute h-4 w-px bg-fg"',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/number-input.tsx',
    classes: ['<InputGroupAddon align="inline-end" className="gap-0.5 ps-1">', 'render={<InputGroupButton size="icon-xs" aria-label={labels.decrease} className="text-fg-muted" />}'],
  },
  {
    file: 'packages/ui/src/components/ui/password-input.tsx',
    classes: [
      "const SEGMENT_TINT = ['bg-danger', 'bg-danger', 'bg-warning', 'bg-success', 'bg-success'] as const",
      'className="relative h-1 flex-1 overflow-hidden rounded-full bg-well"',
      '<EyeIcon active={visible} size={16} strokeWidth={1.75} />',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/phone-input.tsx',
    classes: ['className="h-4 w-px bg-line"', "'h-full data-[size=default]:h-full gap-1 rounded-s-[inherit] rounded-e-none border-0 bg-transparent ps-2.5 pe-1.5 shadow-none',"],
  },
  {
    file: 'packages/ui/src/components/ui/rating.tsx',
    classes: [
      "const SIZES = { sm: 'size-6 rounded-sm', default: 'size-7 rounded-md', lg: 'size-8 rounded-md' } as const",
      "const GAPS = { sm: 'gap-0.5', default: 'gap-1', lg: 'gap-1.5' } as const",
      "kept ? 'border-accent-line bg-accent-subtle' : 'border-line-control bg-key',",
      "const STAR = 'M12 2.7 L14.73 8.74 L21.32 9.47 L16.42 13.94 L17.76 20.43 L12 17.15 L6.24 20.43 L7.58 13.94 L2.68 9.47 L9.27 8.74 Z'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/choice-card.tsx',
    classes: ["'flex size-8 shrink-0 items-center justify-center rounded-md border border-line-subtle bg-band text-fg-muted [&>svg]:size-4',", 'className="ms-auto shrink-0 self-center text-ui-sm text-fg-muted tabular-nums"'],
  },
  {
    file: 'packages/ui/src/components/ui/field.tsx',
    classes: [
      "'has-[>[data-slot=field]]:rounded-lg has-[>[data-slot=field]]:border has-[>[data-slot=field]]:border-line has-[>[data-slot=field]]:font-normal',",
      "'has-[>[data-slot=field]]:has-data-checked:border-accent has-[>[data-slot=field]]:has-data-checked:inset-ring has-[>[data-slot=field]]:has-data-checked:inset-ring-accent has-[>[data-slot=field]]:has-data-checked:hover:bg-transparent',",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/form.tsx',
    classes: ['return <Field data-slot="form-item" invalid={invalid} {...props} />', 'data-slot="form-submit"'],
  },
  {
    file: 'packages/ui/src/components/ui/slide-to-confirm.tsx',
    classes: [
      "default: '[--ui--slide-h:calc(var(--spacing-control-lg)+--spacing(2))] text-ui',",
      "'rounded-control-lg bg-well p-1 inset-ring inset-ring-line',",
      "default: { fill: 'bg-accent-subtle', thumb: 'border-(--ui--fill-edge) bg-action text-on-action' },",
    ],
  },
]

type Spec = (deps: Deps) => SetSpec

/** An icon swap on an instance's Icon property. */
function swapIcon(instance: InstanceNode, component: ComponentNode, property = 'Icon') {
  const key = Object.keys(instance.componentProperties).find((k) => k.split('#')[0] === property)
  if (key) instance.setProperties({ [key]: component.id })
}

/** Recolours a drawn control's text and icon ink. */
function reink(node: FrameNode | ComponentNode | InstanceNode, ink: string) {
  const paint = solid(ink)
  for (const n of node.findAll((n) => n.type === 'TEXT' || n.type === 'VECTOR')) {
    const v = n as VectorNode
    const isInk = (p: readonly Paint[] | PluginAPI['mixed']) => Array.isArray(p) && p.length > 0 && p[0]!.type === 'SOLID' && !!(p[0] as SolidPaint).boundVariables?.color
    if (n.type === 'TEXT') (n as TextNode).fills = [paint]
    else {
      if (isInk(v.strokes)) v.strokes = [paint]
      if (isInk(v.fills)) v.fills = [paint]
    }
  }
}

/* ── NativeSelect ───────────────────────────────────────────────────────── */

const NATIVE_SIZES = {
  sm: { height: 'control/sm', start: 'space/2', end: 'space/2', text: 'UI/base/Regular' },
  default: { height: 'control/default', start: 'space/2-5', end: 'space/2-5', text: 'UI/base/Regular' },
  lg: { height: 'control/lg', start: 'space/3', end: 'space/3', text: 'UI/lg/Regular' },
} as const

function nativeSelectSpec({ icons }: Deps): SetSpec {
  const variants: VariantSpec[] = []
  for (const state of ['rest', 'focus', 'invalid', 'disabled'] as const)
    for (const size of ['default', 'sm', 'lg'] as const)
      variants.push({
        props: { Size: size, State: state },
        build: async (c) => {
          const s = NATIVE_SIZES[size]
          await field(c, { state: state as FieldState, w: 200, height: s.height, gap: 'space/1-5' })
          // The select pads its start; the chevron sits end-2.5 (end-2 sm, end-3 lg) inside the pe-8 room.
          padInline(c, s.start, s.end)
          add(c, ref(await text('Pro plan', s.text, 'role/fg', { name: 'Value', w: 'fill', truncate: true }), 'Value'), icon(icons, 'chevron-down', 16, 'role/fg-muted'))
        },
      })
  return {
    key: 'component:native-select',
    name: 'Native select',
    description:
      'NativeSelect in packages/ui: the browser’s own <select> dressed as a field (Input’s well, hover and focus, the control heights) with Select’s 16px chevron at the end. The popup is the operating system’s, so only the trigger is drawn. An empty value reads muted, as a placeholder.',
    variants,
    properties: [{ name: 'Value', type: 'TEXT', default: 'Pro plan', field: 'characters' }],
    columns: 'Size',
  }
}

/* ── ButtonGroup ────────────────────────────────────────────────────────── */

/** Squares the corners a joined neighbour meets. */
function join(node: FrameNode, horizontal: boolean, first: boolean, last: boolean) {
  type Corner = 'topLeftRadius' | 'topRightRadius' | 'bottomLeftRadius' | 'bottomRightRadius'
  const start: Corner[] = horizontal ? ['topLeftRadius', 'bottomLeftRadius'] : ['topLeftRadius', 'topRightRadius']
  const end: Corner[] = horizontal ? ['topRightRadius', 'bottomRightRadius'] : ['bottomLeftRadius', 'bottomRightRadius']
  const corners = [...(first ? [] : start), ...(last ? [] : end)]
  for (const corner of corners) {
    node.setBoundVariable(corner, null)
    node[corner] = 0
  }
}

const buttonGroupSpec: Spec = () => {
  const combos = [
    { Orientation: 'horizontal', Content: 'buttons' },
    { Orientation: 'horizontal', Content: 'text' },
    { Orientation: 'vertical', Content: 'buttons' },
  ] as const
  return {
    key: 'component:button-group',
    name: 'Button group',
    description:
      'ButtonGroup in packages/ui: Buttons (or a Select, an Input) joined into one control. Inner corners square off and neighbours share their border; ButtonGroupText is a band-coloured addon with a hairline. Stack them with orientation="vertical". Each button keeps its own variant and focus.',
    variants: combos.map((props) => ({
      props,
      build: async (c: ComponentNode) => {
        const horizontal = props.Orientation === 'horizontal'
        // Joined: each border sits over its neighbour's (border-s-0 in code).
        await style(c, { dir: horizontal ? 'row' : 'col', gap: -1, align: 'center' })
        const labels = props.Content === 'text' ? ['https://', 'youj.dev'] : horizontal ? ['Archive', 'Report', 'Snooze'] : ['Top', 'Middle', 'Bottom']
        for (const [i, label] of labels.entries()) {
          const first = i === 0
          const last = i === labels.length - 1
          let item: FrameNode
          if (props.Content === 'text' && first) {
            item = await box({ name: 'Text', dir: 'row', align: 'center', gap: 'space/2', fill: 'role/band', stroke: 'role/line', radius: 'bezel/pill' })
            padInline(item, 'space/2-5')
            controlHeight(item)
            add(item, await text(label, 'UI/base/Medium', 'role/fg-muted', { name: 'Label' }))
          } else if (props.Content === 'text') {
            item = await field(await box({ name: 'Input' }), { w: 180 })
            if (!bezel()) item.strokes = [solid('role/line-control')]
            add(item, ref(await text(label, 'UI/base/Regular', 'role/fg', { name: 'Value', w: 'fill' }), 'Value'))
          } else {
            item = figma.createFrame()
            await drawButton(item, 'outline', 'default', 'rest', label, null, false)
            item.name = label
            ref(item.children[0]!, `Button ${i + 1}`)
          }
          join(item, horizontal, first, last)
          add(c, item)
          if (!horizontal) item.layoutSizingHorizontal = 'FILL'
        }
      },
    })),
    properties: [
      { name: 'Button 1', type: 'TEXT', default: 'Archive', field: 'characters' },
      { name: 'Button 2', type: 'TEXT', default: 'Report', field: 'characters' },
      { name: 'Button 3', type: 'TEXT', default: 'Snooze', field: 'characters' },
      { name: 'Value', type: 'TEXT', default: 'youj.dev', field: 'characters' },
    ],
    columns: 'Content',
    gap: [40, 24],
  }
}

/* ── SegmentedControl, and the tracks it lends ThemeToggle and CapsuleToggle ── */

type SegSize = 'sm' | 'default' | 'lg'
const SEG = {
  sm: { height: 'control/sm', px: 'space/2-5', text: 'UI/base/Medium', icon: 14 },
  default: { height: 'control/default', px: 'space/3', text: 'UI/base/Medium', icon: 16 },
  lg: { height: 'control/lg', px: 'space/3', text: 'UI/lg/Medium', icon: 16 },
} as const

interface Segment {
  label?: string
  icon?: ComponentNode
  /** A text property for the label. */
  property?: string
}

/**
 * A segmented row: `underline` (muted labels on a hairline, the chosen one
 * full-strength over a 2px accent bar) or `pill` (a recessed well, the chosen
 * one a raised key at the concentric corner). `bare` drops the well (inside a capsule).
 */
async function segmented(c: FrameNode | ComponentNode, variant: 'underline' | 'pill', size: SegSize, items: Segment[], pressed: number, bare = false) {
  const s = SEG[size]
  const bz = bezel()
  const pill = variant === 'pill'
  const inset = bare ? 0 : bz ? 3 : 2
  await style(c, {
    dir: 'row',
    gap: pill ? (bz ? 2 : 'space/0-5') : 'space/0-5',
    pad: pill ? inset : 0,
    align: 'center',
    radius: pill ? 'bezel/pill' : 0,
    fill: pill && !bare ? 'role/well' : undefined,
    stroke: pill ? undefined : 'role/line',
    sides: pill ? undefined : { bottom: 1 },
  })
  if (!bare) controlHeight(c, s.height)
  for (const [i, item] of items.entries()) {
    const on = i === pressed
    const ink = on ? 'role/fg' : 'role/fg-muted'
    const key = await box({
      name: on ? 'Key (pressed)' : 'Key',
      dir: 'row',
      gap: 'space/1-5',
      align: 'center',
      justify: 'center',
      radius: pill ? 'bezel/key-radius' : 0,
      fill: on && pill ? 'role/key' : undefined,
      effect: on && pill ? (bz ? 'Bezel/key' : 'Shadow/sm') : undefined,
      stroke: on ? (pill ? (bz ? undefined : 'ui/key-edge') : 'role/accent') : undefined,
      sides: on && !pill ? { bottom: 2 } : undefined,
    })
    if (item.label) padInline(key, bare && bz ? 'space/3-5' : s.px)
    if (item.icon) add(key, iconInstance(item.icon, s.icon, ink))
    if (item.label) {
      const t = await text(item.label, s.text, ink, { name: 'Label' })
      add(key, item.property ? ref(t, item.property) : t)
    }
    add(c, key)
    key.layoutSizingVertical = 'FILL'
    if (!item.label) {
      // Icon-only keys are square: the control height across.
      key.layoutSizingHorizontal = 'FIXED'
      key.resize(1, key.height)
      key.setBoundVariable('width', themeVar(s.height))
    }
  }
}

const segmentedControlSpec: Spec = () => {
  const variants: VariantSpec[] = []
  for (const size of ['default', 'sm', 'lg'] as const)
    for (const variant of ['underline', 'pill'] as const)
      variants.push({
        props: { Variant: variant, Size: size },
        build: (c) => segmented(c, variant, size, [{ label: 'Day', property: 'Item 1' }, { label: 'Week', property: 'Item 2' }, { label: 'Month', property: 'Item 3' }], 1),
      })
  return {
    key: 'component:segmented-control',
    name: 'Segmented control',
    description:
      'SegmentedControl in packages/ui: one choice of a few, as a ToggleGroup that always has one segment pressed. underline is muted labels on a hairline with the chosen one over a 2px accent bar; pill is a recessed well with the chosen one a raised key. The group is the control height of its size, so it lines up with inputs and buttons. In code the bar or key glides between segments on the smooth spring.',
    variants,
    properties: ['Day', 'Week', 'Month'].map((label, i) => ({ name: `Item ${i + 1}`, type: 'TEXT' as const, default: label, field: 'characters' as const })),
    columns: 'Variant',
    gap: [40, 16],
  }
}

/* ── Capsule shell ──────────────────────────────────────────────────────── */

/** The floating capsule: Bezel's lifted pill on a faint ring, Classic's bordered rounded panel. The control height plus 4px inset each side. */
async function capsule(c: FrameNode | ComponentNode, gap: string | number = 'space/1') {
  const bz = bezel()
  await style(c, {
    dir: 'row',
    gap,
    pad: 0,
    align: 'center',
    radius: bz ? 'bezel/pill' : 'radius/2xl',
    fill: bz ? 'bezel/capsule' : 'role/chrome-float',
    stroke: bz ? (['role/fg', 0.08] as Ink) : 'role/line',
    effect: bz ? 'Shadow/sm' : 'Shadow/xs',
  })
  for (const side of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] as const) c.setBoundVariable(side, scaleVar('space/1'))
}

const capsuleToggleSpec: Spec = ({ icons }) => {
  const variants: VariantSpec[] = []
  for (const content of ['text', 'icons'] as const)
    for (const size of ['default', 'sm'] as const)
      variants.push({
        props: { Size: size, Content: content },
        build: async (c) => {
          await capsule(c, 0)
          const label = await box({ name: 'Label', dir: 'row', pad: [0, 8] }, ref(await eyebrow('View'), 'Label'))
          const track = await box({ name: 'Segmented control' })
          add(c, label, track)
          const items: Segment[] =
            content === 'text'
              ? [{ label: 'List', property: 'Item 1' }, { label: 'Board', property: 'Item 2' }, { label: 'Calendar', property: 'Item 3' }]
              : [{ icon: pick(icons, 'list').rest }, { icon: pick(icons, 'layout-grid', 'grid').rest }, { icon: pick(icons, 'calendar').rest }]
          await segmented(track, 'pill', size, items, 0, true)
          controlHeight(track, SEG[size].height)
        },
      })
  return {
    key: 'component:capsule-toggle',
    name: 'Capsule toggle',
    description:
      'CapsuleToggle in packages/ui: two or three options in a floating capsule, with an optional eyebrow first. The capsule is the track: the segmented control drops its well and the chosen option is a raised key inside the capsule, concentric with its ends. iconOnly shows square icon keys, each named by its label.',
    variants,
    properties: [
      { name: 'Label', type: 'TEXT', default: 'View', field: 'characters' },
      ...['List', 'Board', 'Calendar'].map((label, i) => ({ name: `Item ${i + 1}`, type: 'TEXT' as const, default: label, field: 'characters' as const })),
    ],
    columns: 'Content',
    gap: [40, 16],
  }
}

/* ── ThemeToggle ────────────────────────────────────────────────────────── */

const themeToggleSpec: Spec = ({ icons }) => {
  const variants: VariantSpec[] = []
  for (const variant of ['button', 'segmented'] as const)
    for (const size of ['default', 'sm'] as const)
      variants.push({
        props: { Variant: variant, Size: size },
        build: async (c) => {
          if (variant === 'button') {
            await drawButton(c, 'ghost', size === 'sm' ? 'icon-sm' : 'icon', 'rest', '', pick(icons, 'theme', 'moon').rest, false)
            return
          }
          await segmented(c, 'underline', size, [{ icon: pick(icons, 'sun').rest }, { icon: pick(icons, 'moon').rest }, { icon: pick(icons, 'monitor').rest }], 1)
        },
      })
  return {
    key: 'component:theme-toggle',
    name: 'Theme toggle',
    description:
      'ThemeToggle in packages/ui: light, dark or system, remembered in localStorage and applied to <html> before paint (ThemeScript). button is a ghost icon button whose sun turns to a moon; segmented is a SegmentedControl of sun, moon and monitor, dark chosen here. In code the icon morphs and the bar glides.',
    variants,
    properties: [],
    columns: 'Variant',
    gap: [40, 16],
  }
}

/* ── AsyncButton ────────────────────────────────────────────────────────── */

const ASYNC = {
  idle: { label: 'Publish', property: 'Label', fill: null as string | null, icon: null as string | null },
  pending: { label: 'Working…', property: 'Pending label', fill: null, icon: 'loader-ring' },
  success: { label: 'Done', property: 'Success label', fill: 'role/success', icon: 'check' },
  error: { label: 'Failed', property: 'Error label', fill: 'role/danger', icon: 'x' },
}

const asyncButtonSpec: Spec = ({ icons }) => {
  const variants: VariantSpec[] = []
  for (const size of ['default', 'sm'] as const)
    for (const state of ['idle', 'pending', 'success', 'error'] as const)
      variants.push({
        props: { Size: size, State: state },
        build: async (c) => {
          const s = ASYNC[state]
          await drawButton(c, 'default', size, 'rest', s.label, s.icon ? pick(icons, s.icon).rest : null, false)
          // Success and error tint the whole button, the label in the contrast ink.
          if (s.fill) {
            c.fills = [solid(s.fill)]
            reink(c, 'role/on-accent')
          }
          const label = c.findOne((n) => n.type === 'TEXT')
          if (label) ref(label, s.property)
        },
      })
  return {
    key: 'component:async-button',
    name: 'Async button',
    description:
      'AsyncButton in packages/ui: a Button that runs its work (`onAction`) or follows a `status`, through pending → success | error → idle. Pending shows a spinner and blocks presses; success and error tint the button and draw a check or a cross, then return to rest. Drawn in the default variant; every Button variant and size applies. In code the label morphs and an error shakes.',
    variants,
    properties: Object.values(ASYNC).map((s) => ({ name: s.property, type: 'TEXT' as const, default: s.label, field: 'characters' as const })),
    columns: 'State',
  }
}

/* ── InlineConfirm ──────────────────────────────────────────────────────── */

const inlineConfirmSpec: Spec = ({ icons, get }) => {
  const button = get('button')
  const variants: VariantSpec[] = []
  for (const tone of ['default', 'danger'] as const)
    for (const state of ['closed', 'open'] as const)
      variants.push({
        props: { Tone: tone, State: state },
        build: async (c) => {
          await style(c, { dir: 'row', gap: 'space/1-5', align: 'center' })
          const make = (variant: string, size: string) => button.children.find((v) => {
            const p = (v as ComponentNode).variantProperties ?? {}
            return p.Variant === variant && p.Size === size && p.State === 'rest'
          }) as ComponentNode
          if (state === 'closed') {
            const trigger = make('outline', 'default').createInstance()
            add(c, trigger)
            const key = Object.keys(trigger.componentProperties).find((k) => k.split('#')[0] === 'Label')
            if (key) trigger.setProperties({ [key]: tone === 'danger' ? 'Delete' : 'Archive' })
            return
          }
          const cancel = make('outline', 'icon').createInstance()
          const confirm = make(tone === 'danger' ? 'danger' : 'default', 'icon').createInstance()
          swapIcon(cancel, pick(icons, 'x').rest)
          swapIcon(confirm, pick(icons, 'check').rest)
          // A swap brings the icon in its own ink: give it the button's again.
          reink(cancel, 'role/fg')
          reink(confirm, tone === 'danger' ? 'role/on-accent' : bezel() ? 'role/canvas' : 'role/on-action')
          add(c, cancel, confirm)
        },
      })
  return {
    key: 'component:inline-confirm',
    name: 'Inline confirm',
    description:
      'InlineConfirm in packages/ui: a button that asks before it acts, in place. Pressed, it splits into a cross (cancel) and a tick (confirm, an AsyncButton: danger when destructive) (the question is their accessible name, announced); the tick runs onConfirm through pending, success or error. Esc or focus leaving folds it back. In code the button morphs between the two on the AsyncButton’s spring.',
    variants,
    properties: [],
    columns: 'State',
    gap: [40, 16],
  }
}

/* ── InputGroup ─────────────────────────────────────────────────────────── */

/** InputGroupButton: a ghost key inside the group, control-xs square. */
async function groupKey(icons: Deps['icons'], name: string, ink = 'role/fg-muted') {
  const k = await box({ name: 'Button', dir: 'row', align: 'center', justify: 'center', radius: 'bezel/pill' })
  controlSquare(k, 'control/xs')
  add(k, icon(icons, name, 14, ink))
  return k
}

/** The group's frame: the field look, a control tall (auto for block addons, at the area corner). */
async function groupFrame<T extends FrameNode | ComponentNode>(c: T, state: FieldState, p: { w?: number; block?: boolean } = {}): Promise<T> {
  if (p.block) {
    await style(c, { dir: 'col', gap: 0, w: p.w ?? 260, ...fieldLook(state, true) })
    c.strokesIncludedInLayout = true
    return c
  }
  await field(c, { state, w: p.w ?? 240, gap: 'space/1-5' })
  padInline(c, 'space/2-5')
  return c
}

const inputGroupSpec: Spec = ({ icons, get }) => {
  const aligns = ['inline-start', 'inline-end', 'block-start', 'block-end'] as const
  const variants: VariantSpec[] = []
  for (const state of ['rest', 'focus'] as const)
    for (const align of aligns)
      variants.push({
        props: { Align: align, State: state },
        build: async (c) => {
          const block = align.startsWith('block')
          await groupFrame(c, state, { block })
          if (align === 'inline-start') {
            add(c, icon(icons, 'search', 16, 'role/fg-muted'), ref(await text('Search issues…', 'UI/base/Regular', 'role/fg-muted', { name: 'Placeholder', w: 'fill', truncate: true }), 'Placeholder'))
            return
          }
          if (align === 'inline-end') {
            const kbd = instance(get, 'kbd', { Content: 'symbol' })
            add(c, ref(await text('Search issues…', 'UI/base/Regular', 'role/fg-muted', { name: 'Placeholder', w: 'fill', truncate: true }), 'Placeholder'), kbd)
            return
          }
          const addon = await box({ name: 'Addon', dir: 'row', align: 'center', gap: 'space/1-5', w: 'fill' })
          padInline(addon, 'space/2-5')
          const control = await box({ name: 'Control', dir: 'col', w: 'fill' })
          padInline(control, 'space/2-5')
          if (align === 'block-start') {
            addon.setBoundVariable('paddingTop', scaleVar('space/2'))
            add(addon, icon(icons, 'mail', 14, 'role/fg-muted'), await text('To: design@youj.dev', 'UI/sm/Regular', 'role/fg-muted', { name: 'Addon text', w: 'fill' }))
            padBlock(control, 'space/2-5', 'space/2')
            add(control, ref(await text('Weekly review notes', 'UI/base/Regular', 'role/fg', { name: 'Value', w: 'fill' }), 'Value'))
            add(c, addon, control)
          } else {
            padBlock(control, 'space/2', 'space/2-5')
            add(control, ref(await text('Ask a follow-up…', 'UI/base/Regular', 'role/fg-muted', { name: 'Placeholder', w: 'fill' }), 'Placeholder'))
            addon.setBoundVariable('paddingBottom', scaleVar('space/2'))
            const send = button(get, '', { Variant: 'default', Size: 'icon-sm' })
            swapIcon(send, pick(icons, 'arrow-up', 'send').rest)
            reink(send, bezel() ? 'role/canvas' : 'role/on-action')
            add(addon, await groupKey(icons, 'plus'), await spacer(), send)
            add(c, control, addon)
          }
        },
      })
  return {
    key: 'component:input-group',
    name: 'Input group',
    description:
      'InputGroup in packages/ui: a field control with addons (an icon, text, a Kbd, an InputGroupButton) inside its frame. The group takes the field’s fill, hover, focus and invalid treatment; inline addons sit at the ends, block addons above or below (a toolbar under a textarea), and then the frame takes the capped area corner.',
    variants,
    properties: [
      { name: 'Placeholder', type: 'TEXT', default: 'Search issues…', field: 'characters' },
      { name: 'Value', type: 'TEXT', default: 'Weekly review notes', field: 'characters' },
    ],
    columns: 'Align',
    gap: [32, 16],
  }
}

/* ── InputOTP ───────────────────────────────────────────────────────────── */

const inputOtpSpec: Spec = ({ icons }) => {
  const statuses = ['typing', 'success', 'error', 'disabled'] as const
  return {
    key: 'component:input-otp',
    name: 'Input OTP',
    description:
      'InputOTP in packages/ui: a one-time code as square slots (control-lg, in the field look, at the field corner), in groups split by a short dash. The active slot wears the focus frame with a caret, which in code glides from slot to slot. A complete code verifies: success edges the slots in success with a tick, an error in danger.',
    variants: statuses.map((status) => ({
      props: { Status: status },
      build: async (c: ComponentNode) => {
        await style(c, { dir: 'row', gap: 'space/3', align: 'center', opacity: status === 'disabled' ? 0.5 : undefined })
        const code = '482913'
        const filled = status === 'typing' ? 2 : 6
        const slots = await box({ name: 'Slots', dir: 'row', gap: 'space/2', align: 'center' })
        for (const g of [0, 1]) {
          if (g) add(slots, rect('Dash', 10, 1, 'role/fg-subtle', 'radius/full'))
          const group = await box({ name: 'Group', dir: 'row', gap: 'space/1-5', align: 'center' })
          for (let i = g * 3; i < g * 3 + 3; i++) {
            const active = status === 'typing' && i === filled
            const look = fieldLook(active ? 'focus' : status === 'disabled' ? 'disabled' : 'rest')
            const slot = await box({ name: active ? 'Slot (active)' : 'Slot', dir: 'row', align: 'center', justify: 'center', ...look, opacity: undefined })
            if (status === 'success' || status === 'error') slot.strokes = [solid(status === 'success' ? 'role/success' : 'role/danger')]
            // The focus frame is drawn at the area corner (rounded-field-area).
            if (active) setRadius(slot, 'bezel/field-area-radius')
            controlSquare(slot, 'control/lg')
            if (i < filled) {
              const t = await text(code[i]!, 'Body/base', 'role/fg', { name: 'Digit' })
              t.fontName = context().fonts.font('sans', 500)
              add(slot, t)
            }
            if (active) add(slot, rect('Caret', 1, 16, 'role/fg'))
            add(group, slot)
          }
          add(slots, group)
        }
        add(c, slots)
        if (status === 'success') add(c, icon(icons, 'check', 20, 'role/success'))
      },
    })),
    properties: [],
    columns: 'Status',
    gap: [40, 16],
  }
}

/* ── NumberInput ────────────────────────────────────────────────────────── */

const numberInputSpec: Spec = ({ icons }) => ({
  key: 'component:number-input',
  name: 'Number input',
  description:
    'NumberInput in packages/ui: an InputGroup with the number (tabular figures, formatted by locale) and a minus and plus as ghost icon keys at the end. Arrow keys, wheel and the keys step it; at a limit its key disables. In code each step rolls the digits.',
  variants: (['rest', 'focus', 'invalid', 'disabled'] as const).map((state) => ({
    props: { State: state },
    build: async (c: ComponentNode) => {
      await groupFrame(c, state, { w: 200 })
      padInline(c, 'space/2-5', 'space/1')
      const keys = await box({ name: 'Steppers', dir: 'row', gap: 'space/0-5', align: 'center' }, await groupKey(icons, 'minus'), await groupKey(icons, 'plus'))
      add(c, ref(figure(await text('1,250', 'UI/base/Regular', 'role/fg', { name: 'Value', w: 'fill' }), 400), 'Value'), keys)
    },
  })),
  properties: [{ name: 'Value', type: 'TEXT', default: '1,250', field: 'characters' }],
  columns: 'State',
})

/* ── PasswordInput ──────────────────────────────────────────────────────── */

const passwordInputSpec: Spec = ({ icons }) => ({
  key: 'component:password-input',
  name: 'Password input',
  description:
    'PasswordInput in packages/ui: an InputGroup with a reveal key (the eye, which closes as it hides) and, while Caps Lock is on, a warning glyph. PasswordStrength is a four-segment meter in danger, warning or success with its word; PasswordRequirements ticks each rule as it is met. In code the segments fill one after another.',
  variants: (['hidden', 'shown', 'strength'] as const).map((content) => ({
    props: { Content: content },
    build: async (c: ComponentNode) => {
      await style(c, { dir: 'col', gap: 'space/2', w: 280 })
      const group = await groupFrame(await box({ name: 'Input group' }), 'rest', { w: 280 })
      padInline(group, 'space/2-5', 'space/1')
      const shown = content === 'shown'
      add(group, await text(shown ? 'correct-horse-9' : '••••••••••••', 'UI/base/Regular', 'role/fg', { name: 'Value', w: 'fill' }), await groupKey(icons, shown ? 'eye-off' : 'eye'))
      add(c, group)
      group.layoutSizingHorizontal = 'FILL'
      if (content !== 'strength') return
      const bars = await box({ name: 'Segments', dir: 'row', gap: 'space/1', w: 'fill' })
      for (let i = 0; i < 4; i++) {
        const seg = rect(i < 3 ? 'Segment on' : 'Segment', 40, 4, i < 3 ? 'role/success' : 'role/well', 'radius/full')
        add(bars, seg)
        seg.layoutGrow = 1
      }
      const word = await text('Good', 'UI/sm/Medium', 'role/success-text', { name: 'Strength', w: 64, align: 'RIGHT' })
      add(c, await box({ name: 'Strength', dir: 'row', gap: 'space/3', align: 'center', w: 'fill' }, bars, ref(word, 'Strength')))
    },
  })),
  properties: [{ name: 'Strength', type: 'TEXT', default: 'Good', field: 'characters' }],
  columns: 'Content',
  gap: [40, 16],
})

/* ── PhoneInput ─────────────────────────────────────────────────────────── */

const phoneInputSpec: Spec = ({ icons }) => ({
  key: 'component:phone-input',
  name: 'Phone input',
  description:
    'PhoneInput in packages/ui: an InputGroup whose start is a country Select (the flag and a chevron, part of the well, hovering on its own), then a hairline, the dialling code and the national number, formatted as you type. Returns E.164. The country list is Select’s popup.',
  variants: (['rest', 'focus', 'invalid', 'disabled'] as const).map((state) => ({
    props: { State: state },
    build: async (c: ComponentNode) => {
      await groupFrame(c, state, { w: 280 })
      c.clipsContent = true
      padInline(c, 'space/0', 'space/2-5')
      const country = await box({ name: 'Country', dir: 'row', gap: 'space/1', align: 'center' })
      padInline(country, 'space/2-5', 'space/1-5')
      add(country, await text('🇬🇧', 'Body/base', 'role/fg', { name: 'Flag' }), icon(icons, 'chevron-down', 14, 'role/fg-muted'))
      add(c, country)
      country.layoutSizingVertical = 'FILL'
      add(
        c,
        rect('Divider', 1, 16, 'role/line'),
        ref(figure(await text('+44', 'UI/base/Regular', 'role/fg', { name: 'Dial code' }), 400), 'Dial code'),
        ref(figure(await text('7700 900123', 'UI/base/Regular', 'role/fg', { name: 'Number', w: 'fill' }), 400), 'Number'),
      )
    },
  })),
  properties: [
    { name: 'Dial code', type: 'TEXT', default: '+44', field: 'characters' },
    { name: 'Number', type: 'TEXT', default: '7700 900123', field: 'characters' },
  ],
  columns: 'State',
})

/* ── Rating ─────────────────────────────────────────────────────────────── */

/** rating.tsx's star: ten points around (12, 12.5) in a 24 box. */
const STAR = 'M12 2.7 L14.73 8.74 L21.32 9.47 L16.42 13.94 L17.76 20.43 L12 17.15 L6.24 20.43 L7.58 13.94 L2.68 9.47 L9.27 8.74 Z'
const starAt = (px: number, offset: number) => STAR.replace(/(-?[\d.]+) (-?[\d.]+)/g, (_, x: string, y: string) => `${Math.round((Number(x) * px) / 24 * 100 + offset * 100) / 100} ${Math.round((Number(y) * px) / 24 * 100 + offset * 100) / 100}`)

const RATING = {
  sm: { key: 'space/6', px: 24, icon: 14, radius: 'radius/sm', gap: 'space/0-5' },
  default: { key: 'space/7', px: 28, icon: 16, radius: 'radius/md', gap: 'space/1' },
  lg: { key: 'space/8', px: 32, icon: 20, radius: 'radius/md', gap: 'space/1-5' },
} as const

/** One key: empty (a raised key with the star's outline), full (one plane of the accent with the star solid in its ink), or half. */
async function ratingKey(size: keyof typeof RATING, share: number) {
  const s = RATING[size]
  const key = await box({ name: 'Key', dir: 'none', w: s.px, h: s.px, radius: s.radius, fill: 'role/key', stroke: 'role/line-control', effect: 'Shadow/xs', clip: true })
  const off = (s.px - s.icon) / 2
  vector(key, starAt(s.icon, off), { stroke: solid('role/fg-subtle'), strokeWidth: 1.5 }, 'Star')
  if (share > 0) {
    const fill = await box({ name: 'Fill', dir: 'none', w: Math.round(s.px * share), h: s.px, fill: 'role/accent', clip: true })
    add(key, fill)
    fill.x = 0
    fill.y = 0
    vector(fill, starAt(s.icon, off), { fill: solid('role/on-accent'), stroke: solid('role/on-accent'), strokeWidth: 1.5 }, 'Star')
  }
  return key
}

const ratingSpec: Spec = () => ({
  key: 'component:rating',
  name: 'Rating',
  description:
    'Rating in packages/ui: a row of keys (24, 28 or 32 square). An empty key is raised with the star’s outline; a filled one is one plane of the accent with the star solid in its ink, and a half value fills half a key. In code the fill sweeps from key to key, the hovered key lifts, and a glint bursts on the chosen one.',
  variants: (['default', 'sm', 'lg'] as const).map((size) => ({
    props: { Size: size },
    build: async (c: ComponentNode) => {
      await style(c, { dir: 'row', gap: RATING[size].gap, align: 'center' })
      for (let i = 0; i < 5; i++) add(c, await ratingKey(size, Math.max(0, Math.min(1, 3.5 - i))))
    },
  })),
  properties: [],
  columns: 'Size',
  gap: [40, 16],
})

/* ── ChoiceCard ─────────────────────────────────────────────────────────── */

const choiceCardSpec: Spec = ({ icons, get }) => {
  const variants: VariantSpec[] = []
  for (const control of ['radio', 'checkbox'] as const)
    for (const checked of ['true', 'false'] as const)
      variants.push({
        props: { Control: control, Checked: checked },
        build: async (c) => {
          const on = checked === 'true'
          // A FieldLabel holding a Field: radius/lg on a hairline, p-3; checked doubles its edge in the accent.
          await style(c, { dir: 'row', gap: 'space/3', align: 'start', pad: 12, w: 320, radius: 'radius/lg', stroke: on ? 'role/accent' : 'role/line', strokeWidth: on ? 2 : 1 })
          for (const side of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] as const) c.setBoundVariable(side, scaleVar('space/3'))
          const input = control === 'radio' ? instance(get, 'radio', { Checked: checked, State: 'rest' }) : instance(get, 'checkbox', { Checked: checked, State: 'rest' })
          const show = Object.keys(input.componentProperties).find((k) => k.split('#')[0] === 'Show label')
          if (show) input.setProperties({ [show]: false })
          const tile = await box({ name: 'Tile', dir: 'row', align: 'center', justify: 'center', w: 32, h: 32, radius: 'radius/md', fill: 'role/band', stroke: 'role/line-subtle' }, icon(icons, ['zap', 'rocket', 'star'], 16, 'role/fg-muted'))
          const words = await box(
            { name: 'Content', dir: 'col', gap: 'space/1', w: 'fill' },
            ref(await text('Pro', 'UI/base/Medium', 'role/fg', { name: 'Title', w: 'fill' }), 'Title'),
            ref(await text('Unlimited projects and previews.', 'UI/sm/Regular', 'role/fg-muted', { name: 'Description', w: 'fill' }), 'Description'),
          )
          const note = await text('$12/mo', 'UI/sm/Regular', 'role/fg-muted', { name: 'Note' })
          add(c, await box({ name: 'Control', dir: 'row', h: 20, align: 'center' }, input), tile, words, ref(figure(note, 400), 'Note'))
        },
      })
  return {
    key: 'component:choice-card',
    name: 'Choice card',
    description:
      'ChoiceCard in packages/ui: a whole card as one option, the kit’s own Radio, Checkbox or Switch inside it (ChoiceCardGroup picks the control). A hairline card (radius/lg, p-3) with an optional icon tile, a title, a description and a note at the end; checked, its edge doubles in the accent. vertical stacks the tile and control over the text.',
    variants,
    properties: [
      { name: 'Title', type: 'TEXT', default: 'Pro', field: 'characters' },
      { name: 'Description', type: 'TEXT', default: 'Unlimited projects and previews.', field: 'characters' },
      { name: 'Note', type: 'TEXT', default: '$12/mo', field: 'characters' },
    ],
    columns: 'Checked',
    gap: [40, 16],
  }
}

/* ── Form ───────────────────────────────────────────────────────────────── */

const formSpec: Spec = ({ get }) => ({
  key: 'component:form',
  name: 'Form',
  description:
    'Form in packages/ui: react-hook-form wired to the kit’s Field. Each FormField is a Field (label, control, description, message); FormSubmit is an AsyncButton that validates first, then runs onSubmit through pending, success or error. Invalid, each field shows its message and its control the destructive edge, and the submit says “Check the form”.',
  variants: (['default', 'invalid'] as const).map((state) => ({
    props: { State: state },
    build: async (c: ComponentNode) => {
      await style(c, { dir: 'col', gap: 'space/5', w: 320 })
      const name = instance(get, 'field', { State: state })
      const email = instance(get, 'field', { State: 'default' })
      for (const [f, label, description] of [
        [name, 'Project name', 'Lowercase letters, numbers and dashes.'],
        [email, 'Owner email', 'We send deploy alerts here.'],
      ] as const) {
        const set = (prop: string, value: string) => {
          const key = Object.keys(f.componentProperties).find((k) => k.split('#')[0] === prop)
          if (key) f.setProperties({ [key]: value })
        }
        set('Label', label)
        set('Description', description)
        const input = f.findOne((n) => n.type === 'INSTANCE') as InstanceNode | null
        const value = input && Object.keys(input.componentProperties).find((k) => k.split('#')[0] === 'Value')
        if (input && value) input.setProperties({ [value]: f === name ? 'youj-docs' : 'lena@youj.dev' })
        add(c, f)
        f.layoutSizingHorizontal = 'FILL'
        f.isExposedInstance = true
      }
      const submit = instance(get, 'async-button', { Size: 'default', State: state === 'invalid' ? 'error' : 'idle' })
      const key = Object.keys(submit.componentProperties).find((k) => k.split('#')[0] === (state === 'invalid' ? 'Error label' : 'Label'))
      if (key) submit.setProperties({ [key]: state === 'invalid' ? 'Check the form' : 'Create project' })
      add(c, await box({ name: 'Actions', dir: 'row', justify: 'end', w: 'fill' }, submit))
    },
  })),
  properties: [],
  columns: 'State',
  gap: [48, 16],
})

/* ── SlideToConfirm ─────────────────────────────────────────────────────── */

type SlideState = 'idle' | 'confirming' | 'confirmed' | 'error'
const SLIDE_LABEL: Record<SlideState, string> = { idle: 'Slide to deploy', confirming: 'Working…', confirmed: 'Confirmed', error: 'Failed' }

async function drawSlide(c: ComponentNode, size: 'sm' | 'default' | 'lg', tone: 'default' | 'danger', state: SlideState, icons: Deps['icons']) {
  const bz = bezel()
  await style(c, { dir: 'row', align: 'center', w: 256, radius: 'bezel/pill', fill: state === 'confirmed' ? 'role/success' : 'role/well', stroke: state === 'confirmed' ? clear() : 'role/line', clip: true })
  for (const side of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] as const) c.setBoundVariable(side, scaleVar('space/1'))
  // The thumb is the track's height less its padding: control-lg, +8 for default, +16 for lg.
  const thumb = await box({
    name: 'Thumb',
    dir: 'row',
    align: 'center',
    justify: 'center',
    pad: size === 'sm' ? 0 : size === 'default' ? 4 : 8,
    radius: 'bezel/pill',
    fill: state === 'confirmed' ? 'role/key' : tone === 'danger' ? 'role/danger' : bz ? 'role/fg' : 'role/action',
    effect: 'Shadow/xs',
  })
  const ink = state === 'confirmed' ? 'role/success' : tone === 'danger' ? 'role/on-accent' : bz ? 'role/canvas' : 'role/on-action'
  const mark = { idle: 'chevron-right', confirming: 'loader-ring', confirmed: 'check', error: 'x' }[state]
  const glyph = await box({ name: 'Mark', dir: 'row', align: 'center', justify: 'center' }, icon(icons, mark, size === 'lg' ? 20 : size === 'sm' ? 16 : 18, ink))
  controlSquare(glyph, 'control/lg')
  add(thumb, glyph)
  const labelInk = state === 'error' ? 'role/danger-text' : state === 'confirmed' ? 'role/on-accent' : 'role/fg-muted'
  const label = await box({ name: 'Label', dir: 'row', align: 'center', justify: 'center', w: 'fill', pad: [0, 12] }, ref(await text(SLIDE_LABEL[state], size === 'lg' ? 'UI/lg/Medium' : 'UI/base/Medium', labelInk, { name: 'Label', truncate: true }), state === 'idle' ? 'Label' : `${state[0]!.toUpperCase()}${state.slice(1)} label`))
  const area = await box({ name: 'Area', dir: 'row', align: 'center', w: 'fill', radius: 'bezel/pill', fill: state === 'confirming' ? (tone === 'danger' ? 'role/danger-subtle' : 'role/accent-subtle') : undefined })
  // At rest the label sits clear of the thumb at the start; working or done, the thumb has reached the end.
  if (state === 'confirming' || state === 'confirmed') add(area, label, thumb)
  else add(area, thumb, label)
  add(c, area)
  label.layoutSizingVertical = 'FILL'
}

const slideToConfirmSpec: Spec = ({ icons }) => {
  const variants: VariantSpec[] = []
  for (const tone of ['default', 'danger'] as const)
    for (const state of ['idle', 'confirming', 'confirmed', 'error'] as const) variants.push({ props: { Size: 'default', Tone: tone, State: state }, build: (c) => drawSlide(c, 'default', tone, state, icons) })
  for (const size of ['sm', 'lg'] as const) variants.push({ props: { Size: size, Tone: 'default', State: 'idle' }, build: (c) => drawSlide(c, size, 'default', 'idle', icons) })
  return {
    key: 'component:slide-to-confirm',
    name: 'Slide to confirm',
    description:
      'SlideToConfirm in packages/ui: a deliberate action, a thumb dragged (or keyed) to the end of a recessed track. The track tints behind the thumb as it goes; at the end the work runs (a spinner), then the whole track turns success with a check, or the label turns danger and the thumb returns. Its height is the large control’s plus 8 (sm: none, lg: 16). In code the thumb springs back if let go early.',
    variants,
    properties: [
      { name: 'Label', type: 'TEXT', default: SLIDE_LABEL.idle, field: 'characters' },
      { name: 'Confirming label', type: 'TEXT', default: SLIDE_LABEL.confirming, field: 'characters' },
      { name: 'Confirmed label', type: 'TEXT', default: SLIDE_LABEL.confirmed, field: 'characters' },
      { name: 'Error label', type: 'TEXT', default: SLIDE_LABEL.error, field: 'characters' },
    ],
    columns: 'State',
    gap: [32, 16],
  }
}

export const ENTRIES: Entry[] = [
  {
    doc: {
      key: 'component:native-select',
      title: 'Native select',
      usage: '<NativeSelect size="sm"><NativeSelectOption value="pro">Pro plan</NativeSelectOption></NativeSelect>',
      tokens: 'Field well role/field (Classic: role/line-control edge)  ·  Focus role/focus with Focus/field  ·  Invalid role/danger  ·  Height control/sm, default, lg  ·  Chevron role/fg-muted, 16  ·  Radius bezel/field-radius',
      file: 'packages/ui/src/components/ui/native-select.tsx',
    },
    spec: (deps) => nativeSelectSpec(deps),
  },
  {
    doc: {
      key: 'component:button-group',
      title: 'Button group',
      usage: '<ButtonGroup><Button variant="outline">Archive</Button><Button variant="outline">Report</Button></ButtonGroup>',
      tokens: 'Outline buttons role/line, joined: inner corners square, shared borders  ·  Text addon role/band, role/line, UI/base/Medium role/fg-muted  ·  Height control/default',
      file: 'packages/ui/src/components/ui/button-group.tsx',
    },
    spec: buttonGroupSpec,
  },
  {
    doc: {
      key: 'component:segmented-control',
      title: 'Segmented control',
      usage: '<SegmentedControl variant="pill" defaultValue="week"><SegmentedControlItem value="day">Day</SegmentedControlItem>…</SegmentedControl>',
      tokens: 'Underline: role/line hairline, chosen role/fg over a 2px role/accent bar  ·  Pill: track role/well, 3px in (Classic 2px), key role/key with Bezel/key at bezel/key-radius  ·  Labels UI/base/Medium role/fg-muted  ·  Height control/*',
      file: 'packages/ui/src/components/ui/segmented-control.tsx',
    },
    spec: segmentedControlSpec,
  },
  {
    doc: {
      key: 'component:capsule-toggle',
      title: 'Capsule toggle',
      usage: '<CapsuleToggle label="View" options={[{ value: "list", label: "List" }, …]} defaultValue="list" />',
      tokens: 'Capsule bezel/capsule on a role/fg 8% ring with Shadow/sm, radius bezel/pill (Classic role/chrome-float, role/line, radius/2xl)  ·  Inset space/1  ·  Label Bezel/Eyebrow  ·  Key role/key with Bezel/key',
      file: 'packages/ui/src/components/ui/capsule-toggle.tsx',
    },
    spec: capsuleToggleSpec,
  },
  {
    doc: {
      key: 'component:theme-toggle',
      title: 'Theme toggle',
      usage: '<ThemeToggle />  ·  <ThemeToggle variant="segmented" />',
      tokens: 'Button: ghost icon button, role/fg-muted, control/default square  ·  Segmented: role/line hairline, chosen icon role/fg over a 2px role/accent bar',
      file: 'packages/ui/src/components/ui/theme-toggle.tsx',
    },
    spec: themeToggleSpec,
  },
  {
    doc: {
      key: 'component:async-button',
      title: 'Async button',
      usage: '<AsyncButton onAction={publish} successLabel="Published">Publish</AsyncButton>',
      tokens: 'Button’s variants and sizes  ·  Pending: a 16px spinner  ·  Success role/success, error role/danger, label and mark role/on-accent',
      file: 'packages/ui/src/components/ui/async-button.tsx',
    },
    spec: asyncButtonSpec,
  },
  {
    doc: {
      key: 'component:inline-confirm',
      title: 'Inline confirm',
      usage: '<InlineConfirm destructive onConfirm={remove}>Delete</InlineConfirm>',
      tokens: 'Trigger: an outline Button  ·  Open: outline icon cancel and a default (danger) icon confirm, 6px apart',
      file: 'packages/ui/src/components/ui/inline-confirm.tsx',
    },
    spec: inlineConfirmSpec,
  },
  {
    doc: {
      key: 'component:input-group',
      title: 'Input group',
      usage: '<InputGroup><InputGroupAddon><SearchIcon /></InputGroupAddon><InputGroupInput placeholder="Search issues…" /></InputGroup>',
      tokens: 'The field look (role/field well, Classic role/line-control)  ·  Focus role/focus with Focus/field  ·  Addons role/fg-muted, 16 icons  ·  Buttons control/xs ghost keys  ·  Block addons: bezel/field-area-radius',
      file: 'packages/ui/src/components/ui/input-group.tsx',
    },
    spec: inputGroupSpec,
  },
  {
    doc: {
      key: 'component:input-otp',
      title: 'Input OTP',
      usage: '<InputOTP length={6} groups={[3, 3]} onComplete={verify} />',
      tokens: 'Slots control/lg square in the field look, bezel/field-radius  ·  Active: role/focus frame with Focus/field, caret role/fg  ·  Digits 16 medium  ·  Dash role/fg-subtle  ·  Success role/success, error role/danger',
      file: 'packages/ui/src/components/ui/input-otp.tsx',
    },
    spec: inputOtpSpec,
  },
  {
    doc: {
      key: 'component:number-input',
      title: 'Number input',
      usage: '<NumberInput defaultValue={1250} step={50} min={0} />',
      tokens: 'InputGroup’s field  ·  Figures tabular (Bezel: mono)  ·  Steppers control/xs ghost keys, role/fg-muted',
      file: 'packages/ui/src/components/ui/number-input.tsx',
    },
    spec: numberInputSpec,
  },
  {
    doc: {
      key: 'component:password-input',
      title: 'Password input',
      usage: '<PasswordInput />  ·  <PasswordStrength value={password} />',
      tokens: 'InputGroup’s field with a control/xs eye key  ·  Strength: four 4px segments, off role/well, on role/danger · warning · success  ·  Word UI/sm/Medium in the *-text ink',
      file: 'packages/ui/src/components/ui/password-input.tsx',
    },
    spec: passwordInputSpec,
  },
  {
    doc: {
      key: 'component:phone-input',
      title: 'Phone input',
      usage: '<PhoneInput defaultCountry="GB" onValueChange={(e164) => …} />',
      tokens: 'InputGroup’s field  ·  Country trigger part of the well (hover role/hover), flag and a 14 chevron  ·  Hairline role/line, 16 high  ·  Dial code and number tabular (Bezel: mono)',
      file: 'packages/ui/src/components/ui/phone-input.tsx',
    },
    spec: phoneInputSpec,
  },
  {
    doc: {
      key: 'component:rating',
      title: 'Rating',
      usage: '<Rating defaultValue={3.5} allowHalf size="lg" />',
      tokens: 'Keys 24 · 28 · 32 square (space/6–8), radius/sm–md  ·  Empty role/key on role/line-control with Shadow/xs, star role/fg-subtle  ·  Filled role/accent, star role/on-accent  ·  Gap space/0-5–1-5',
      file: 'packages/ui/src/components/ui/rating.tsx',
    },
    spec: ratingSpec,
  },
  {
    doc: {
      key: 'component:choice-card',
      title: 'Choice card',
      usage: '<ChoiceCardGroup defaultValue="pro"><ChoiceCard value="pro" title="Pro" description="…" note="$12/mo" icon={<ZapIcon />} /></ChoiceCardGroup>',
      tokens: 'Card role/line, radius/lg, padding space/3  ·  Checked a 2px role/accent edge  ·  Tile 32, role/band on role/line-subtle  ·  Title UI/base/Medium, description UI/sm role/fg-muted  ·  Control: the kit’s Radio or Checkbox',
      file: 'packages/ui/src/components/ui/choice-card.tsx',
    },
    spec: choiceCardSpec,
  },
  {
    doc: {
      key: 'component:form',
      title: 'Form',
      usage: '<Form form={form} onSubmit={create}><FormField name="name" label="Project name" render={…} /><FormSubmit>Create project</FormSubmit></Form>',
      tokens: 'Fields: the kit’s Field, space/5 apart  ·  Submit: an Async button, error “Check the form”',
      file: 'packages/ui/src/components/ui/form.tsx',
    },
    spec: formSpec,
  },
  {
    doc: {
      key: 'component:slide-to-confirm',
      title: 'Slide to confirm',
      usage: '<SlideToConfirm label="Slide to deploy" onConfirm={deploy} tone="danger" />',
      tokens: 'Track role/well on a role/line ring, radius bezel/pill, padding space/1  ·  Thumb control/lg (+8, +16), role/fg (Classic role/action) with Shadow/xs  ·  Trail role/accent-subtle  ·  Confirmed role/success, label role/on-accent  ·  Error label role/danger-text',
      file: 'packages/ui/src/components/ui/slide-to-confirm.tsx',
    },
    spec: slideToConfirmSpec,
  },
]
