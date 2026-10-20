import { add, bezel, box, context, rect, solid, style, text, type Ink } from '../draw'
import { bezelFieldLook } from './bezel'
import type { IconBuild } from '../icons'
import { iconInstance } from './button'
import { setLabel } from './panels'
import { instanceOf, ref, type SetSpec, type VariantSpec } from './set'

/* The form controls beyond the first seven: Textarea, Select's trigger,
 * Radio and RadioGroup, Field, Toggle and ToggleGroup, Slider and Progress.
 * Each is drawn from its file in packages/ui/src/components/ui; values are
 * the code's props verbatim. The field border, hover, focus halo and invalid
 * edge come from fieldControlClass, as Input's do. */

export const SOURCES = [
  {
    file: 'packages/ui/src/components/ui/textarea.tsx',
    classes: ['fieldControlClass,', "'field-sizing-content block rounded-field-area min-h-18 max-h-64 resize-y px-2.5 py-1.5 leading-5'"],
  },
  {
    file: 'packages/ui/src/components/ui/select.tsx',
    classes: [
      'fieldControlClass,',
      "'flex w-fit cursor-default items-center justify-between gap-2 whitespace-nowrap select-none'",
      "'data-[size=default]:h-control data-[size=default]:ps-2.5 data-[size=default]:pe-2'",
      "'data-[size=sm]:h-control-sm data-[size=sm]:rounded-field-sm data-[size=sm]:ps-2 data-[size=sm]:pe-1.5'",
      "'data-placeholder:text-fg-muted data-popup-open:border-focus'",
      'className="flex text-fg-muted"',
      '<YoujChevron size={16}',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/radio-group.tsx',
    classes: [
      "cn('grid w-full gap-2.5', className)",
      "'peer group/radio relative inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-line-control bg-transparent'",
      "'hover:border-fg-muted focus-ring'",
      "'data-checked:border-accent data-checked:bg-accent data-checked:yj-solid-hover'",
      "'aria-invalid:not-data-checked:border-danger data-invalid:not-data-checked:border-danger'",
      "'data-disabled:cursor-not-allowed data-disabled:opacity-50 data-disabled:active:scale-100'",
      "'size-1.5 rounded-full bg-on-accent'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/label.tsx',
    classes: ["'flex items-center gap-1.5 text-ui leading-5 font-medium text-fg select-none'", 'className="-ms-0.5 text-fg-muted"'],
  },
  {
    file: 'packages/ui/src/components/ui/field.tsx',
    classes: [
      "cva('group/field flex w-full gap-[calc(var(--spacing)*(2_-_0.5*var(--ui--compact,0)))]'",
      "vertical: 'flex-col *:w-full [&>.sr-only]:w-auto'",
      "'text-ui-sm leading-normal text-fg-muted group-data-[orientation=horizontal]/field:text-balance'",
      "'text-ui-sm font-medium text-danger'",
      "const errorGapClass = '[[data-slot=field]>*>&]:pt-2",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/toggle.variants.ts',
    classes: [
      "'group/toggle relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-button font-medium whitespace-nowrap select-none'",
      "'text-fg-muted transition-[color,background-color,border-color,box-shadow,scale] yj-duration-fast ease-standard'",
      "'hover:bg-hover hover:text-fg focus-ring'",
      "'data-pressed:bg-selected data-pressed:hover:bg-selected data-pressed:text-fg'",
      "'data-disabled:pointer-events-none data-disabled:opacity-50'",
      "outline: 'border border-line bg-transparent shadow-xs'",
      "default: 'h-control min-w-control px-2 text-ui'",
      "sm: \"h-control-sm min-w-control-sm rounded-button-sm px-1.5 text-ui [&_svg:not([class*='size-'])]:size-3.5\"",
      "lg: 'h-control-lg min-w-control-lg rounded-button-lg px-2.5 text-ui-lg'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/toggle-group.tsx',
    classes: [
      "spacing = variant === 'segmented' || variant === 'pill' ? 0 : 1",
      "'group/toggle-group flex w-fit items-center gap-[--spacing(var(--gap))] rounded-button'",
      "'rounded-choice bg-well [--ui--choice-inset:2px] p-(--ui--choice-inset)'",
      "const raisedKeyClass = 'bg-key shadow-sm-soft inset-ring-(length:--yj-stroke-width) inset-ring-(--ui--key-edge)'",
      "'group-data-[orientation=horizontal]/toggle-group:h-full group-data-[orientation=horizontal]/toggle-group:min-h-0 flex-1 rounded-choice-key hover:bg-transparent hover:text-fg data-pressed:text-fg'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/slider.tsx',
    classes: [
      "'relative flex w-full touch-none items-center py-2 select-none touch:py-3'",
      "'rounded-full bg-well data-[orientation=horizontal]:h-1 data-[orientation=horizontal]:w-full",
      "liquid ? 'overflow-hidden' : ruler ? 'hidden' : 'bg-(--slider-tone)'",
      "'relative isolate block shrink-0 rounded-full select-none focus-ring-within data-disabled:pointer-events-none'",
      "liquid ? 'size-6' : ruler ? 'h-6 w-1.5' : 'size-4'",
      "'before:absolute before:-inset-1.5 before:rounded-full before:bg-(--slider-halo)'",
      "'border-2 border-(--slider-tone) bg-key shadow-sm-soft'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/progress.tsx',
    classes: [
      "cn('relative h-1.5 w-full overflow-hidden rounded-full bg-well', className)",
      "'absolute inset-y-0 start-0 rounded-full bg-accent origin-left rtl:not-data-indeterminate:origin-right'",
      "cn('text-ui font-medium text-fg', className)",
      "cn('ms-auto text-ui-sm text-fg-muted tabular-nums', className)",
    ],
  },
]

const scaleVar = (name: string) => context().vars.get('scale', name)
const themeVar = (name: string) => context().vars.get('theme', name)
const clear = (): SolidPaint => ({ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 0 })

/** Binds a frame's inline padding to a spacing token (start, end). */
function padInline(c: FrameNode | ComponentNode, start: string, end = start) {
  c.setBoundVariable('paddingLeft', scaleVar(start))
  c.setBoundVariable('paddingRight', scaleVar(end))
}

/** Fixes a frame's height to a control-height token. */
function controlHeight(c: FrameNode | ComponentNode, token: string) {
  c.layoutSizingVertical = 'FIXED'
  c.setBoundVariable('height', themeVar(token))
}

/** The instance-swap property for an icon, with a few likely picks offered first. */
function iconProperty(icons: Map<string, IconBuild>, fallback: IconBuild, picks: string[]) {
  const preferred = picks
    .map((n) => icons.get(n))
    .filter((b): b is IconBuild => !!b)
    .map((b) => ({ type: b.node.type === 'COMPONENT_SET' ? ('COMPONENT_SET' as const) : ('COMPONENT' as const), key: b.node.key }))
  return { name: 'Icon', type: 'INSTANCE_SWAP' as const, default: fallback.rest.id, preferred, field: 'mainComponent' as const }
}

const pick = (icons: Map<string, IconBuild>, ...names: string[]) => names.map((n) => icons.get(n)).find(Boolean) ?? [...icons.values()][0]!

/* ── Field controls: Textarea and Select ─────────────────────────────────── */

const FIELD_STATES = ['rest', 'hover', 'focus', 'invalid', 'disabled'] as const
type FieldState = (typeof FIELD_STATES)[number]

/** fieldControlClass: the border by state, the muted fill and 50% when disabled, the Focus/field halo. */
function fieldLook(state: FieldState | 'open', area = false) {
  if (bezel()) return bezelFieldLook(state, area)
  return {
    radius: area ? 'bezel/field-area-radius' : 'bezel/field-radius',
    stroke: (state === 'hover' ? 'role/fg-subtle' : state === 'focus' || state === 'open' ? 'role/focus' : state === 'invalid' ? 'role/danger' : 'role/line-control') as Ink,
    fill: state === 'disabled' ? ('role/band' as Ink) : undefined,
    effect: state === 'focus' ? 'Focus/field' : undefined,
    opacity: state === 'disabled' ? 0.5 : undefined,
  }
}

async function drawTextarea(c: ComponentNode, state: FieldState, content: 'placeholder' | 'value') {
  await style(c, { dir: 'col', pad: [6, 10], w: 320, h: 72, ...fieldLook(state, true) })
  c.strokesIncludedInLayout = true
  padInline(c, bezel() ? 'space/3' : 'space/2-5')
  c.setBoundVariable('paddingTop', scaleVar(bezel() ? 'space/2' : 'space/1-5'))
  c.setBoundVariable('paddingBottom', scaleVar(bezel() ? 'space/2' : 'space/1-5'))
  const chars = content === 'placeholder' ? 'Tell us what happened…' : 'The deploy stalled at “Collecting build traces” and never finished.'
  const t = await text(chars, 'UI/base/Regular', content === 'placeholder' ? 'role/fg-muted' : 'role/fg', { name: content === 'placeholder' ? 'Placeholder' : 'Value', w: 'fill' })
  add(c, ref(t, content === 'placeholder' ? 'Placeholder' : 'Value'))
}

export function textareaSpec(): SetSpec {
  const variants: VariantSpec[] = []
  for (const state of FIELD_STATES)
    for (const content of ['placeholder', 'value'] as const) variants.push({ props: { State: state, Content: content }, build: (c) => drawTextarea(c, state, content) })
  return {
    key: 'component:textarea',
    name: 'Textarea',
    description:
      'Textarea in packages/ui: Input’s field control (border, hover, Focus/field halo, invalid edge) at 72px tall. In code it grows with its content (field-sizing) up to 256px, then scrolls; resize the instance’s height.',
    variants,
    properties: [
      { name: 'Placeholder', type: 'TEXT', default: 'Tell us what happened…', field: 'characters' },
      { name: 'Value', type: 'TEXT', default: 'The deploy stalled at “Collecting build traces” and never finished.', field: 'characters' },
    ],
    columns: 'Content',
  }
}

const SELECT_STATES = ['rest', 'hover', 'focus', 'open', 'invalid', 'disabled'] as const
type SelectState = (typeof SELECT_STATES)[number]

async function drawSelectTrigger(c: ComponentNode, size: 'default' | 'sm', state: SelectState, content: 'placeholder' | 'value', chevron: ComponentNode) {
  await style(c, { dir: 'row', gap: 'space/2', align: 'center', justify: 'between', w: 180, ...fieldLook(state) })
  c.strokesIncludedInLayout = true
  if (size === 'default') {
    padInline(c, bezel() ? 'space/3' : 'space/2-5', 'space/2')
    controlHeight(c, 'control/default')
  } else {
    padInline(c, 'space/2', 'space/1-5')
    controlHeight(c, 'control/sm')
  }
  const placeholder = content === 'placeholder'
  const t = await text(placeholder ? 'Select a region' : 'Frankfurt (eu-central-1)', 'UI/base/Regular', placeholder ? 'role/fg-muted' : 'role/fg', {
    name: placeholder ? 'Placeholder' : 'Value',
    w: 'fill',
    truncate: true,
  })
  add(c, ref(t, placeholder ? 'Placeholder' : 'Value'), iconInstance(chevron, 16, 'role/fg-muted'))
}

export function selectSpec(icons: Map<string, IconBuild>): SetSpec {
  const chevron = pick(icons, 'chevron-down').rest
  const variants: VariantSpec[] = []
  for (const size of ['default', 'sm'] as const)
    for (const content of ['placeholder', 'value'] as const)
      for (const state of SELECT_STATES) variants.push({ props: { Content: content, Size: size, State: state }, build: (c) => drawSelectTrigger(c, size, state, content, chevron) })
  return {
    key: 'component:select',
    name: 'Select/Trigger',
    description:
      'SelectTrigger in packages/ui: Input’s field control with the value and a chevron. Open turns the border to the ring; the popup is Dropdown menu’s surface. In code the chevron flips on open and the list pops from the trigger on the snappy spring.',
    variants,
    properties: [
      { name: 'Placeholder', type: 'TEXT', default: 'Select a region', field: 'characters' },
      { name: 'Value', type: 'TEXT', default: 'Frankfurt (eu-central-1)', field: 'characters' },
    ],
    // Six states of a 180px trigger don't fit across the sheet: Content across, Size and State down.
    columns: 'Content',
  }
}

/* ── Radio and RadioGroup ────────────────────────────────────────────────── */

const RADIO_STATES = ['rest', 'hover', 'focus', 'invalid', 'disabled'] as const
type RadioState = (typeof RADIO_STATES)[number]

async function drawRadio(c: ComponentNode, checked: boolean, state: RadioState) {
  await style(c, { dir: 'row', gap: 'space/2', align: 'center', opacity: state === 'disabled' ? 0.5 : undefined })
  const edge: Ink = checked ? 'role/accent' : state === 'invalid' ? 'role/danger' : state === 'hover' ? 'role/fg-muted' : 'role/line-control'
  const ring = figma.createFrame()
  const px = bezel() ? 18 : 16
  await style(ring, {
    name: 'Radio',
    dir: 'row',
    align: 'center',
    justify: 'center',
    w: px,
    h: px,
    radius: 'radius/full',
    // Bezel: 18px, in a filled well at rest.
    fill: checked ? (state === 'hover' ? ['role/accent', 0.9] : 'role/accent') : bezel() ? 'role/well' : undefined,
    stroke: edge,
    effect: state === 'focus' ? 'Focus/ring' : undefined,
  })
  if (checked) add(ring, rect('Dot', 6, 6, 'role/on-accent', 'radius/full'))
  add(c, ring, ref(await text('Starter', 'UI/base/Regular', 'role/fg', { name: 'Label' }), 'Label', 'Show label'))
}

export function radioSpec(): SetSpec {
  const variants: VariantSpec[] = []
  for (const checked of [false, true])
    for (const state of RADIO_STATES) {
      // The invalid edge only shows unchecked (aria-invalid:not-data-checked).
      if (checked && state === 'invalid') continue
      variants.push({ props: { Checked: String(checked), State: state }, build: (c) => drawRadio(c, checked, state) })
    }
  return {
    key: 'component:radio',
    name: 'Radio',
    description:
      'RadioGroupItem in packages/ui: a 16px ring with a 24px hit area. Checked fills with the primary and shows a 6px dot. In code the dot grows in on the enter curve while the previous one shrinks out, both on the fast token.',
    variants,
    properties: [
      { name: 'Label', type: 'TEXT', default: 'Starter', field: 'characters' },
      { name: 'Show label', type: 'BOOLEAN', default: true, field: 'visible' },
    ],
    columns: 'State',
  }
}

export function radioGroupSpec(radio: ComponentSetNode): SetSpec {
  const labels = ['Starter', 'Pro', 'Enterprise']
  return {
    key: 'component:radio-group',
    name: 'Radio group',
    description: 'RadioGroup in packages/ui: items 10px apart (gap-2.5), arrow keys moving the selection. The items are exposed instances: edit their labels and checked state from here.',
    variants: (['default', 'invalid', 'disabled'] as const).map((state) => ({
      props: { State: state },
      build: async (c: ComponentNode) => {
        await style(c, { dir: 'col', gap: 'space/2-5' })
        labels.forEach((label, i) => {
          const checked = state !== 'invalid' && i === 0
          const item = instanceOf(radio, { Checked: String(checked), State: state === 'default' ? 'rest' : state })
          add(c, item)
          setLabel(item, label)
          item.isExposedInstance = true
        })
      },
    })),
    properties: [],
    columns: 'State',
    gap: [48, 16],
  }
}

/* ── Field ──────────────────────────────────────────────────────────────── */

export function fieldSpec(input: ComponentSetNode): SetSpec {
  return {
    key: 'component:field',
    name: 'Field',
    description:
      'Field in packages/ui, vertical: FieldLabel, the control, FieldDescription and FieldError, 8px apart, with the error 8px further down. Invalid shows the error and the control’s destructive edge; disabled dims the label and the control. The Input inside is an exposed instance.',
    variants: (['default', 'invalid', 'disabled'] as const).map((state) => ({
      props: { State: state },
      build: async (c: ComponentNode) => {
        await style(c, { dir: 'col', gap: 'space/2', w: 280 })
        // Bezel sets a vertical field's label as the mono capital eyebrow.
        const label = await text('Project name', bezel() ? 'Bezel/Eyebrow' : 'UI/base/Medium', bezel() ? 'role/fg-muted' : 'role/fg', { name: 'Label' })
        if (state === 'disabled') label.opacity = 0.5
        const control = instanceOf(input, { State: state === 'default' ? 'rest' : state, Content: 'value' })
        add(c, ref(label, 'Label'), control)
        control.isExposedInstance = true
        control.layoutSizingHorizontal = 'FILL'
        add(c, ref(await text('Lowercase letters, numbers and dashes.', 'UI/sm/Regular', 'role/fg-muted', { name: 'Description', w: 'fill' }), 'Description', 'Show description'))
        if (state === 'invalid') {
          const error = figma.createFrame()
          await style(error, { name: 'Error', dir: 'col', pad: [8, 0, 0, 0], w: 'fill' })
          error.setBoundVariable('paddingTop', scaleVar('space/2'))
          add(error, ref(await text('That name is taken in this workspace.', 'UI/sm/Medium', 'role/danger', { name: 'Message', w: 'fill' }), 'Error'))
          add(c, error)
        }
      },
    })),
    properties: [
      { name: 'Label', type: 'TEXT', default: 'Project name', field: 'characters' },
      { name: 'Description', type: 'TEXT', default: 'Lowercase letters, numbers and dashes.', field: 'characters' },
      { name: 'Show description', type: 'BOOLEAN', default: true, field: 'visible' },
      { name: 'Error', type: 'TEXT', default: 'That name is taken in this workspace.', field: 'characters' },
    ],
    columns: 'State',
    gap: [40, 16],
  }
}

/* ── Toggle and ToggleGroup ──────────────────────────────────────────────── */

const TOGGLE_STATES = ['rest', 'hover', 'pressed', 'focus', 'disabled'] as const
type ToggleState = (typeof TOGGLE_STATES)[number]

const TOGGLE_SIZE = {
  default: { height: 'control/default', px: 'space/2', text: 'UI/base/Medium', icon: 16 },
  sm: { height: 'control/sm', px: 'space/1-5', text: 'UI/base/Medium', icon: 14 },
  lg: { height: 'control/lg', px: 'space/2-5', text: 'UI/lg/Medium', icon: 16 },
} as const

async function drawToggle(c: ComponentNode, variant: 'default' | 'outline', size: keyof typeof TOGGLE_SIZE, state: ToggleState, icon: ComponentNode) {
  const s = TOGGLE_SIZE[size]
  const on = state === 'hover' || state === 'pressed'
  const ink = on ? 'role/fg' : 'role/fg-muted'
  await style(c, {
    dir: 'row',
    gap: 'space/1-5',
    align: 'center',
    justify: 'center',
    radius: 'bezel/pill',
    fill: state === 'hover' ? 'role/hover' : state === 'pressed' ? ['role/fg', 0.1] : undefined,
    effect: state === 'focus' ? 'Focus/ring' : variant === 'outline' ? 'Shadow/xs' : undefined,
    opacity: state === 'disabled' ? 0.5 : undefined,
  })
  c.strokes = [variant === 'outline' ? solid('role/line') : clear()]
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'
  c.strokesIncludedInLayout = true
  padInline(c, s.px)
  controlHeight(c, s.height)
  // min-w-control: an icon-only toggle is square.
  c.setBoundVariable('minWidth', themeVar(s.height))
  const i = iconInstance(icon, s.icon, ink)
  add(c, ref(i, 'Icon'), ref(await text('Bold', s.text, ink, { name: 'Label' }), 'Label', 'Show label'))
}

export function toggleSpec(icons: Map<string, IconBuild>): SetSpec {
  const bold = pick(icons, 'bold')
  const variants: VariantSpec[] = []
  const columns = ['rest', 'hover', 'pressed', 'focus', 'disabled'] as const
  for (const variant of ['default', 'outline'] as const)
    for (const size of ['default', 'sm', 'lg'] as const)
      for (const state of columns) variants.push({ props: { Variant: variant, Size: size, State: state }, build: (c) => drawToggle(c, variant, size, state, bold.rest) })
  return {
    key: 'component:toggle',
    name: 'Toggle',
    description:
      'Toggle in packages/ui: a two-state key (aria-pressed). Pressed is a neutral foreground/10 key with full-strength text; the accent stays for actions. Hide the label for an icon-only, square toggle. In code the press scales to 0.97 on the instant token.',
    variants,
    properties: [
      { name: 'Label', type: 'TEXT', default: 'Bold', field: 'characters' },
      { name: 'Show label', type: 'BOOLEAN', default: true, field: 'visible' },
      iconProperty(icons, bold, ['bold', 'italic', 'underline', 'check', 'star']),
    ],
    columns: 'State',
  }
}

export function toggleGroupSpec(toggle: ComponentSetNode, icons: Map<string, IconBuild>): SetSpec {
  const labels = ['Bold', 'Italic', 'Underline']
  const glyphs = ['bold', 'italic', 'underline'].map((n) => icons.get(n)?.rest)
  return {
    key: 'component:toggle-group',
    name: 'Toggle group',
    description:
      'ToggleGroup in packages/ui. default and outline space Toggles 4px apart (spacing 1); segmented joins them on a muted track, the pressed one a raised key. In code the key slides between items on the smooth spring. Items are exposed instances.',
    variants: (['default', 'outline', 'segmented'] as const).map((variant) => ({
      props: { Variant: variant },
      build: async (c: ComponentNode) => {
        if (variant !== 'segmented') {
          await style(c, { dir: 'row', gap: 'space/1', align: 'center', radius: 'bezel/pill' })
          labels.forEach((label, i) => {
            const item = instanceOf(toggle, { Variant: variant, Size: 'default', State: i === 0 ? 'pressed' : 'rest' })
            add(c, item)
            setLabel(item, label)
            const glyph = glyphs[i]
            const swap = Object.keys(item.componentProperties).find((k) => k.split('#')[0] === 'Icon')
            if (glyph && swap) item.setProperties({ [swap]: glyph.id })
            item.isExposedInstance = true
          })
          return
        }
        // A recessed track at the theme's choice corner (Bezel 3px in, keys 2px apart; Classic 2px in) with the choice as a raised key at the concentric corner.
        const bz = bezel()
        await style(c, { dir: 'row', gap: bz ? 2 : 'space/0-5', pad: bz ? 3 : 2, align: 'center', radius: 'bezel/pill', fill: bz ? 'role/well' : 'role/band' })
        controlHeight(c, 'control/default')
        for (const [i, label] of labels.entries()) {
          const item = figma.createFrame()
          const on = i === 0
          await style(item, {
            name: `Item ${i + 1}`,
            dir: 'row',
            align: 'center',
            justify: 'center',
            radius: 'bezel/key-radius',
            fill: on ? (bz ? 'role/key' : 'role/overlay') : undefined,
            effect: on ? (bz ? 'Bezel/key' : 'Shadow/sm') : undefined,
            // Classic's key sits on its edge, 3:1 against the track in light (ui.css --ui--key-edge).
            stroke: on && !bz ? 'ui/key-edge' : undefined,
          })
          padInline(item, bz ? 'space/3' : 'space/2-5')
          add(item, ref(await text(label, 'UI/base/Medium', on ? (bz ? 'role/fg' : 'role/fg') : 'role/fg-muted', { name: 'Label' }), `Item ${i + 1}`))
          add(c, item)
          item.layoutSizingVertical = 'FILL'
        }
      },
    })),
    properties: labels.map((label, i) => ({ name: `Item ${i + 1}`, type: 'TEXT' as const, default: label, field: 'characters' as const })),
    columns: 'Variant',
    gap: [48, 16],
  }
}

/* ── Slider and Progress ─────────────────────────────────────────────────── */

const SLIDER_W = 240

async function drawSlider(c: ComponentNode, state: 'rest' | 'hover' | 'focus' | 'disabled', value: number) {
  await style(c, { dir: 'none', w: SLIDER_W, h: 32, opacity: state === 'disabled' ? 0.5 : undefined })
  const x = Math.round((SLIDER_W - 16) * value) + 8
  const bz = bezel()
  // Bezel: a 4px recessed rail with a hairline inner edge.
  const rail = 4
  const track = rect('Track', SLIDER_W, rail, bz ? 'role/well' : ['role/fg', 0.12], 'radius/full')
  if (bz) {
    track.strokes = [solid('bezel/rail-edge')]
    track.strokeWeight = 1
    track.strokeAlign = 'INSIDE'
  }
  const range = rect('Range', x, rail, 'role/accent', 'radius/full')
  add(c, track, range)
  track.y = 16 - rail / 2
  range.y = 16 - rail / 2
  if (state === 'hover' || state === 'focus') {
    const halo = rect('Halo', 28, 28, 'role/accent-subtle', 'radius/full')
    add(c, halo)
    halo.x = x - 14
    halo.y = 2
  }
  // Bezel: an ink knob ringed 3px in the page colour, like a knob on a fader.
  const thumb = rect('Thumb', 16, 16, bz ? 'role/fg' : 'role/canvas', 'radius/full')
  thumb.strokes = [solid(bz ? 'role/canvas' : 'role/accent')]
  thumb.strokeWeight = bz ? 3 : 2
  thumb.strokeAlign = 'INSIDE'
  await thumb.setEffectStyleIdAsync(context().styles.effect(state === 'focus' ? 'Focus/ring' : 'Shadow/sm').id)
  add(c, thumb)
  thumb.x = x - 8
  thumb.y = 8
  if (bz && state !== 'focus') {
    // The knob's hairline ring, outside its page-coloured edge.
    const ring = rect('Ring', 18, 18, null, 'radius/full')
    ring.strokes = [solid('bezel/knob-ring')]
    ring.strokeWeight = 1
    ring.strokeAlign = 'INSIDE'
    add(c, ring)
    ring.x = x - 9
    ring.y = 7
  }
}

export function sliderSpec(): SetSpec {
  const variants: VariantSpec[] = []
  for (const state of ['rest', 'hover', 'focus', 'disabled'] as const) variants.push({ props: { State: state }, build: (c) => drawSlider(c, state, 0.4) })
  return {
    key: 'component:slider',
    name: 'Slider',
    description:
      'Slider in packages/ui: a 4px track at foreground/12, the range in the primary, a 16px thumb with a 2px primary ring. Hover and focus bloom a primary/18 halo on the fast token (the halo stays put under reduced motion). Move the Range and Thumb to set the value.',
    variants,
    properties: [],
    columns: 'State',
    gap: [32, 16],
  }
}

const PROGRESS_W = 280

async function drawProgress(c: ComponentNode, value: number) {
  const bz = bezel()
  await style(c, { dir: 'col', gap: 'space/2', w: PROGRESS_W })
  const head = figma.createFrame()
  await style(head, { name: 'Header', dir: 'row', gap: 'space/3', align: 'center', w: 'fill' })
  add(
    head,
    // Bezel: the label a mono capital eyebrow, the value in mono at full ink.
    ref(await text('Uploading assets', bz ? 'Bezel/Eyebrow' : 'UI/base/Medium', bz ? 'role/fg-muted' : 'role/fg', { name: 'Label' }), 'Label'),
    await box({ name: 'Spacer', w: 'fill', h: 1 }),
    await text(`${value}%`, bz ? 'Mono/sm' : 'UI/sm/Regular', bz ? 'role/fg' : 'role/fg-muted', { name: 'Value' }),
  )
  // Bezel: a 4px recessed rail with a neutral ink fill (tone="accent" spends the accent).
  const h = bz ? 4 : 6
  const track = figma.createFrame()
  await style(track, { name: 'Track', dir: 'none', w: PROGRESS_W, h, radius: 'radius/full', fill: bz ? 'role/well' : ['role/fg', 0.1], clip: true })
  if (value > 0) add(track, rect('Indicator', Math.max(h, Math.round((PROGRESS_W * value) / 100)), h, bz ? 'bezel/meter' : 'role/accent', 'radius/full'))
  add(c, ref(head, 'Show label'), track)
}

export function progressSpec(): SetSpec {
  return {
    key: 'component:progress',
    name: 'Progress',
    description:
      'Progress in packages/ui: a 6px foreground/10 track with the value in the primary, and ProgressLabel and ProgressValue above. In code the indicator eases to each new value; indeterminate sweeps (striped and still under reduced motion).',
    variants: [0, 25, 60, 100].map((value) => ({ props: { Value: String(value) }, build: (c: ComponentNode) => drawProgress(c, value) })),
    properties: [
      { name: 'Label', type: 'TEXT', default: 'Uploading assets', field: 'characters' },
      { name: 'Show label', type: 'BOOLEAN', default: true, field: 'visible' },
    ],
    columns: 'Value',
    gap: [32, 16],
  }
}
