import type { Kit, KitTextStyle } from '../kit'
import type { Fonts } from './fonts'
import { keyOf, tag } from './store'
import type { Vars } from './variables'

/* Text and effect styles. Text styles bind their size and line height to
 * the Scale variables, so the type scale is one set of numbers; effect styles
 * bind each shadow layer's colour to a Color variable, so elevation follows
 * the theme and the mode like everything else. */

export interface Styles {
  text(name: string): TextStyle
  effect(name: string): EffectStyle
  /** The kit's spec for a text style (font role, weight, size). */
  spec(name: string): KitTextStyle
  summary: string[]
  warnings: string[]
}

const textKey = (name: string) => `style:text:${name}`
const effectKey = (name: string) => `style:effect:${name}`

export async function buildStyles(kit: Kit, fonts: Fonts, vars: Vars): Promise<Styles> {
  const warnings: string[] = []
  const textStyles = await figma.getLocalTextStylesAsync()
  const effectStyles = await figma.getLocalEffectStylesAsync()
  const text = new Map<string, TextStyle>()
  const effect = new Map<string, EffectStyle>()
  let bindFailed = false

  for (const spec of kit.text) {
    const key = textKey(spec.name)
    let style = textStyles.find((s) => keyOf(s) === key)
    if (!style) {
      style = figma.createTextStyle()
      tag(style, key)
    }
    style.name = spec.name
    style.fontName = fonts.font(spec.family, spec.weight)
    style.fontSize = spec.size
    style.lineHeight = { unit: 'PIXELS', value: spec.lineHeight }
    style.letterSpacing = { unit: 'PERCENT', value: spec.tracking }
    style.textCase = spec.upper ? 'UPPER' : 'ORIGINAL'
    style.description = `${spec.classes} · ${spec.size}/${spec.lineHeight}${spec.tracking ? ` · tracking ${spec.tracking}%` : ''}`
    try {
      style.setBoundVariable('fontSize', vars.get('scale', `text/${spec.token}`))
      style.setBoundVariable('lineHeight', vars.get('scale', `leading/${spec.token}`))
    } catch {
      bindFailed = true
    }
    text.set(spec.name, style)
  }
  if (bindFailed) warnings.push('This Figma version could not bind text style sizes to variables; the styles keep plain numbers.')

  for (const spec of kit.effects) {
    const key = effectKey(spec.name)
    let style = effectStyles.find((s) => keyOf(s) === key)
    if (!style) {
      style = figma.createEffectStyle()
      tag(style, key)
    }
    style.name = spec.name
    style.description = `${spec.css} · ${spec.description}`
    style.effects = spec.layers.map((layer) => {
      const base: DropShadowEffect | InnerShadowEffect = {
        type: layer.inset ? 'INNER_SHADOW' : 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.1 },
        offset: { x: layer.x, y: layer.y },
        radius: layer.blur,
        spread: layer.spread,
        visible: true,
        blendMode: 'NORMAL',
        ...(layer.inset ? {} : { showShadowBehindNode: false }),
      } as DropShadowEffect | InnerShadowEffect
      let bound = figma.variables.setBoundVariableForEffect(base, 'color', vars.get('color', layer.color))
      if (layer.offset) {
        const offset = vars.get('theme', layer.offset)
        bound = figma.variables.setBoundVariableForEffect(bound, 'offsetX', offset)
        bound = figma.variables.setBoundVariableForEffect(bound, 'offsetY', offset)
      }
      return bound
    })
    effect.set(spec.name, style)
  }

  // Styles removed from the code go too (only the kit's own).
  let removed = 0
  for (const s of textStyles) {
    if (keyOf(s).startsWith('style:text:') && !text.has(keyOf(s).slice('style:text:'.length))) {
      s.remove()
      removed++
    }
  }
  for (const s of effectStyles) {
    if (keyOf(s).startsWith('style:effect:') && !effect.has(keyOf(s).slice('style:effect:'.length))) {
      s.remove()
      removed++
    }
  }

  const need = <T>(map: Map<string, T>, name: string, kind: string) => {
    const v = map.get(name)
    if (!v) throw new Error(`No ${kind} style ${name}`)
    return v
  }
  return {
    text: (name) => need(text, name, 'text'),
    effect: (name) => need(effect, name, 'effect'),
    spec: (name) => kit.text.find((t) => t.name === name) ?? need(new Map<string, KitTextStyle>(), name, 'text'),
    summary: [`${text.size} text styles, ${effect.size} effect styles${removed ? `, ${removed} removed` : ''}`],
    warnings,
  }
}
