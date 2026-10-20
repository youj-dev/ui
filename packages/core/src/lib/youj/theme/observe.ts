/* Canvas, WebGL and Lottie code resolves token colors once, so it has to be
 * told when the theme that applies to it changes. That happens through DOM
 * attributes, on <html> or on any ancestor:
 *   - data-theme (light/dark) and class (class-based switchers),
 *   - data-yj-theme (a preset, or a scope appearing),
 *   - data-yj-motion,
 *   - style, but only on <html> and on theme scopes (elements carrying
 *     data-yj-theme), where it holds the contract (YoujProvider, ThemeScope,
 *     themeProps). Inline styles elsewhere are ignored, so an animated
 *     ancestor doesn't trigger re-reads.
 * Plus the OS color scheme, for apps that follow it. */

const ATTRIBUTES = ['data-theme', 'data-yj-theme', 'data-yj-motion', 'class', 'style']

/** Calls `onChange` when the theme that applies to `el` may have changed. Returns a disposer. */
export function observeThemeChange(el: Element | null, onChange: () => void): () => void {
  const html = document.documentElement
  const observer = new MutationObserver((records) => {
    const relevant = records.some(
      (r) => r.attributeName !== 'style' || r.target === html || (r.target as Element).hasAttribute('data-yj-theme'),
    )
    if (relevant) onChange()
  })
  observer.observe(html, { attributes: true, attributeFilter: ATTRIBUTES })
  for (let node = el; node && node !== html; node = node.parentElement) {
    observer.observe(node, { attributes: true, attributeFilter: ATTRIBUTES })
  }
  const scheme = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null
  scheme?.addEventListener?.('change', onChange)
  return () => {
    observer.disconnect()
    scheme?.removeEventListener?.('change', onChange)
  }
}
