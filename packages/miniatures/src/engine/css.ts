/* A figure's stylesheet, adapted to run inside the miniature's shadow root.
 * The shadow root keeps it apart from the page both ways (a page's `.blur` or
 * `.fade` utility never reaches a figure's own `.blur`, and the figure's
 * `.face` never reaches the page), so the lab file's CSS runs as written. Only
 * what pointed at the lab page changes:
 *
 * - `:root` (or `html`/`body`) is the shadow root's wrapper, `.yjm-root`: the
 *   element the env hands the figure as `document.documentElement`, so its
 *   tokens and its own modes (`:root.night`) land there.
 * - `@media (prefers-color-scheme: dark)` blocks apply under `[data-dark]` and
 *   `@media (prefers-reduced-motion: reduce)` under `[data-reduced]`, which the
 *   env sets on the wrapper from the `mode` and `reducedMotion` props, the
 *   page's theme and the OS. Both conditions sit in `:where()`, so every rule
 *   keeps its specificity and the cascade is the lab file's.
 * - Each token the root itself declares (`--accent: #3b5bfd`, in `:root` or a
 *   root mode like `:root.night`) yields to the same name with a `yjm-` prefix
 *   from outside (`--accent: var(--yjm-accent, #3b5bfd)`), so a page themes
 *   miniatures by setting `--yjm-accent` on any ancestor. Tokens a figure sets
 *   on parts inside (`:root .inside{--unit}`) stay its own.
 *
 * Plain string work, so it also runs on a server and in the porting script. */

type Node = { sel: string; body: string } | { media: string; items: Node[] } | { raw: string }

const DARK_SCHEME = /^@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)$/i
const REDUCED_MOTION = /^@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)$/i
const ROOT_TOKEN = /^(?::root|html|body)(?![\w-])/
/** A selector whose subject is the root itself (`:root`, `:root.night`), not something inside it. */
const ROOT_ONLY = /^(?::root|html|body)(?![\w-])[^\s>+~]*$/

/** The wrapper's class: the lab page's root element, inside the shadow root. */
export const ROOT = 'yjm-root'

function parse(css: string): Node[] {
  let i = 0
  const skipString = () => {
    const quote = css[i]
    for (i++; i < css.length && css[i] !== quote; i++) if (css[i] === '\\') i++
  }
  const block = () => {
    const start = i
    for (let depth = 1; i < css.length; i++) {
      const ch = css[i]
      if (ch === '"' || ch === "'") skipString()
      else if (ch === '{') depth++
      else if (ch === '}' && --depth === 0) break
    }
    return css.slice(start, i++)
  }
  const items = (): Node[] => {
    const out: Node[] = []
    while (i < css.length) {
      while (i < css.length && /\s/.test(css[i]!)) i++
      if (i >= css.length) break
      if (css[i] === '}') {
        i++
        break
      }
      const start = i
      for (let depth = 0; i < css.length; i++) {
        const ch = css[i]
        if (ch === '"' || ch === "'") skipString()
        else if (ch === '(' || ch === '[') depth++
        else if (ch === ')' || ch === ']') depth--
        else if (depth === 0 && (ch === '{' || ch === ';' || ch === '}')) break
      }
      const prelude = css.slice(start, i).trim()
      if (css[i] !== '{') {
        if (css[i] === ';') i++
        if (prelude) out.push({ raw: `${prelude};` })
        continue
      }
      i++
      if (/^@(media|supports)\b/i.test(prelude)) out.push({ media: prelude, items: items() })
      else if (prelude.startsWith('@')) out.push({ raw: `${prelude}{${block()}}` })
      else out.push({ sel: prelude, body: block() })
    }
    return out
  }
  return items()
}

/** Splits a selector list on its top-level commas. */
export function splitSelectors(list: string) {
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < list.length; i++) {
    const ch = list[i]
    if (ch === '(' || ch === '[') depth++
    else if (ch === ')' || ch === ']') depth--
    else if (ch === ',' && depth === 0) {
      parts.push(list.slice(start, i).trim())
      start = i + 1
    }
  }
  parts.push(list.slice(start).trim())
  return parts.filter(Boolean)
}

/** One selector, with the page's root turned into the wrapper and `when` (a block's condition) applied. */
function adapt(selector: string, when: string) {
  if (ROOT_TOKEN.test(selector)) return selector.replace(ROOT_TOKEN, `.${ROOT}${when ? `:where(${when})` : ''}`)
  return when ? `:where(.${ROOT}${when}) ${selector}` : selector
}

/** `--name: value` → `--name: var(--yjm-name, value)`, for the tokens the root declares. */
const themeable = (body: string) => body.replace(/(^|;)\s*--([\w-]+)\s*:\s*([^;]+)/g, (_, lead: string, name: string, value: string) => `${lead}--${name}:var(--yjm-${name},${value.trim()})`)

/** The figure's stylesheet, ready for its shadow root. */
export function adaptCss(css: string): string {
  const emit = (nodes: Node[], when: string): string => {
    let out = ''
    for (const n of nodes) {
      if ('sel' in n) {
        const selectors = splitSelectors(n.sel)
        const body = selectors.some((s) => ROOT_ONLY.test(s)) ? themeable(n.body) : n.body
        out += `${selectors.map((s) => adapt(s, when)).join(',')}{${body}}`
      } else if ('items' in n) {
        if (DARK_SCHEME.test(n.media)) out += emit(n.items, `${when}[data-dark]`)
        else if (REDUCED_MOTION.test(n.media)) out += emit(n.items, `${when}[data-reduced]`)
        else out += `${n.media}{${emit(n.items, when)}}`
      } else out += n.raw
    }
    return out
  }
  return emit(parse(css.replace(/\/\*[\s\S]*?\*\//g, '')), '')
}

/**
 * The shadow root's own rules: the host's focus ring and stage, the wrapper
 * and svg filling the host, reduced motion. The svg drops the text settings a
 * page passes down (smoothing, features, case, spacing, direction): what's
 * printed on an object is part of its drawing, the same on every page. A page
 * can still style the host itself (its rules beat `:host`).
 */
export const HOST_CSS =
  ':host{-webkit-tap-highlight-color:transparent}' +
  ':host(:focus){outline:none}' +
  ':host(:focus-visible){outline:2px solid var(--yjm-accent,#3b5bfd);outline-offset:2px}' +
  `.${ROOT}{display:block;width:100%;height:100%;border-radius:inherit}` +
  `:host([data-stage]) .${ROOT}{background:var(--bg)}` +
  `.${ROOT}>svg{display:block;width:100%;height:100%;overflow:visible;touch-action:manipulation;user-select:none;-webkit-user-select:none;direction:ltr;unicode-bidi:isolate;` +
  '-webkit-font-smoothing:auto;-moz-osx-font-smoothing:auto;text-rendering:auto;font-feature-settings:normal;font-variation-settings:normal;font-variant:normal;text-transform:none;letter-spacing:normal;word-spacing:normal}' +
  `:host([data-interactive=false]) .${ROOT}>svg{pointer-events:none}` +
  `.${ROOT}>[role=status]{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}` +
  `:where(.${ROOT}[data-reduced]) *,:where(.${ROOT}[data-reduced]) *::before,:where(.${ROOT}[data-reduced]) *::after{transition:none!important;animation:none!important}`
