import { useContext, useMemo, type CSSProperties } from 'react'
import type { MotionPersonality } from './tokens'
import { themeProps } from './theme/contract'
import type { ColorScheme } from './mode'
import type { YoujLook } from './look'
import type { YoujDensity, YoujScaling } from './settings'
import type { Device } from './device'
import type { Direction } from './direction'
import { YoujContext, type ReducedMotionSetting, type YoujSettings } from './provider-context'

/** `data-yj-scaling`'s value for a step: its number, `'90%'` → `'90'`. */
export const scalingAttribute = (scaling: YoujScaling) => scaling.slice(0, -1)

/* The CSS side of the contract. `--yj-time-scale` scales every --yj-duration-*;
 * `--yj-motion` is 1 with motion and 0 when reduced ('user' defers to the OS
 * value youj.css keeps in --yj-os-motion). Custom properties inherit, so the
 * nearest provider wins. `data-yj-reduced` marks subtrees forced to reduced
 * motion; it doesn't depend on the OS, so server and client render it alike.
 * A theme adds `data-yj-theme` (a scope marker, so the derived tokens are
 * recomputed there), its contract variables and `data-yj-motion`; a scale,
 * `data-yj-scaling`; a colour mode, `data-theme`; a layout density, `data-yj-density`; a forced device,
 * `data-yj-device`. */
export interface YoujScopeProps {
  'data-yj-scope': ''
  'data-yj-reduced'?: ''
  'data-yj-theme'?: string
  'data-yj-palette'?: string
  'data-yj-style'?: string
  'data-yj-motion'?: MotionPersonality
  'data-yj-look'?: YoujLook
  'data-yj-scaling'?: string
  'data-theme'?: ColorScheme
  'data-yj-density'?: YoujDensity
  'data-yj-device'?: Device
  dir?: Direction
  style: CSSProperties
}

const MOTION_FACTOR: Record<ReducedMotionSetting, number | string> = { always: 0, never: 1, user: 'var(--yj-os-motion)' }

/** Which settings scopeProps writes; each one is written unless set to `false`. */
export interface ScopeParts {
  theme?: boolean
  look?: boolean
  scaling?: boolean
  mode?: boolean
  density?: boolean
  device?: boolean
  dir?: boolean
}

export function scopeProps(
  { timeScale, reducedMotion, theme, personality, look, scaling, scheme, density, device, dir }: YoujSettings,
  parts: ScopeParts = {},
): YoujScopeProps {
  const { theme: withTheme = true, look: withLook = true, scaling: withScaling = true, mode: withMode = true, density: withDensity = true, device: withDevice = true, dir: withDir = true } = parts
  const themed = withTheme && theme ? themeProps(theme) : null
  return {
    'data-yj-scope': '',
    'data-yj-reduced': reducedMotion === 'always' ? '' : undefined,
    ...(themed ? { 'data-yj-theme': themed['data-yj-theme'] } : {}),
    ...(themed?.['data-yj-palette'] ? { 'data-yj-palette': themed['data-yj-palette'] } : {}),
    ...(themed?.['data-yj-style'] ? { 'data-yj-style': themed['data-yj-style'] } : {}),
    ...(withTheme && personality ? { 'data-yj-motion': personality } : {}),
    ...(withLook && look ? { 'data-yj-look': look } : {}),
    ...(withScaling && scaling ? { 'data-yj-scaling': scalingAttribute(scaling) } : {}),
    ...(withMode && scheme ? { 'data-theme': scheme } : {}),
    ...(withDensity && density ? { 'data-yj-density': density } : {}),
    ...(withDevice && device && device !== 'auto' ? { 'data-yj-device': device } : {}),
    ...(withDir && dir ? { dir } : {}),
    style: { '--yj-time-scale': timeScale, '--yj-motion': MOTION_FACTOR[reducedMotion], ...themed?.style } as CSSProperties,
  }
}

/**
 * The nearest provider's CSS hooks as props, for elements rendered outside its
 * DOM subtree. Portaled overlays need them to follow Speed, reduced motion,
 * the theme, the look, the scale, the density, the device and the direction: `<Popover.Portal {...useYoujScope()}>`.
 */
export function useYoujScope(): YoujScopeProps {
  const settings = useContext(YoujContext)
  return useMemo(() => scopeProps(settings), [settings])
}
