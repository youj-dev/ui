import { useContext, useMemo, useSyncExternalStore } from 'react'
import { mergeThemes, resolveTheme, type ResolvedTheme } from './theme/contract'
import { basalt } from './theme/themes/basalt'
import type { YoujLabels } from './labels-types'
import { getAutoTier, getServerTier, subscribeAutoTier, type QualitySetting, type QualityTier } from './budget'
import { DEFAULT_MODE, useDocumentScheme, type ColorMode, type ColorScheme } from './mode'
import { DEFAULT_LOOK, type YoujLook } from './look'
import type { YoujDensity, YoujScaling } from './settings'
import { getCoarsePointer, getServerCoarsePointer, resolveDevice, subscribeCoarsePointer, type Device, type DeviceSetting } from './device'
import { useDirectionOr, type Direction } from './direction'
import { DeviceContext, DirectionContext, LabelsContext, LocaleContext, LookContext, QualityContext, YoujContext } from './provider-context'

/**
 * The look in effect here: the nearest YoujProvider's or
 * ThemeScope's `look`, classic (the default) without one. A look set only in
 * CSS (a `data-yj-look` attribute written by hand) isn't visible to it.
 */
export function useYoujLook(): YoujLook {
  return useContext(LookContext) ?? DEFAULT_LOOK
}

/**
 * The layout density and UI scale in effect here: the nearest
 * YoujProvider's or ThemeScope's `density` and `scaling` (roomy and 100%
 * without one). Components whose sizes live in JS, such as a virtualized
 * table's row height, read them; one set only in CSS (a hand-written
 * `data-yj-density`) isn't visible to it.
 */
export function useYoujLayout(): { density: YoujDensity; scaling: YoujScaling } {
  const { density, scaling } = useContext(YoujContext)
  return useMemo(() => ({ density: density ?? 'roomy', scaling: scaling ?? '100%' }), [density, scaling])
}

/**
 * How a component is operated here: `touch` or `pointer`. A device forced by
 * the nearest YoujProvider or ThemeScope wins; otherwise the primary
 * pointer decides (`(pointer: coarse)` is touch). The server and the
 * hydration render say `pointer` and the client corrects on mount, so use it
 * for what a component does when it opens (a sheet or a popover), not for
 * markup that is on the page at load; use the `touch:` variant for styling.
 */
export function useDevice(): Device {
  const setting = useContext(DeviceContext)
  const coarse = useSyncExternalStore(subscribeCoarsePointer, getCoarsePointer, getServerCoarsePointer)
  return resolveDevice(setting, coarse)
}

/**
 * The element this subtree's overlays should render into, or undefined for
 * Base UI's default (the end of `<body>`). Pass it to a Portal's `container`
 * after any explicit one: `container={container ?? usePortalContainer()}`.
 */
export function usePortalContainer(): HTMLElement | undefined {
  return useContext(YoujContext).portalContainer ?? undefined
}

/** The device setting in effect: `auto` unless a provider or scope forces one. For a control that changes it. */
export function useDeviceSetting(): DeviceSetting {
  return useContext(DeviceContext) ?? 'auto'
}

/**
 * The reading direction here: the nearest YoujProvider's or ThemeScope's
 * `dir` (`auto` resolved from the content), else the document's `<html dir>`,
 * followed live. The server and the hydration render say `ltr` unless a
 * provider sets one, so pass `dir` to the provider for a server-rendered RTL
 * app, or use logical CSS for anything on the page at load. Use it for arrow
 * keys, the sign of a horizontal offset and which side a panel opens on.
 */
export function useDirection(): Direction {
  return useDirectionOr(useContext(DirectionContext))
}

/**
 * The theme in effect here, every field resolved: what YoujProvider and
 * ThemeScope set, over Basalt (the theme a page wears with none set). Themes
 * applied only in CSS aren't visible to it, except for the motion personality.
 */
export function useTheme(): ResolvedTheme {
  const { theme, personality } = useContext(YoujContext)
  return useMemo(() => resolveTheme({ ...mergeThemes(basalt, theme), ...(personality ? { motionPersonality: personality } : {}) }), [theme, personality])
}

export interface ModeState {
  /** The setting: what YoujProvider's `mode` says, `dark` when no provider sets one. */
  mode: ColorMode
  /** What is on screen: the mode resolved, `system` read from the OS. With no mode set, what `<html data-theme>` says (light only when it says so). */
  scheme: ColorScheme
}

/**
 * The colour mode in effect here: the nearest YoujProvider's or ThemeScope's
 * `mode` and the scheme it draws. The default mode is `dark`. The server and
 * the hydration render say `dark` for `system` (the OS is unknown), and the
 * client corrects on mount, so use it for what a component shows or does, and
 * `dark:` for styling.
 */
export function useMode(): ModeState {
  const { mode, scheme } = useContext(YoujContext)
  const document = useDocumentScheme(mode === null)
  return useMemo(() => ({ mode: mode ?? DEFAULT_MODE, scheme: scheme ?? document }), [mode, scheme, document])
}

/**
 * The locale to format in: `explicit` when given (a component's own `locale`
 * prop wins), else the nearest YoujProvider's, else 'en-US'. Never the
 * runtime default, so server and browser render the same text.
 */
export function useLocale(explicit?: string): string {
  const locale = useContext(LocaleContext)
  return explicit ?? locale
}

/**
 * The labels the enclosing providers set, without the English defaults, so
 * the provider doesn't carry the whole dictionary into every app. Components
 * read the full set through useLabels() (use-labels.ts).
 */
export function useLabelOverrides(): Partial<YoujLabels> | null {
  return useContext(LabelsContext)
}

export interface MotionBudget {
  /** The provider's setting. */
  quality: QualitySetting
  /**
   * The tier in effect: the setting when forced, else detected. 'low' comes
   * from Data Saver / Save-Data, prefers-reduced-data, <= 2 cores or <= 2 GB,
   * or a short CPU and frame-time probe (budget.ts). Server and hydration
   * renders see 'high'.
   */
  tier: QualityTier
}

const subscribeNothing = () => () => {}

/** Whether this device gets the full motion treatment. Pieces use it to pick lighter settings on 'low'. */
export function useMotionBudget(): MotionBudget {
  const quality = useContext(QualityContext)
  const auto = quality === 'auto'
  const detected = useSyncExternalStore(auto ? subscribeAutoTier : subscribeNothing, auto ? getAutoTier : getServerTier, getServerTier)
  const tier = auto ? detected : quality
  return useMemo(() => ({ quality, tier }), [quality, tier])
}
