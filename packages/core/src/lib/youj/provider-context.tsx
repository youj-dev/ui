import { createContext, useMemo, type ReactNode } from 'react'
import type { MotionPersonality } from './tokens'
import type { ThemeInput } from './theme/contract'
import type { YoujLabels } from './labels-types'
import type { QualitySetting } from './budget'
import type { ColorMode, ColorScheme } from './mode'
import type { YoujLook } from './look'
import type { YoujDensity, YoujScaling } from './settings'
import type { DeviceSetting } from './device'
import type { Direction } from './direction'

export type ReducedMotionSetting = 'user' | 'always' | 'never'

export interface YoujSettings {
  /** Multiplies every duration. 2 = twice as slow. */
  timeScale: number
  reducedMotion: ReducedMotionSetting
  /** Theme fields set in JS by this provider and the scopes above it (not CSS-only themes). */
  theme: ThemeInput | null
  /** The motion personality, once known: from a JS theme or a data-yj-motion attribute. */
  personality: MotionPersonality | null
  quality: QualitySetting
  locale: string
  /** Built-in copy set by the enclosing providers, merged; use-labels.ts lays it over the English defaults. */
  labels: Partial<YoujLabels> | null
  /** The look set by this provider or a scope above it; null outside any provider or scope. */
  look: YoujLook | null
  /** The UI scale set by this provider or a scope above it; null when none sets one (100%). */
  scaling: YoujScaling | null
  /** The colour mode set by this provider or a scope above it; null when none sets one (the page's own, dark by default). */
  mode: ColorMode | null
  /** `mode` resolved (`system` read from the OS); null when no mode is set. */
  scheme: ColorScheme | null
  /** The layout density set by this provider or a scope above it; null when none sets one (roomy). */
  density: YoujDensity | null
  /** The device forced by this provider or a scope above it; null when none forces one (the hardware decides). */
  device: DeviceSetting | null
  /** Where this subtree's overlays render, when not document.body; null for the default. */
  portalContainer: HTMLElement | null
  /** The direction set by this provider or a scope above it, resolved; null when none sets one (the document's). */
  dir: Direction | null
}

/* The default locale is fixed, not the runtime's: a server and a browser
 * formatting numbers and dates with their own defaults render different text,
 * and hydration fails. */
const DEFAULT_LOCALE = 'en-US'

export const DEFAULTS: YoujSettings = {
  timeScale: 1,
  reducedMotion: 'user',
  theme: null,
  personality: null,
  quality: 'auto',
  locale: DEFAULT_LOCALE,
  labels: null,
  look: null,
  scaling: null,
  mode: null,
  scheme: null,
  density: null,
  device: null,
  portalContainer: null,
  dir: null,
}

/* Every setting, for the providers and scopes and for portals
 * (useYoujScope) and useTheme, which need most of it. */
export const YoujContext = createContext<YoujSettings>(DEFAULTS)

/* The hooks every component and icon calls read one slice each, so changing
 * one setting re-renders only what reads it: a theme or look change doesn't
 * re-render the icons on the page, and Speed doesn't re-render labels. */
export type MotionSettings = Pick<YoujSettings, 'timeScale' | 'reducedMotion' | 'personality'>
export const MotionContext = createContext<MotionSettings>(DEFAULTS)
export const LocaleContext = createContext(DEFAULTS.locale)
export const LabelsContext = createContext(DEFAULTS.labels)
export const LookContext = createContext(DEFAULTS.look)
export const QualityContext = createContext(DEFAULTS.quality)
export const DeviceContext = createContext(DEFAULTS.device)
export const DirectionContext = createContext(DEFAULTS.dir)

/** Provides the full settings and each slice. Slices keep their identity while their own fields hold. */
export function SettingsProvider({ value, children }: { value: YoujSettings; children: ReactNode }) {
  const { timeScale, reducedMotion, personality } = value
  const motionValue = useMemo(() => ({ timeScale, reducedMotion, personality }), [timeScale, reducedMotion, personality])
  return (
    <YoujContext.Provider value={value}>
      <MotionContext.Provider value={motionValue}>
        <LocaleContext.Provider value={value.locale}>
          <LabelsContext.Provider value={value.labels}>
            <LookContext.Provider value={value.look}>
              <QualityContext.Provider value={value.quality}>
                <DeviceContext.Provider value={value.device}>
                  <DirectionContext.Provider value={value.dir}>{children}</DirectionContext.Provider>
                </DeviceContext.Provider>
              </QualityContext.Provider>
            </LookContext.Provider>
          </LabelsContext.Provider>
        </LocaleContext.Provider>
      </MotionContext.Provider>
    </YoujContext.Provider>
  )
}
