export type ShadowType = 'drop' | 'inner'
export type StrokePosition = 'inside' | 'outside' | 'center'
export type BlurType = 'uniform' | 'progressive'
export type EffectId = 'shadow' | 'stroke' | 'fill' | 'blur'

/** Every effect shares these: the checkbox, the eye and whether the panel is in the stack at all. */
interface Layer {
  /** The checkbox: off keeps the settings but applies nothing. */
  enabled: boolean
  /** The eye: hidden keeps the settings and the panel but shows nothing. */
  visible: boolean
  /** Removed effects leave the stack and come back through Add effect. */
  present: boolean
}

export interface EffectsValue {
  shadow: Layer & { type: ShadowType; x: number; y: number; blur: number; spread: number; color: string; opacity: number }
  stroke: Layer & { color: string; opacity: number; position: StrokePosition; weight: number }
  fill: Layer & { color: string; opacity: number }
  blur: Layer & { type: BlurType; radius: number; start: number; end: number }
}

export const DEFAULT_EFFECTS: EffectsValue = {
  shadow: { enabled: true, visible: true, present: true, type: 'drop', x: 0, y: 8, blur: 24, spread: -2, color: '#4c6fff', opacity: 55 }, // youj-allow: demo values the user edits
  stroke: { enabled: true, visible: true, present: true, color: '#ffffff', opacity: 28, position: 'inside', weight: 1 }, // youj-allow: demo values the user edits
  fill: { enabled: true, visible: true, present: true, color: '#4c6fff', opacity: 100 }, // youj-allow: demo values the user edits
  blur: { enabled: false, visible: true, present: true, type: 'uniform', radius: 4, start: 30, end: 100 },
}

export const EFFECT_IDS: readonly EffectId[] = ['shadow', 'stroke', 'fill', 'blur']

export const DEFAULT_COPY = {
  title: 'Effects',
  description: 'Shadow, stroke, fill and blur for one layer. The button beside it is built from exactly these values.',
  add: 'Add effect',
  noneToAdd: 'Every effect is in use',
  preview: 'Preview',
  button: 'Button',
  css: 'CSS',
  noStyles: 'No styles applied',
  shadow: 'Shadow',
  shadowTypes: { drop: 'Drop shadow', inner: 'Inner shadow' } as Record<ShadowType, string>,
  stroke: 'Stroke',
  fill: 'Fill',
  blur: 'Layer blur',
  position: 'Position',
  x: 'X',
  y: 'Y',
  shadowBlur: 'Blur',
  spread: 'Spread',
  color: 'Color',
  strokePosition: 'Position',
  strokePositions: { inside: 'Inside', outside: 'Outside', center: 'Center' } as Record<StrokePosition, string>,
  weight: 'Weight',
  blurType: 'Type',
  blurTypes: { uniform: 'Uniform', progressive: 'Progressive' } as Record<BlurType, string>,
  amount: 'Amount',
  range: 'Range',
  start: 'Start',
  end: 'End',
}
export type EffectsInspectorCopy = typeof DEFAULT_COPY

const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
/** `#rrggbb` and 0–100 as a CSS color. */
export const rgba = (hex: string, opacity: number) => `rgb(${channel(hex, 0)} ${channel(hex, 1)} ${channel(hex, 2)} / ${opacity / 100})` // youj-allow: formats the color the user picked

/** The preview button's styles, and the CSS text they print as. Nothing is emitted for an effect that is off, hidden or removed. */
export function effectsToCss(value: EffectsValue) {
  const on = (l: Layer) => l.present && l.enabled && l.visible
  const { shadow, stroke, fill, blur } = value
  const shadows: string[] = []
  if (on(stroke)) {
    const c = rgba(stroke.color, stroke.opacity) // youj-allow: formats the color the user picked
    if (stroke.position === 'inside') shadows.push(`inset 0 0 0 ${stroke.weight}px ${c}`)
    else if (stroke.position === 'outside') shadows.push(`0 0 0 ${stroke.weight}px ${c}`)
    else shadows.push(`inset 0 0 0 ${stroke.weight / 2}px ${c}`, `0 0 0 ${stroke.weight / 2}px ${c}`)
  }
  if (on(shadow)) shadows.push(`${shadow.type === 'inner' ? 'inset ' : ''}${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.spread}px ${rgba(shadow.color, shadow.opacity)}`) // youj-allow: formats the color the user picked
  const css: Record<string, string> = {}
  if (on(fill)) css.background = rgba(fill.color, fill.opacity) // youj-allow: formats the color the user picked
  if (shadows.length) css['box-shadow'] = shadows.join(', ')
  const blurred = on(blur) && blur.radius > 0
  if (blurred) css.filter = `blur(${blur.radius}px)`
  if (blurred && blur.type === 'progressive') css['mask-image'] = progressiveMask(blur.start, blur.end)
  return { css, blurred: blurred ? blur : null }
}

/** A mask that is clear until `start` and solid from `end`, top to bottom (flipped for the sharp copy). */
export const progressiveMask = (start: number, end: number, flip = false) => {
  const [a, b] = start <= end ? [start, end] : [end, start]
  const [from, to] = flip ? ['black', 'transparent'] : ['transparent', 'black']
  return `linear-gradient(to bottom, ${from} ${a}%, ${to} ${b}%)`
}
