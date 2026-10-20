'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { setThemeMode, useSoundCue } from '@youj/core'
import { themeScriptCode } from '@youj/core/lib/youj/theme-script'
import { applyThemeMode, readThemeMode, subscribeThemeMode, useDefaultThemeMode } from '@youj/core/lib/youj/theme-mode'
import { useComponentLabels } from '@youj/core/labels'
import { accountMenuLabels } from '@youj/core/labels'
import { MonitorIcon } from '@youj/icons/components/youj/icons/monitor'
import { MoonIcon } from '@youj/icons/components/youj/icons/moon'
import { SunIcon } from '@youj/icons/components/youj/icons/sun'
import { ThemeIcon } from '@youj/icons/components/youj/icons/theme'
import { Button, type ButtonProps } from './button'
import { SegmentedControl, SegmentedControlItem } from './segmented-control'

/* Light or dark for the whole page. The palette follows `data-theme` on
 * <html>, so that's the one thing this writes, or reads when something else
 * (next-themes) writes it.
 *
 * - `button`: one icon button. The sun's rays draw back into the core and a
 *   bite sweeps in to carve the moon (ThemeIcon), and back. It's a toggle
 *   button named "Dark", pressed while dark is chosen. In `system` mode a
 *   press picks the opposite of what the page shows.
 * - `segmented`: Light, Dark and System as a SegmentedControl, its key
 *   gliding to the choice.
 *
 * Controlled (`value` + `onValueChange`, e.g. next-themes' theme/setTheme) it
 * only reports the choice. Uncontrolled it keeps the choice itself: in
 * localStorage under `storageKey` ("theme", next-themes' key), on <html> as
 * `data-theme`, and in step with the system while in `system` mode.
 * Under a YoujProvider with a `mode`, that mode is the default and the
 * provider follows the stored choice, so the two never compete.
 *
 * Hydration: the server can't know the choice, and next-themes already returns
 * the stored theme on the client's first render, so both modes show no choice
 * until the toggle has mounted, and only then reflect `value` or storage.
 * Server and hydrating markup agree. Meanwhile the button draws the sun or the
 * moon from `data-theme` on <html> in CSS (set before paint by next-themes or
 * ThemeScript), in the icon's own box, so nothing shifts or flashes when the
 * real icon takes over. Reduced motion: the icon swaps at once and the key
 * jumps. */

type ThemeToggleMode = 'light' | 'dark' | 'system'
type Scheme = 'light' | 'dark'

const MODES = ['light', 'dark', 'system'] as const satisfies readonly ThemeToggleMode[]
const DARK_QUERY = '(prefers-color-scheme: dark)'
const isMode = (value: unknown): value is ThemeToggleMode => MODES.includes(value as ThemeToggleMode)

/* ── The page's mode: core's store (setThemeMode, useThemeMode), shared by every toggle on the page ── */

/** The scheme on screen: what <html> says, dark when it says nothing (the palette's default). */
const readScheme = (): Scheme => (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark')
const noScheme = () => undefined

/** False on the server and while hydrating, true from then on (and at once for a client-only mount). */
const subscribeNothing = () => () => {}
const useMounted = () => useSyncExternalStore(subscribeNothing, () => true, () => false)

interface ThemeToggleProps extends Omit<ButtonProps, 'value' | 'defaultValue' | 'children' | 'variant'> {
  /** `button` flips light and dark; `segmented` offers Light, Dark and System. Default `button`. */
  variant?: 'button' | 'segmented'
  /** The chosen mode (controlled), such as next-themes' `theme`. `undefined` while it isn't known yet. */
  value?: ThemeToggleMode | (string & {})
  /** Called with the new mode, such as next-themes' `setTheme`. */
  onValueChange?: (mode: ThemeToggleMode) => void
  /** The mode before anything is stored (uncontrolled). Default: YoujProvider's `mode`, else `system`. */
  defaultValue?: ThemeToggleMode
  /** Where the uncontrolled choice is stored. Default "theme", the key next-themes and ThemeScript use. */
  storageKey?: string
  /** With sound on (`YoujProvider`’s `sound`), a switch plays `toggleOn`/`toggleOff` (button) or `select` (segmented). Default true. */
  sound?: boolean
}

function ThemeToggle({
  variant = 'button',
  value,
  onValueChange,
  defaultValue: defaultProp,
  storageKey = 'theme',
  sound = true,
  size,
  className,
  ...props
}: ThemeToggleProps) {
  const labels = useComponentLabels(accountMenuLabels)
  const cue = useSoundCue()
  const controlled = onValueChange !== undefined || value !== undefined
  const defaultValue = useDefaultThemeMode(defaultProp)
  const subscribe = useCallback((listener: () => void) => subscribeThemeMode(listener, storageKey), [storageKey])
  const stored = useSyncExternalStore(subscribe, () => readThemeMode(storageKey) ?? defaultValue, noScheme)
  const scheme = useSyncExternalStore(subscribe, readScheme, noScheme)
  const mounted = useMounted()
  const mode = !mounted ? undefined : controlled ? (isMode(value) ? value : value === undefined ? undefined : 'system') : stored

  // Uncontrolled, the toggle keeps <html> on the stored mode, and on the system's scheme while in `system`.
  useEffect(() => {
    if (controlled || stored === undefined) return
    applyThemeMode(stored)
    if (stored !== 'system') return
    const media = window.matchMedia?.(DARK_QUERY)
    const follow = () => applyThemeMode('system')
    media?.addEventListener?.('change', follow)
    return () => media?.removeEventListener?.('change', follow)
  }, [controlled, stored])

  const choose = (next: ThemeToggleMode) => {
    if (!controlled) setThemeMode(next, { storageKey })
    onValueChange?.(next)
  }

  if (variant === 'segmented') {
    const icon = { light: <SunIcon />, dark: <MoonIcon />, system: <MonitorIcon /> }
    const name = { light: labels.colorModeLight, dark: labels.colorModeDark, system: labels.colorModeSystem }
    return (
      <SegmentedControl
        data-slot="theme-toggle"
        aria-label={props['aria-label'] ?? labels.accountTheme}
        value={mode ?? ''}
        onValueChange={(next) => isMode(next) && choose(next)}
        size={size === 'sm' || size === 'icon-sm' ? 'sm' : 'default'}
        sound={sound}
        className={className}
      >
        {MODES.map((m) => (
          <SegmentedControlItem key={m} value={m} aria-label={name[m]} title={name[m]}>
            {icon[m]}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
    )
  }

  // An explicit mode is what's shown; `system` is whatever <html> ended up with.
  const shown = mode === 'light' || mode === 'dark' ? mode : scheme
  const known = mode !== undefined && shown !== undefined
  const dark = shown === 'dark'
  return (
    <Button
      data-slot="theme-toggle"
      variant="ghost"
      size={size ?? 'icon'}
      aria-label={labels.colorModeDark}
      aria-pressed={known ? dark : undefined}
      sound={false}
      className={className}
      {...props}
      onClick={(event) => {
        props.onClick?.(event)
        if (event.defaultPrevented || !known) return
        choose(dark ? 'light' : 'dark')
        if (sound) cue(dark ? 'toggleOff' : 'toggleOn')
      }}
    >
      {known ? (
        <ThemeIcon active={dark} />
      ) : (
        // Not known yet: whichever scheme <html> shows, from CSS alone. No `data-theme` reads dark, like the palette.
        <span aria-hidden data-slot="theme-toggle-placeholder" className="own:grid *:col-start-1 *:row-start-1">
          <ThemeIcon active={false} className="hidden [:root[data-theme=light]_&]:block" />
          <ThemeIcon active className="[:root[data-theme=light]_&]:hidden" />
        </span>
      )}
    </Button>
  )
}

interface ThemeScriptProps {
  /** Must match the toggles' `storageKey`. Default "theme". */
  storageKey?: string
  /** Must match the toggles' `defaultValue`. Default `system`. */
  defaultValue?: ThemeToggleMode
  /** For a Content-Security-Policy that allows inline scripts by nonce. */
  nonce?: string
}

/**
 * Sets `data-theme` on <html> from the stored choice before the page paints,
 * so an uncontrolled ThemeToggle never flashes the other theme. Render it in
 * <head> of a server-rendered layout. With next-themes, leave it out: next-themes
 * has its own.
 */
function ThemeScript({ storageKey = 'theme', defaultValue = 'system', nonce }: ThemeScriptProps) {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: static script from themeScriptSource; its arguments are JSON-escaped
  return <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeScriptSource({ storageKey, defaultValue }) }} />
}

/**
 * The code ThemeScript renders, as a string, for a page React doesn't render
 * (a Vite app's index.html): put it in an inline <script> in <head>.
 */
function themeScriptSource({ storageKey = 'theme', defaultValue = 'system' }: Pick<ThemeScriptProps, 'storageKey' | 'defaultValue'> = {}) {
  return themeScriptCode({ storageKey, defaultValue })
}

export { ThemeToggle, ThemeScript, themeScriptSource, type ThemeToggleProps, type ThemeScriptProps, type ThemeToggleMode }
