import { add, bezel, context, solid, style, text, vector, type Ink } from '../draw'
import { bezelFieldLook } from './bezel'
import { ref, type SetSpec, type VariantSpec } from './set'

/* Input, Badge, Checkbox and Switch: the small controls, each from its file
 * in packages/ui/src/components/ui. Values are the code's props verbatim. */

export const SOURCES = [
  {
    file: 'packages/ui/src/components/ui/input.tsx',
    classes: [
      'w-full min-w-0 rounded-field border border-(--ui--field-line) bg-(--ui--field-fill) text-ui text-fg',
      'placeholder:text-fg-muted hover:border-(--ui--field-line-hover) hover:bg-(--ui--field-fill-hover)',
      'aria-invalid:border-danger',
      'disabled:cursor-not-allowed disabled:bg-band disabled:opacity-50',
      "'h-control px-2.5",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/badge.variants.ts',
    classes: [
      'group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-chip border border-transparent',
      'text-ui-sm font-medium whitespace-nowrap',
      "default: 'h-5 px-2'",
      "default: 'bg-accent-subtle text-accent-text",
      "solid: 'bg-accent text-on-accent",
      "secondary: 'bg-hover text-fg-muted",
      "outline: 'border-line text-fg-muted",
      "success: 'bg-success-subtle text-success-text",
      "warning: 'bg-warning-subtle text-warning-text",
      "danger: 'bg-danger-subtle text-danger-text",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/checkbox.tsx',
    classes: [
      'relative inline-flex size-4 shrink-0 items-center justify-center rounded-sm border border-line-control bg-transparent text-on-accent',
      'data-checked:border-accent data-indeterminate:border-accent',
      'hover:border-fg-muted focus-ring',
      'rounded-[inherit] bg-accent',
      'group-hover/checkbox:yj-solid-shade',
      "const CHECK = 'M4 12.5 L9 17.5 L20 6.5'",
      "const DASH = 'M6.5 12 L12 12 L17.5 12'",
      'width={14} height={14}',
      'strokeWidth={3}',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/switch.tsx',
    classes: [
      'peer group/switch relative inline-flex shrink-0 items-center rounded-full bg-fg-subtle p-0.5',
      'focus-ring data-checked:bg-accent',
      'data-[size=default]:h-4.5 data-[size=default]:w-8 data-[size=sm]:h-3.5 data-[size=sm]:w-6',
      'pointer-events-none block rounded-full bg-key shadow-xs-soft inset-ring-(length:--yj-stroke-width) inset-ring-(--ui--fill-edge)',
      'group-data-[size=default]/switch:size-3.5 group-data-[size=sm]/switch:size-2.5',
    ],
  },
]

/* ── Input ─────────────────────────────────────────────────────────────── */

const INPUT_STATES = ['rest', 'hover', 'focus', 'invalid', 'disabled'] as const

export async function drawInput(c: ComponentNode | FrameNode, state: (typeof INPUT_STATES)[number], content: 'placeholder' | 'value', chars: string, withRefs: boolean) {
  const border = state === 'hover' ? 'role/fg-subtle' : state === 'focus' ? 'role/focus' : state === 'invalid' ? 'role/danger' : 'role/line-control'
  const classic = {
    radius: 'bezel/field-radius',
    fill: state === 'disabled' ? 'role/band' : undefined,
    stroke: border,
    effect: state === 'focus' ? 'Focus/field' : undefined,
    opacity: state === 'disabled' ? 0.5 : undefined,
  }
  await style(c, { dir: 'row', align: 'center', pad: [0, 10], w: 240, ...(bezel() ? bezelFieldLook(state) : classic) })
  c.strokesIncludedInLayout = true
  const px = bezel() ? 'space/3' : 'space/2-5'
  c.setBoundVariable('paddingLeft', context().vars.get('scale', px))
  c.setBoundVariable('paddingRight', context().vars.get('scale', px))
  c.layoutSizingVertical = 'FIXED'
  c.setBoundVariable('height', context().vars.get('theme', 'control/default'))
  const t = await text(chars, 'UI/base/Regular', content === 'placeholder' ? 'role/fg-muted' : 'role/fg', { name: content === 'placeholder' ? 'Placeholder' : 'Value', w: 'fill', truncate: true })
  add(c, withRefs ? ref(t, content === 'placeholder' ? 'Placeholder' : 'Value') : t)
}

export function inputSpec(): SetSpec {
  const variants: VariantSpec[] = []
  for (const state of INPUT_STATES)
    for (const content of ['placeholder', 'value'] as const) {
      variants.push({
        props: { State: state, Content: content },
        build: (c) => drawInput(c, state, content, content === 'placeholder' ? 'Search projects…' : 'youj', true),
      })
    }
  return {
    key: 'component:input',
    name: 'Input',
    description:
      'Input in packages/ui (fieldControlClass, shared with Textarea and the Select trigger). The border is the field border (3:1 on every surface); focus turns it ring inside a 3px halo (Focus/field). Full width in code: resize the instance.',
    variants,
    properties: [
      { name: 'Placeholder', type: 'TEXT', default: 'Search projects…', field: 'characters' },
      { name: 'Value', type: 'TEXT', default: 'youj', field: 'characters' },
    ],
    columns: 'Content',
  }
}

/* ── Badge ─────────────────────────────────────────────────────────────── */

export const BADGE_LOOKS: Record<string, { fill?: Ink; text: string; border?: string }> = {
  default: { fill: 'role/accent-subtle', text: 'role/accent-text' },
  solid: { fill: 'role/accent', text: 'role/on-accent' },
  secondary: { fill: 'role/hover', text: 'role/fg-muted' },
  outline: { text: 'role/fg-muted', border: 'role/line' },
  success: { fill: 'role/success-subtle', text: 'role/success-text' },
  warning: { fill: 'role/warning-subtle', text: 'role/warning-text' },
  danger: { fill: 'role/danger-subtle', text: 'role/danger-text' },
  neutral: { fill: 'role/band', text: 'role/fg-muted' },
}

/** Bezel (bezel.css): soft tinted pills, 22px, a raised neutral chip for secondary, a stronger edge for outline, and a status dot. */
export const BEZEL_BADGE_LOOKS: Record<string, { fill?: Ink; text: string; border?: string }> = {
  ...BADGE_LOOKS,
  default: { fill: 'role/accent-subtle', text: 'role/accent-text' },
  secondary: { fill: 'role/control', text: 'role/fg-muted' },
  outline: { text: 'role/fg-muted', border: 'role/line-strong' },
  success: { fill: 'role/success-subtle', text: 'role/success-text' },
  warning: { fill: 'role/warning-subtle', text: 'role/warning-text' },
  danger: { fill: 'role/danger-subtle', text: 'role/danger-text' },
}

export async function drawBadge(c: ComponentNode | FrameNode, variant: string, chars: string, withRefs: boolean) {
  const bz = bezel()
  const look = (bz ? BEZEL_BADGE_LOOKS : BADGE_LOOKS)[variant]!
  await style(c, { dir: 'row', align: 'center', justify: 'center', gap: bz ? 6 : 'space/1', pad: [0, 8], radius: 'bezel/badge-radius', fill: look.fill, h: bz ? 22 : 20 })
  c.strokes = [look.border ? solid(look.border) : { type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 0 }]
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'
  c.strokesIncludedInLayout = true
  if (bz) {
    // spacing × 2.25: 9px, between the spacing tokens.
    c.setBoundVariable('paddingLeft', null)
    c.setBoundVariable('paddingRight', null)
    c.paddingLeft = 9
    c.paddingRight = 9
    const dot = figma.createEllipse()
    dot.name = 'Dot'
    dot.resize(6, 6)
    dot.fills = [solid(look.text)]
    add(c, withRefs ? ref(dot, 'Dot') : dot)
    dot.visible = !withRefs
  } else {
    c.setBoundVariable('paddingLeft', context().vars.get('scale', 'space/2'))
    c.setBoundVariable('paddingRight', context().vars.get('scale', 'space/2'))
  }
  const t = await text(chars, 'UI/sm/Medium', look.text, { name: 'Label' })
  add(c, withRefs ? ref(t, 'Label') : t)
}

export function badgeSpec(): SetSpec {
  return {
    key: 'component:badge',
    name: 'Badge',
    description:
      'Badge in packages/ui. Soft by default: a 10% tint with the colour’s ink as text (the colour with a fifth of fg mixed back in), AA on the tint in both modes. Only solid spends the accent at full strength.',
    variants: Object.keys(BADGE_LOOKS).map((variant) => ({ props: { Variant: variant }, build: (c) => drawBadge(c, variant, 'Badge', true) })),
    // Bezel's dot is a [data-slot=badge-dot] first inside the badge: a property to show it.
    properties: [{ name: 'Label', type: 'TEXT', default: 'Badge', field: 'characters' }, ...(bezel() ? [{ name: 'Dot', type: 'BOOLEAN' as const, default: false, field: 'visible' as const }] : [])],
    columns: 'Variant',
    gap: [16, 16],
  }
}

/* ── Checkbox ──────────────────────────────────────────────────────────── */

const CHECK_STATES = ['rest', 'hover', 'focus', 'disabled'] as const

/** The check and the dash (one 3-vertex path in code) at 14px with a 3-unit stroke, as the code draws them at rest. */
function glyph(parent: FrameNode, checked: 'true' | 'indeterminate', ink: string, inset = 1) {
  const s = 14 / 24
  const scaled = (d: string) => d.replace(/-?\d+(\.\d+)?/g, (n) => String(Math.round(Number(n) * s * 1000) / 1000))
  const d = checked === 'true' ? scaled('M 4 12.5 L 9 17.5 L 20 6.5') : scaled('M 6.5 12 L 12 12 L 17.5 12')
  const v = vector(parent, d, { stroke: solid(ink), strokeWidth: 3 * s }, checked === 'true' ? 'Check' : 'Dash')
  // The glyph's 14px box sits centred in the 16px (Bezel: 18px) box.
  v.x += inset
  v.y += inset
}

export async function drawCheckbox(c: ComponentNode | FrameNode, checked: 'false' | 'true' | 'indeterminate', state: (typeof CHECK_STATES)[number], chars: string, withRefs: boolean) {
  const on = checked !== 'false'
  await style(c, { dir: 'row', gap: 'space/2', align: 'center', opacity: state === 'disabled' ? 0.5 : undefined })
  const box = figma.createFrame()
  // Bezel: an 18px soft square (5px corner, square in a square theme) in a filled well at rest.
  const bz = bezel()
  const px = bz ? 18 : 16
  const square = context().kit.theme.find((n) => n.name === 'bezel/pill')?.values[context().vars.applied.theme] === 0
  await style(box, {
    name: 'Box',
    dir: 'none',
    w: px,
    h: px,
    radius: bz ? (square ? 0 : 5) : 'radius/sm',
    fill: on ? (state === 'hover' ? ['role/accent', 0.9] : 'role/accent') : bz ? 'role/well' : undefined,
    stroke: on ? 'role/accent' : state === 'hover' ? 'role/fg-muted' : 'role/line-control',
    effect: state === 'focus' ? 'Focus/ring' : undefined,
  })
  if (on) glyph(box, checked, 'role/on-accent', (px - 14) / 2)
  add(c, box)
  const t = await text(chars, 'UI/base/Regular', 'role/fg', { name: 'Label' })
  add(c, withRefs ? ref(t, 'Label', 'Show label') : t)
}

export function checkboxSpec(): SetSpec {
  const variants: VariantSpec[] = []
  for (const checked of ['false', 'true', 'indeterminate'] as const)
    for (const state of CHECK_STATES) variants.push({ props: { Checked: checked, State: state }, build: (c) => drawCheckbox(c, checked, state, 'Email me about releases', true) })
  return {
    key: 'component:checkbox',
    name: 'Checkbox',
    description:
      'Checkbox in packages/ui: a 16px box with a 24px hit area. In code the fill scales in on the snappy spring while the check draws itself and morphs to the indeterminate dash, and an untick fades on the instant token; the label comes from Field or Label.',
    variants,
    properties: [
      { name: 'Label', type: 'TEXT', default: 'Email me about releases', field: 'characters' },
      { name: 'Show label', type: 'BOOLEAN', default: true, field: 'visible' },
    ],
    columns: 'State',
  }
}

/* ── Switch ────────────────────────────────────────────────────────────── */

export async function drawSwitch(c: ComponentNode | FrameNode, checked: boolean, size: 'default' | 'sm', state: 'rest' | 'focus' | 'disabled', chars: string, withRefs: boolean) {
  // Bezel: flatter and wider, a flat knob with no lift: grey on a recessed track off, light on the accent on.
  const bz = bezel()
  const [w, h, thumb, pad] = bz ? (size === 'default' ? [40, 22, 16, 3] : [30, 18, 13, 2.5]) : size === 'default' ? [32, 18, 14, 2] : [24, 14, 10, 2]
  await style(c, { dir: 'row', gap: 'space/2', align: 'center', opacity: state === 'disabled' ? 0.5 : undefined })
  const track = figma.createFrame()
  await style(track, {
    name: 'Track',
    dir: 'row',
    align: 'center',
    justify: checked ? 'end' : 'start',
    pad,
    w,
    h,
    radius: 'radius/full',
    fill: checked ? 'role/accent' : bz ? 'role/well' : 'role/fg-subtle',
    stroke: bz && !checked ? 'bezel/edge' : undefined,
    effect: state === 'focus' ? 'Focus/ring' : undefined,
  })
  const knob = figma.createFrame()
  await style(knob, {
    name: 'Thumb',
    dir: 'none',
    w: thumb,
    h: thumb,
    radius: 'radius/full',
    fill: bz ? (checked ? 'bezel/knob-on' : 'role/fg-subtle') : 'role/canvas',
    effect: bz ? undefined : 'Shadow/xs',
  })
  add(track, knob)
  add(c, track)
  const t = await text(chars, 'UI/base/Regular', 'role/fg', { name: 'Label' })
  add(c, withRefs ? ref(t, 'Label', 'Show label') : t)
}

export function switchSpec(): SetSpec {
  const variants: VariantSpec[] = []
  for (const size of ['default', 'sm'] as const)
    for (const checked of [false, true])
      for (const state of ['rest', 'focus', 'disabled'] as const)
        variants.push({ props: { Size: size, Checked: String(checked), State: state }, build: (c) => drawSwitch(c, checked, size, state, 'Sync automatically', true) })
  return {
    key: 'component:switch',
    name: 'Switch',
    description:
      'Switch in packages/ui. Off: a page-coloured thumb on an fg-subtle track; on: the same thumb on the accent (both 3:1). In code the thumb travels exactly one thumb width on the snappy spring and retargets mid-flight; reduced motion jumps.',
    variants,
    properties: [
      { name: 'Label', type: 'TEXT', default: 'Sync automatically', field: 'characters' },
      { name: 'Show label', type: 'BOOLEAN', default: true, field: 'visible' },
    ],
    columns: 'State',
  }
}
