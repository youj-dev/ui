#!/usr/bin/env node
// The token migration's tint sweep (token-audit/ARCHITECTURE.md section 3,
// phase 6.4): a role with `/N` (`bg-accent/10`, `border-danger/30`,
// `bg-fg/6`) becomes the role that is that tint, so a theme can move it.
// Near-zero visual change, not zero: /10 and the role's 10% + 4% in dark
// differ by a few percent of one channel.
//
//   node scripts/codemods/token-tints.mjs --scope packages/ui/src/components
//   node scripts/codemods/token-tints.mjs --scope apps/docs --dry-run --list
//
// --scope takes repo-relative folders (or files), comma separated. --dry-run
// writes nothing. The report counts the rewrites per family per folder, then
// the alphas it never touches. --list adds those per file with the line, for
// hand mapping. Idempotent: a second run finds nothing to rewrite.
//
// What it rewrites (class tokens in TS, TSX, JS, MDX code and CSS `@apply`;
// variants and a `!` are kept):
//   ink-subtle   bg-<ink>/4-15                      -> bg-<ink>-subtle
//   ink-line     border|ring-<ink>/20-40            -> border|ring-<ink>-line
//                (a ring under a focus variant is a halo: left for a hand edit)
//   band, hover  bg-fg/4-8, bg-band/30-60, bg-hover/60-70
//                                                   -> bg-band (bg-hover when
//                hover:/active:/focus:/a highlighted state, or when it is /6)
//   text         text-fg/55-75 -> text-fg-muted, text-fg/80-100 -> text-fg
//   line         border-line/50-70, border-fg/10-20 -> border-line-subtle,
//                border-fg/25-40                    -> border-line-strong
//   glass        bg-chrome/60-95, and bg-canvas|surface/60-95
//                with a backdrop blur, on an element with data-yj-tone="chrome"
//                                                   -> yj-glass (the blur goes)
// Everything else with an alpha on a role (selected vs well vs decor, solids'
// hover, SVG art) is left, and listed with --list; gradient stops, shadow
// colors and `youj-allow` lines are not.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

const ROOT = join(import.meta.dirname, '..', '..')

export const ROLE_NAMES = [
  'canvas', 'surface', 'overlay', 'well', 'field', 'key', 'control', 'chrome-float', 'chrome', 'inverse', 'scrim',
  'line-subtle', 'line-strong', 'line-control', 'line', 'fg-muted', 'fg-subtle', 'fg', 'on-accent', 'on-action',
  'accent', 'action', 'danger', 'hover', 'selected', 'band', 'focus', 'success', 'warning', 'info',
  ...['accent', 'success', 'warning', 'danger', 'info'].flatMap((ink) => [`${ink}-text`, `${ink}-subtle`, `${ink}-line`]),
  'chart-quiet', 'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'shadow',
].sort((a, b) => b.length - a.length)
const INKS = ['accent', 'success', 'warning', 'danger', 'info']

const COLOR_UTILITY = 'bg|text|border(?:-[xytrblse])?|ring-offset|inset-ring|ring|outline|divide|fill|stroke|from|via|to|decoration|placeholder|caret|shadow|accent'
const LEAD = '(^|[\\s"\'`{(])'
const TAIL = '(?=$|[\\s"\'`)}\\]!,;])'
/** A class token with a role and a numeric alpha: `<variants><!><utility>-<role>/<N | [.N]>`. */
export const TINT = new RegExp(`${LEAD}((?:[^\\s"'\`:]+:)*)(!?)(${COLOR_UTILITY})-(${ROLE_NAMES.join('|')})\\/(\\d+(?:\\.\\d+)?|\\[[0-9.]+\\])${TAIL}`, 'gm')

/** Gradient stops and shadow colors keep their alpha: the role still moves with the theme, and the alpha isn't paint on a plane. */
export const EXEMPT_UTILITIES = ['from', 'via', 'to', 'shadow']
/** A site is allowed by `youj-allow` on its line (in a class string as the token `youj-allow-<why>`, elsewhere as a comment) or the line before. */
export const isAllowed = (line, previous = '') => line.includes('youj-allow') || /^\s*(?:\/\/|\{?\/\*)\s*youj-allow/.test(previous)

/** The alpha as a percentage: `10` is 10, `[0.06]` and `[.06]` are 6. */
const percent = (alpha) => (alpha.startsWith('[') ? Number(alpha.slice(1, -1)) * 100 : Number(alpha))

const HOVERISH = /(^|:)(?:group-|peer-)?(?:hover|active|focus|focus-visible|focus-within|pressed)$|highlighted|aria-selected|data-\[state=(?:on|open|checked|selected)\]|data-(?:on|open|selected|active|pressed)/
const FOCUS = /(^|:)(?:group-|peer-)?(?:focus|focus-visible|focus-within)$/
const isHover = (variants) => variants.split(':').filter(Boolean).some((v) => HOVERISH.test(v))
const isFocus = (variants) => variants.split(':').filter(Boolean).some((v) => FOCUS.test(v))

/**
 * The role to write instead of `<utility>-<role>/<alpha>`, as { family, role } (an empty role is a removal
 * the caller handles), or null when the case needs a person.
 */
export function mapTint({ variants, utility, role, alpha }) {
  const n = percent(alpha)
  const side = utility.startsWith('border')
  const hover = isHover(variants)
  if (utility === 'bg') {
    if (INKS.includes(role) && n >= 4 && n <= 15) return { family: 'ink-subtle', role: `${role}-subtle` }
    if (role === 'fg' && n >= 4 && n <= 8) return n === 6 || hover ? { family: 'hover', role: 'hover' } : { family: 'band', role: 'band' }
    if (role === 'fg' && hover && n > 8 && n <= 10) return { family: 'hover', role: 'hover' }
    if (role === 'band' && n >= 30 && n <= 60) return hover ? { family: 'hover', role: 'hover' } : { family: 'band', role: 'band' }
    if (role === 'hover' && n >= 60 && n <= 70) return { family: 'hover', role: 'hover' }
    return null
  }
  if (side || utility === 'ring') {
    if (INKS.includes(role) && n >= 20 && n <= 40) return utility === 'ring' && isFocus(variants) ? null : { family: 'ink-line', role: `${role}-line` }
    if (side && role === 'line' && n >= 50 && n <= 70) return { family: 'line', role: 'line-subtle' }
    if (side && role === 'fg' && n >= 10 && n <= 20) return { family: 'line', role: 'line-subtle' }
    if (side && role === 'fg' && n >= 25 && n <= 40) return { family: 'line', role: 'line-strong' }
    return null
  }
  if (utility === 'text' && role === 'fg') {
    if (n >= 55 && n <= 75) return { family: 'text', role: 'fg-muted' }
    if (n >= 80 && n < 100) return { family: 'text', role: 'fg' }
  }
  return null
}

const GLASS_ROLES = ['canvas', 'surface', 'chrome']
const BLUR = /(?<=^|[\s"'`])(?:[^\s"'`:]+:)*(?:backdrop-blur(?:-[^\s"'`]+)?|backdrop-saturate-[^\s"'`]+|\[backdrop-filter:[^\]]*\])(?=$|[\s"'`])/g
const BLUR_WITH_SPACE = new RegExp(`\\s?${BLUR.source}`, 'g')
const CHROME_TONE = /data-yj-tone\s*=\s*(?:["']chrome["']|\{\s*["']chrome["']\s*\})/

/** True when the JSX tag a match sits in carries data-yj-tone="chrome" (the tag runs from its `<` to the next tag's). */
function inChromeTag(text, index) {
  const open = [...text.slice(Math.max(0, index - 800), index).matchAll(/<[A-Za-z][\w.]*/g)].pop()
  if (!open) return false
  const start = Math.max(0, index - 800) + open.index
  const next = text.slice(index).search(/\n\s*<[A-Za-z]|\n\s*<\//)
  const end = index + (next === -1 ? 600 : Math.min(next, 600))
  return CHROME_TONE.test(text.slice(start, end))
}

/**
 * Rewrites the tints in `text`. Returns the text, the rewrites per family and
 * the alphas left: [{ line, token }].
 */
export function sweepTints(text, file, { scan = false } = {}) {
  const counts = new Map()
  const left = []
  let allowed = 0
  const bump = (family) => counts.set(family, (counts.get(family) ?? 0) + 1)
  const lineOf = (text, index) => text.slice(0, index).split('\n').length

  const apply = (code, lineBase = 0) => {
    // Glass first: it also removes the blur tokens on the same line.
    code = code.replace(TINT, (whole, lead, variants, _bang, utility, role, alpha, index) => {
      const n = percent(alpha)
      if (utility !== 'bg' || variants || !GLASS_ROLES.includes(role) || n < 60 || n > 95) return whole
      const line = code.slice(code.lastIndexOf('\n', index) + 1, code.indexOf('\n', index) === -1 ? undefined : code.indexOf('\n', index))
      const blurred = new RegExp(BLUR.source).test(line)
      if (role !== 'chrome' && !blurred) return whole
      if (!inChromeTag(code, index)) return whole
      bump('glass')
      return `${lead}yj-glass`
    })
    return code.replace(TINT, (whole, lead, variants, bang, utility, role, alpha, index) => {
      if (percent(alpha) === 0) return whole
      const mapped = scan ? null : mapTint({ variants, utility, role, alpha })
      if (!mapped) {
        const at = code.lastIndexOf('\n', index + lead.length) + 1
        const rest = code.indexOf('\n', index)
        const line = code.slice(at, rest === -1 ? undefined : rest)
        const before = code.slice(code.lastIndexOf('\n', at - 2) + 1, at - 1)
        if (EXEMPT_UTILITIES.includes(utility)) return whole
        if (isAllowed(line, before)) {
          allowed++
          return whole
        }
        left.push({ line: lineBase + lineOf(code, index + lead.length), token: `${variants}${bang}${utility}-${role}/${alpha}` })
        return whole
      }
      bump(mapped.family)
      return `${lead}${variants}${bang}${utility}-${mapped.role}`
    })
  }

  let out = text
  if (/\.mdx$/.test(file)) {
    let fence = null
    out = text
      .split('\n')
      .map((line, i) => {
        const marker = line.match(/^\s*(`{3,}|~{3,})/)?.[1]
        if (marker && (!fence || (marker[0] === fence[0] && marker.length >= fence.length))) {
          fence = fence ? null : marker
          return line
        }
        return fence ? apply(line, i) : line.replace(/`([^`\n]+)`/g, (_span, code) => `\`${apply(code, i)}\``)
      })
      .join('\n')
  } else if (/\.css$/.test(file)) out = text.replace(/@apply[^;{}]*/g, (rule) => apply(rule))
  else out = apply(text)
  // The blur that yj-glass replaces goes from every line that gained it.
  if (counts.has('glass')) {
    out = out
      .split('\n')
      .map((line) => (/(?<![\w-])yj-glass(?![\w-])/.test(line) ? line.replace(BLUR_WITH_SPACE, '').replace(/([=(,{[] ?[`"'])[ ]+/g, '$1') : line))
      .join('\n')
  }
  return { text: out, counts, left, allowed }
}

const SOURCE = /\.(?:tsx?|jsx?|mjs|css|mdx)$/
// The shadcn guide quotes shadcn's own classes next to Youj's.
export const SKIP = /^apps\/docs\/content\/docs\/guides\/shadcn\.mdx$|(^|\/)(node_modules|dist|\.next|\.claude|public\/r|registry\/generated|packages\/miniatures\/src)\/|^scripts\/codemods\/token-|^packages\/ui\/src\/styles\/shadcn\.(css|test\.ts)$|^packages\/ui\/scripts\/shadcn-rewrite/

export function listFiles(scopes) {
  return execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 })
    .split('\0')
    .filter((f) => f && SOURCE.test(f) && !SKIP.test(f) && scopes.some((s) => f === s || f.startsWith(`${s}/`)))
}

function main() {
  const { values } = parseArgs({ options: { scope: { type: 'string' }, 'dry-run': { type: 'boolean', default: false }, list: { type: 'boolean', default: false } } })
  const scopes = values.scope?.split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean) ?? []
  if (!scopes.length) {
    console.error('usage: token-tints.mjs --scope <folder,folder…> [--dry-run] [--list]')
    process.exit(2)
  }
  const done = new Map(scopes.map((s) => [s, new Map()]))
  const leftBy = new Map(scopes.map((s) => [s, new Map()]))
  const lines = []
  let changed = 0
  let allowed = 0
  for (const file of listFiles(scopes)) {
    let before
    try {
      before = readFileSync(join(ROOT, file), 'utf8')
    } catch {
      continue
    }
    const result = sweepTints(before, file)
    const folder = scopes.find((s) => file === s || file.startsWith(`${s}/`))
    allowed += result.allowed
    for (const [k, c] of result.counts) done.get(folder).set(k, (done.get(folder).get(k) ?? 0) + c)
    for (const { line, token } of result.left) {
      leftBy.get(folder).set(token, (leftBy.get(folder).get(token) ?? 0) + 1)
      lines.push(`${file}:${line}  ${token}`)
    }
    if (result.text === before) continue
    changed++
    if (!values['dry-run']) writeFileSync(join(ROOT, file), result.text)
  }
  const verb = values['dry-run'] ? 'would rewrite' : 'rewrote'
  const table = (title, byFolder) => {
    const out = []
    for (const [folder, counts] of byFolder) {
      if (!counts.size) continue
      out.push(`${folder}  (${[...counts.values()].reduce((a, b) => a + b, 0)})`)
      for (const [key, count] of [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, values.list ? 12 : 40)) out.push(`  ${String(count).padStart(6)}  ${key}`)
    }
    return out.length ? `${title}\n${out.join('\n')}\n` : ''
  }
  console.log(`${table(`${verb}, per family per folder`, done)}${table('left for a hand edit (counted, not touched)', leftBy)}${values.list ? `\n${lines.join('\n')}\n` : ''}${verb} ${changed} file(s); ${allowed} site(s) allowed by youj-allow, gradient stops and shadow colors not counted`)
}

if (import.meta.url === `file://${process.argv[1]}`) main()
