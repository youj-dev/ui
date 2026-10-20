// Physical left/right utilities, which don't flip under dir="rtl". Components
// and blocks use the logical ones (ms/me, ps/pe, start/end, text-start,
// rounded-s/e, border-s/e), so one class list serves both directions.
// A utility behind an `rtl:` or `ltr:` variant is a deliberate per-direction
// value and passes, as does one keyed on a physical side Base UI reports
// (`data-[side=left]:`), and `left-1/2`, which centers the same way in both
// directions (`start-1/2` with `-translate-x-1/2` would not). Comment lines
// are prose. A side that must stay physical (a chart's time axis, a
// dial, a lane forced to dir="ltr") is marked on the line or the line above
// with `youj-allow: physical side <reason>`.

const LOGICAL = {
  ml: 'ms',
  mr: 'me',
  pl: 'ps',
  pr: 'pe',
  left: 'start',
  right: 'end',
  'rounded-l': 'rounded-s',
  'rounded-r': 'rounded-e',
  'rounded-tl': 'rounded-ss',
  'rounded-tr': 'rounded-se',
  'rounded-bl': 'rounded-es',
  'rounded-br': 'rounded-ee',
  'border-l': 'border-s',
  'border-r': 'border-e',
  'scroll-ml': 'scroll-ms',
  'scroll-mr': 'scroll-me',
  'scroll-pl': 'scroll-ps',
  'scroll-pr': 'scroll-pe',
  'text-left': 'text-start',
  'text-right': 'text-end',
  'float-left': 'float-start',
  'float-right': 'float-end',
  'clear-left': 'clear-start',
  'clear-right': 'clear-end',
}

/* A utility starts a class: after the start of a string, a space, a quote, a
 * variant's colon, an arbitrary variant's bracket or a negative sign's dash at
 * the class start. Variants (`md:`, `[&>svg]:`, `data-[x]:`) are captured so
 * `rtl:`/`ltr:` can be told apart. Spacing and inset utilities need a value
 * (`ml-2`, `left-0`); the keyword ones (`text-left`) stand alone. */
const UTILITY =
  /(?<=^|[\s"'`{(,])((?:[\w-]*\[[^\]\s]*\]:|[\w-]+:|!)*)(-?)((?:scroll-)?[mp][lr]|left|right|rounded-[tb]?[lr]|border-[lr])-(?=[\w[(./])|(?<=^|[\s"'`{(,])((?:[\w-]*\[[^\]\s]*\]:|[\w-]+:|!)*)((?:text|float|clear)-(?:left|right)|rounded-[tb]?[lr]|border-[lr])(?![\w-])/g

/* Inline styles with a physical side. */
const STYLE = /\b(marginLeft|marginRight|paddingLeft|paddingRight|borderLeft\w*|borderRight\w*)\s*:|textAlign:\s*['"](left|right)['"]/g

export const physicalAllowed = (line, previous = '') =>
  /youj-allow: physical side/.test(line) || /^\s*(?:\/\/|\{?\/\*)\s*youj-allow: physical side/.test(previous)

/** The physical utilities on a line, each with the logical one to use. */
export function physicalViolations(line) {
  const found = []
  if (/^\s*(?:\/\/|\*|\/\*|\{\/\*)/.test(line)) return found
  for (const m of line.matchAll(UTILITY)) {
    const variants = m[1] ?? m[4] ?? ''
    if (/(?:^|:)(?:rtl|ltr):/.test(variants) || /side[=-](?:left|right)/.test(variants)) continue
    const name = m[3] ?? m[5]
    const value = m[3] ? `-${line.slice(m.index + m[0].length).match(/^[^\s"'`]*/)[0]}` : ''
    if ((name === 'left' || name === 'right') && /^-1\/2(?![\w/])/.test(value)) continue
    found.push({ token: `${variants}${m[2] ?? ''}${name}${value}`, use: LOGICAL[name] })
  }
  for (const m of line.matchAll(STYLE)) {
    const name = m[1] ?? `textAlign: ${m[2]}`
    found.push({ token: name, use: name.replace('Left', 'InlineStart').replace('Right', 'InlineEnd').replace(/textAlign: (left|right)/, (_, s) => `textAlign: ${s === 'left' ? 'start' : 'end'}`) })
  }
  return found
}

/* Icons that point along the reading direction: back and forward, next and
 * previous, send, reply, undo. Under RTL they mirror (`rtl:-scale-x-100` on
 * the icon, or on a wrapper just around it). Media, clocks, alignment and
 * two-way glyphs never mirror, so they aren't listed. */
export const MIRRORED_ICONS = [
  'ChevronLeft',
  'ChevronRight',
  'ChevronsLeft',
  'ChevronsRight',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUpLeft',
  'ArrowDownLeft',
  'Undo',
  'Redo',
  'Reply',
  'Forward',
  'LogIn',
  'LogOut',
  'Send',
  'Indent',
]
const ICON_TAG = new RegExp(`<(${MIRRORED_ICONS.join('|')})Icon\\b([^>]*?)/?>`, 'gs')
/* An rtl: mirror (or an RTL-aware turn) on the icon or on a wrapper in the few lines above it. */
const MIRROR = /rtl:[^\s"'`]*(?:scale-x|rotate)/

/** The directional icons in a source that don't mirror under RTL, with their lines. */
export function unmirroredIcons(source) {
  const lines = source.split('\n')
  const found = []
  for (const m of source.matchAll(ICON_TAG)) {
    const line = source.slice(0, m.index).split('\n').length
    if (MIRROR.test(m[0])) continue
    const context = lines.slice(Math.max(0, line - 7), line)
    if (MIRROR.test(context.join('\n')) || context.some((l) => /youj-allow: (?:physical side|unmirrored icon)/.test(l))) continue
    found.push({ line, icon: `${m[1]}Icon` })
  }
  return found
}
