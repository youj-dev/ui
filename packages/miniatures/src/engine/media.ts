/* What a figure's `matchMedia()` answers. The lab files ask two questions:
 * reduced motion (to jump instead of travel) and, a few of them, whether it's
 * dark (to set a light's strength). Both are answered for this host, not the
 * OS: reduced motion by the `reducedMotion` prop, the mode by the `mode`
 * prop and the page's theme, exactly as the scoped stylesheet decides it, so
 * the drawing and its script never disagree. Other queries pass through. */

type ChangeListener = ((event: { matches: boolean; media: string }) => void) | { handleEvent(event: { matches: boolean; media: string }): void }

export interface MediaAnswer extends MediaQueryList {
  /** Re-reads the answer; tells the figure's listeners when it changed. */
  refresh(): void
}

export function answer(query: string, compute: () => boolean): MediaAnswer {
  let matches = compute()
  const listeners = new Set<ChangeListener>()
  const mql = {
    media: query,
    onchange: null as ((event: { matches: boolean; media: string }) => void) | null,
    get matches() {
      return matches
    },
    addEventListener: (type: string, fn: ChangeListener) => type === 'change' && fn && listeners.add(fn),
    removeEventListener: (_type: string, fn: ChangeListener) => listeners.delete(fn),
    addListener: (fn: ChangeListener) => fn && listeners.add(fn),
    removeListener: (fn: ChangeListener) => listeners.delete(fn),
    dispatchEvent: () => true,
    refresh() {
      const next = compute()
      if (next === matches) return
      matches = next
      const event = { matches, media: query }
      mql.onchange?.(event)
      for (const fn of [...listeners]) typeof fn === 'function' ? fn(event) : fn.handleEvent(event)
    },
  }
  return mql as unknown as MediaAnswer
}

/* The nearest YoujProvider's reduced-motion setting, read from the DOM contract it writes and not imported: `data-yj-reduced` on a subtree forced to reduced motion, and `--yj-motion` inline on its scope (0 reduced, 1 never, `var(--yj-os-motion)` follows the OS). */
export const PROVIDER_SCOPE = '[data-yj-reduced],[style*="--yj-motion"]'

/** `reduced` or `full` when the nearest provider decides it; null when there is none or it defers to the OS. */
export function providerMotion(host: Element): 'reduced' | 'full' | null {
  const scope = host.parentElement?.closest<HTMLElement>(PROVIDER_SCOPE)
  if (!scope) return null
  if (scope.hasAttribute('data-yj-reduced')) return 'reduced'
  const factor = scope.style.getPropertyValue('--yj-motion').trim()
  return factor === '0' ? 'reduced' : factor === '1' ? 'full' : null
}

/** Whether a host renders dark: forced by `mode`, else a `.dark`/`[data-theme=dark]` ancestor, else a dark OS without a light ancestor. Mirrors `WHEN` in css.ts. */
export function isDark(host: Element, mode: 'light' | 'dark' | 'system', osDark: boolean) {
  if (mode !== 'system') return mode === 'dark'
  const parent = host.parentElement
  if (parent?.closest('.dark,[data-theme="dark"]')) return true
  return osDark && !parent?.closest('.light,[data-theme="light"]')
}
