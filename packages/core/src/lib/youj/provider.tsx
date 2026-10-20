'use client'

import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from 'react'
import { MotionConfig, PresenceContext } from 'motion/react'
import { MOTION_PERSONALITIES, themeProps, type ThemeInput } from './theme/contract'
import type { MotionPersonality } from './tokens'
import { warnTheme } from './theme/check'
import { layeredTheme, type PaletteInput, type StyleInput } from './theme/layers'
import type { YoujLabels } from './labels-types'
import type { QualitySetting } from './budget'
import { MotionEnabledContext, MotionFeatures } from './features'
import { SoundCueContext, SoundStateContext, soundOptions, useSoundScope, type SoundProp } from './sound-scope'
import { useScheme, type ColorMode } from './mode'
import { DEFAULT_LOOK, type YoujLook } from './look'
import type { YoujDensity, YoujScaling } from './settings'
import type { DeviceSetting } from './device'
import { isRtlLocale, useResolvedDirection, type DirectionSetting } from './direction'
import { DEFAULTS, SettingsProvider, YoujContext, type ReducedMotionSetting } from './provider-context'
import { scalingAttribute, scopeProps } from './scope'
import { useDocumentMode, useDocumentTheme } from './document'
import { readThemeMode, subscribeThemeMode } from './theme-mode'

/* The provider's public surface lives in the modules it is split into; it stays importable from here. */
export { DENSITIES, SCALINGS, type YoujDensity, type YoujScaling } from './settings'
export type { Direction, DirectionSetting } from './direction'
export type { ReducedMotionSetting } from './provider-context'
export { useYoujScope, type YoujScopeProps } from './scope'
export {
  useDevice,
  useDeviceSetting,
  useDirection,
  useLabelOverrides,
  useLocale,
  useMode,
  useMotionBudget,
  usePortalContainer,
  useTheme,
  useYoujLayout,
  useYoujLook,
  type ModeState,
  type MotionBudget,
} from './provider-hooks'
export { useYouj, type Youj } from './use-youj'

export interface YoujProviderProps {
  children: ReactNode
  /**
   * `false` turns motion off for this subtree: everything renders its
   * resting state, nothing animates, and Motion's animation chunk is never
   * downloaded. Unlike reduced motion, which follows the user's system
   * setting, keeps the engine and keeps gentle feedback (fades), this is the
   * app's own switch and it's absolute: it implies `reducedMotion="always"`
   * (CSS motion stops too) and a component that settles state through an
   * animation shows it at once. Pointer dragging (a sortable list's grip) is
   * part of the engine and goes with it; keyboard operation stays. Read when
   * the provider mounts: switching it later remounts the subtree. Default:
   * the enclosing provider's, true at the root. (The theme's timing
   * is its `motionPersonality`; this is only on or off.)
   */
  motion?: boolean
  /** Multiplies every duration. Use >1 to study motion in slow motion. Default 1. */
  timeScale?: number
  /** 'user' follows prefers-reduced-motion. Ignored under `motion={false}`. Default 'user'. */
  reducedMotion?: ReducedMotionSetting
  /**
   * A theme for this subtree and everything it portals: a preset or
   * `defineTheme({…})`. Fields it leaves out come from the surrounding theme.
   * On the top-level provider (the first one on the page, with none above it)
   * the theme also applies to the document (`<html>`'s `data-yj-theme` and
   * variables, put back on unmount), so a theme picker changes the whole page,
   * not only this subtree; set `themeProps()` on `<html>` as well to have it
   * right before the first paint. A nested provider themes its subtree alone.
   * Default: none, so the CSS theme applies (Basalt unless you set one).
   */
  theme?: ThemeInput
  /**
   * A palette for this subtree (definePalette, or a shipped one such as
   * `meadowPalette`): its colours over the surrounding theme, whose form
   * stays. With `style`, the two make a complete theme. `theme` applies on top.
   */
  palette?: PaletteInput
  /**
   * A style for this subtree (defineStyle, or one of `cleanStyle`,
   * `bezelStyle`, `classicStyle`, `brutalStyle`, `terminalStyle`): its form
   * over the surrounding theme, whose colours stay. The look follows it
   * unless `look` is given.
   */
  style?: StyleInput
  /**
   * The motion budget. 'auto' detects low-end devices (see useMotionBudget)
   * and gives them lighter backgrounds, no cursor follower and shorter
   * staggers; 'high' and 'low' force a tier. Default: the enclosing
   * provider's setting, 'auto' at the root.
   */
  quality?: QualitySetting
  /**
   * The BCP 47 locale components format numbers, dates and times in, unless
   * one is passed to them directly. Pass the user's locale from the server
   * (a cookie or Accept-Language) so both renders agree. Default: the
   * enclosing provider's, 'en-US' at the root.
   */
  locale?: string
  /**
   * Built-in copy in your language: close buttons, screen-reader text,
   * placeholders, empty states. Keys you leave out come from the enclosing
   * provider, then English. A component's own prop (`loadingLabel`,
   * `aria-label`, …) still wins. See `YoujLabels` for every key.
   */
  labels?: Partial<YoujLabels>
  /**
   * The colour mode: `dark` (the default), `light`, or `system`, which follows
   * the operating system's `prefers-color-scheme` live. It writes
   * `data-theme`, which the palette and `dark:` read: on `<html>` for the
   * top-level provider (put back on unmount), on this subtree for a nested one.
   * Leave it out and the page is dark unless your own tooling (next-themes,
   * ThemeToggle) sets `data-theme`. The server can't know the OS scheme, so for
   * `system` or `light` render `<ModeScript mode={…} />` in `<head>` to avoid a
   * flash; `useMode()` reads the result. On the top-level provider it is the
   * default: a visitor's choice from ThemeToggle or `setThemeMode` (stored in
   * localStorage under "theme") wins over it, and ModeScript applies that
   * choice too. Default: the enclosing provider's; none at the root, which
   * leaves `data-theme` alone.
   */
  mode?: ColorMode
  /**
   * How components are built in this subtree and everything it portals:
   * `classic` (the default) or `bezel`. The theme's style names one (its
   * `look`), which this overrides: the theme owns color, type and the radius
   * scale, the look owns anatomy. It writes `data-yj-look`, which the look's
   * recipes in @youj/react key on. Default: the style's, else the enclosing
   * provider's; at the root, classic, written without being asked.
   */
  look?: YoujLook
  /**
   * Sizes the UI in this subtree and everything it portals by one factor:
   * type, spacing, control heights, radii, icons and panel room (youj.css
   * section 5). `'90%'` suits a dense app. Hairlines, focus rings and
   * breakpoints hold, controls stay at 24px or more, and below 100% applies
   * to fine pointers only (touch keeps its targets). It writes
   * `data-yj-scaling`. Default: the enclosing provider's; none at the root,
   * which is 100%.
   */
  scaling?: YoujScaling
  /**
   * The layout density in this subtree and everything it portals: how much
   * room panels, table and list rows, fields, dialogs and sheets give their
   * content (ui.css, "Layout density"). `'roomy'` is the standard, the
   * default; `'compact'` is for dense pro tools (16px panel sides, 36px rows). Independent of the theme's control size
   * (`--yj-density`) and of `scaling`, which it pairs with: a dense tool is
   * `density="compact" scaling="90%"`. It writes `data-yj-density`.
   * Default: the enclosing provider's; none at the root, which is roomy.
   */
  density?: YoujDensity
  /**
   * How components are operated and presented here: `auto` (the default)
   * follows the primary pointer, so a phone gets touch sizes and sheets where
   * a desktop gets popovers; `touch` and `pointer` force one for this subtree
   * and everything it portals. It writes `data-yj-device`, which the `touch:`
   * and `fine:` variants in @youj/react key on. Set it once, near the
   * root of what it governs (see device.ts). Default: the enclosing
   * provider's, `auto` at the root.
   */
  device?: DeviceSetting
  /**
   * Where the overlays of this subtree render (menus, sheets, dialogs,
   * tooltips), instead of the end of `<body>`: an element that is a
   * positioning context for `fixed` (one with a `transform`) keeps them
   * inside it. The docs use it to show a phone's sheets inside a phone-sized
   * frame on a desktop. Components pass it to their Base UI Portal through
   * `usePortalContainer()`; an explicit `container` prop wins. Default: the
   * enclosing provider's, `document.body` at the root.
   */
  portalContainer?: HTMLElement | null
  /**
   * The reading direction of this subtree and everything it portals: `ltr`,
   * `rtl`, or `auto` to take it from the content's first strong character.
   * It writes `dir`, so logical CSS (padding-inline, `start-0`) follows, and
   * every component reads it through `useDirection()`: arrow keys, menu and
   * popover sides, sliders, carousels, sheets set to `start`/`end`, and
   * directional motion all mirror. @youj/react hands it to Base UI's
   * DirectionProvider. Default: `rtl` when this provider's own `locale` is a
   * right-to-left language (ar, he, fa, ur and similar), else the enclosing
   * provider's; at the root, the document's (`<html dir>`).
   */
  dir?: DirectionSetting
  /**
   * Interface sounds: a pack from `@youj/sound` (`beacon`, `halo`, `rill`,
   * `glyph`, `zephyr`, `glass`, or your own `definePack`) turns them on for
   * everything below: a press, a toggle, an outcome, a toast, a dialog.
   * Nothing is downloaded until sound is on and unmuted, and without this
   * prop no sound code is requested at all. `false` silences this subtree (a
   * preview, an embedded editor). To set more than the pack, pass an object:
   * `sound={{ pack: beacon, volume: 0.4, muted, onMutedChange: setMuted }}`
   * (see `SoundSettings`). Default: the enclosing provider's, none at the
   * root. Sound follows the motion: it goes quiet under reduced motion
   * (`whenReduced` keeps it) and under `motion={false}`.
   */
  sound?: SoundProp
}

/** Optional root. Without it, components use timeScale 1, follow the OS reduced-motion setting, the CSS theme (Basalt, dark, unless the page sets one) and the Classic look. It also loads Motion's animation features once for the whole tree (see MotionFeatures). */
export function YoujProvider({
  children,
  motion: motionProp,
  timeScale = 1,
  reducedMotion: reducedMotionProp = 'user',
  theme,
  palette,
  style,
  quality: qualityProp,
  locale: localeProp,
  labels: labelsProp,
  look: lookProp,
  scaling: scalingProp,
  mode: modeProp,
  density: densityProp,
  device: deviceProp,
  portalContainer: portalContainerProp,
  dir: dirProp,
  sound: soundProp,
}: YoujProviderProps) {
  const parent = useContext(YoujContext)
  const dirSetting = dirProp ?? (isRtlLocale(localeProp) ? 'rtl' : undefined)
  const parentAnimated = useContext(MotionEnabledContext)
  const animated = motionProp ?? parentAnimated
  // Motion off is reduced motion, absolutely: every component's instant path, and CSS motion at 0.
  const reducedMotion = animated ? reducedMotionProp : 'always'
  const parentSound = useContext(SoundStateContext)
  const parentSink = useContext(SoundCueContext)
  const sound = useSoundScope(soundOptions(soundProp), parentSound, parentSink)
  const quality = qualityProp ?? parent.quality
  const locale = localeProp ?? parent.locale
  // The look follows the style picked here (or the theme's); the first scope to set a look writes one: the default when none is given.
  const ownLook = lookProp ?? style?.look ?? theme?.look
  const look = ownLook ?? parent.look ?? DEFAULT_LOOK
  const themed = Boolean(theme || palette || style)
  const scaling = scalingProp ?? parent.scaling
  const root = parent === DEFAULTS
  const ownMode = useStoredMode(root && modeProp !== undefined) ?? modeProp
  const mode = ownMode ?? parent.mode
  const scheme = useScheme(mode)
  const hydrated = useHydrated()
  const density = densityProp ?? parent.density
  const device = deviceProp ?? parent.device
  const portalContainer = portalContainerProp === undefined ? parent.portalContainer : portalContainerProp
  const labels = useMemo(() => (labelsProp ? { ...parent.labels, ...labelsProp } : parent.labels), [parent.labels, labelsProp])
  const ref = useRef<HTMLDivElement>(null)
  const merged = useMemo(() => layeredTheme(parent.theme, theme, palette, style, parent.look ?? undefined), [parent.theme, theme, palette, style, parent.look])
  const fromDom = useMotionAttribute(ref, !merged?.motionPersonality)
  const personality = merged?.motionPersonality ?? fromDom ?? parent.personality
  const dir = useResolvedDirection(ref, dirSetting, parent.dir)
  const value = useMemo(
    () => ({ timeScale, reducedMotion, theme: merged, personality, quality, locale, labels, look, scaling, mode, scheme, density, device, portalContainer, dir }),
    [timeScale, reducedMotion, merged, personality, quality, locale, labels, look, scaling, mode, scheme, density, device, portalContainer, dir],
  )
  useThemeWarning(themed ? merged : null)
  useDocumentTheme(root && themed && merged ? merged : null)
  // Not while hydrating: ModeScript already wrote the stored choice, which the server render can't know.
  useDocumentMode(root && modeProp && hydrated ? scheme : null)
  // The DOM carries a scale, mode, density, device or direction set above down to this subtree, so only an own one is written.
  // A top-level mode waits for hydration, like <html>'s, so the server's guess never covers what ModeScript applied.
  const scope = scopeProps(value, { theme: themed, look: Boolean(ownLook) || parent.look === null, scaling: Boolean(scalingProp), mode: Boolean(modeProp) && (!root || hydrated), density: Boolean(densityProp), device: Boolean(deviceProp), dir: false })
  const tree = (
    <div ref={ref} {...scope} dir={dirSetting} style={{ display: 'contents', ...scope.style }}>
      {children}
    </div>
  )
  return (
    <SettingsProvider value={value}>
      <SoundStateContext.Provider value={sound.state}>
        <SoundCueContext.Provider value={sound.sink}>
          <MotionEnabledContext.Provider value={animated}>
            {/* MotionConfig reads isStatic once, so a change of `motion` remounts what's below. */}
            <MotionConfig key={animated ? 'motion' : 'static'} reducedMotion={reducedMotion} isStatic={!animated}>
              {animated ? (
                <MotionFeatures>{parentAnimated ? tree : <PresenceContext.Provider value={null}>{tree}</PresenceContext.Provider>}</MotionFeatures>
              ) : (
                <PresenceContext.Provider value={STATIC_PRESENCE}>{tree}</PresenceContext.Provider>
              )}
            </MotionConfig>
          </MotionEnabledContext.Provider>
        </SoundCueContext.Provider>
      </SoundStateContext.Provider>
    </SettingsProvider>
  )
}

/* The visitor's stored light/dark/system choice (ThemeToggle, setThemeMode),
 * for the top-level provider with a `mode`: it wins over the prop. The server
 * and the hydration render know none, so they draw the prop. */
const subscribeNothing = () => () => {}
const noStoredMode = () => undefined
const readStoredMode = () => readThemeMode()
function useStoredMode(enabled: boolean): ColorMode | undefined {
  return useSyncExternalStore(enabled ? subscribeThemeMode : subscribeNothing, enabled ? readStoredMode : noStoredMode, noStoredMode)
}
const useHydrated = () => useSyncExternalStore(subscribeNothing, () => true, () => false)

/* With motion off, Motion renders statically: an `m` element shows its
 * current `animate` target on every render, with no engine to tween there (no
 * visual element is created at all). Static rendering shows `initial` unless
 * the initial animation is blocked, and `initial === false` on the presence
 * context blocks it for every element below, so a content that animates in
 * renders already in. (An AnimatePresence child brings its own context and
 * must not hide itself under reduced motion: `initial={k.reduced ? false : …}`.) */
const STATIC_PRESENCE = { id: 'youj-static', initial: false as const, isPresent: true, register: () => () => {} }

export interface ThemeScopeProps {
  /** A preset or `defineTheme({…})`. Partial themes override the surrounding one, e.g. `{ accent: '#ff5a1f' }`. */
  theme?: ThemeInput
  /** A palette for this part of the page: its colours over the surrounding theme (see YoujProvider's `palette`). */
  palette?: PaletteInput
  /** A style for this part of the page: its form over the surrounding theme, and its look (see YoujProvider's `style`). */
  style?: StyleInput
  /** The look for this part of the page: `classic` or `bezel`. Default: the style's or theme's, else the surrounding one (classic at the root). */
  look?: YoujLook
  /** The UI scale for this part of the page (see YoujProvider's `scaling`). Default: the surrounding one. */
  scaling?: YoujScaling
  /** The colour mode for this part of the page (see YoujProvider's `mode`): a dark footer in a light page. Default: the surrounding one. */
  mode?: ColorMode
  /** The layout density for this part of the page (see YoujProvider's `density`): `roomy` for a marketing section inside a compact app. Default: the surrounding one. */
  density?: YoujDensity
  /** Forces how components are operated and presented for this part of the page: `touch` or `pointer`. Default: the surrounding one. See `YoujProvider`'s `device`. */
  device?: DeviceSetting
  /** The reading direction for this part of the page: `ltr`, `rtl` or `auto` (see YoujProvider's `dir`). Default: the surrounding one. */
  dir?: DirectionSetting
  children: ReactNode
}

/**
 * Themes part of a page, and everything it portals. Scopes nest, and each one
 * keeps the provider's Speed and reduced-motion settings. It renders a
 * `display: contents` element, so wrap an element that paints (a section with
 * `bg-canvas`) rather than relying on the scope for a background.
 */
export function ThemeScope({ theme, palette, style, look, scaling, mode: modeProp, density, device, dir: dirProp, children }: ThemeScopeProps) {
  const parent = useContext(YoujContext)
  const ref = useRef<HTMLDivElement>(null)
  const dir = useResolvedDirection(ref, dirProp, parent.dir)
  const themed = Boolean(theme || palette || style)
  const merged = useMemo(() => (themed ? layeredTheme(parent.theme, theme, palette, style, parent.look ?? undefined) : parent.theme), [themed, parent.theme, theme, palette, style, parent.look])
  const personality = merged?.motionPersonality ?? parent.personality
  const own = look ?? style?.look ?? theme?.look ?? (parent.look === null ? DEFAULT_LOOK : undefined)
  const mode = modeProp ?? parent.mode
  const scheme = useScheme(mode)
  const value = useMemo(
    () => ({
      ...parent,
      theme: merged,
      personality,
      look: own ?? parent.look,
      scaling: scaling ?? parent.scaling,
      mode,
      scheme,
      density: density ?? parent.density,
      device: device ?? parent.device,
      dir,
    }),
    [parent, merged, personality, own, scaling, mode, scheme, density, device, dir],
  )
  useThemeWarning(themed ? merged : null)
  // A scope with only a look re-themes nothing, so it isn't a theme scope.
  const scope = themed && merged ? themeProps(merged) : null
  return (
    <SettingsProvider value={value}>
      <div
        ref={ref}
        dir={dirProp}
        data-yj-theme={scope?.['data-yj-theme']}
        data-yj-palette={scope?.['data-yj-palette']}
        data-yj-style={scope?.['data-yj-style']}
        data-yj-motion={scope ? (personality ?? undefined) : undefined}
        data-theme={modeProp ? (scheme ?? undefined) : undefined}
        data-yj-look={own}
        data-yj-scaling={scaling ? scalingAttribute(scaling) : undefined}
        data-yj-density={density}
        data-yj-device={device && device !== 'auto' ? device : undefined}
        style={{ display: 'contents', ...scope?.style }}
      >
        {children}
      </div>
    </SettingsProvider>
  )
}

/* CSS-only themes set the personality with a data-yj-motion attribute. A
 * provider without one from JS picks it up from the nearest ancestor that has
 * it, so JS-driven motion (springs, tweens) follows the CSS theme too. It is
 * read after mount, so server HTML and the hydration render always agree. */
function useMotionAttribute(ref: RefObject<HTMLElement | null>, enabled: boolean): MotionPersonality | null {
  const [found, setFound] = useState<MotionPersonality | null>(null)
  useLayoutEffect(() => {
    const from = ref.current?.parentElement
    if (!enabled || !from) return
    const read = () => {
      const value = from.closest('[data-yj-motion]')?.getAttribute('data-yj-motion')
      setFound((MOTION_PERSONALITIES as readonly string[]).includes(value ?? '') ? (value as MotionPersonality) : null)
    }
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-yj-motion'], subtree: true })
    return () => observer.disconnect()
  }, [ref, enabled])
  return enabled ? found : null
}

declare const process: { env: { NODE_ENV?: string } }
function useThemeWarning(theme: ThemeInput | null) {
  useEffect(() => {
    // The bundler strips the check, and the contrast code it pulls in, from a production build.
    if (process.env.NODE_ENV !== 'production' && theme) warnTheme(theme)
  }, [theme])
}
