/* Evaluates the arithmetic ui.css derives its sizes with (radius and control
 * heights from the theme contract, the shadow colour's channels), so the kit
 * reads the formulas instead of copying their results: calc(), min(), max(),
 * clamp(), var() with fallbacks, + - * /, and px, rem, % and unitless numbers. */

type Value = { n: number; px: boolean }

/* The kit draws the library default: roomy at 100%. --yj-scale and --ui--compact
 * are declared in :root of youj.css and ui.css, but sources read the sizes
 * without those files' vars, so a missing one resolves to its :root value. */
const DEFAULTS: Record<string, string> = { 'yj-scale': '1', 'ui--compact': '0' }

/** Replaces var(--name, fallback) with the given values, innermost first. */
export function substitute(expr: string, vars: Record<string, string>): string {
  let out = expr
  for (let guard = 0; guard < 50; guard++) {
    const m = /var\(--([\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\)[^()]*)*))?\)/.exec(out)
    if (!m) return out
    const value = vars[m[1]!] ?? m[2]?.trim() ?? DEFAULTS[m[1]!]
    if (value === undefined) throw new Error(`css-math: --${m[1]} has no value in ${expr}`)
    out = out.slice(0, m.index) + value + out.slice(m.index + m[0].length)
  }
  throw new Error(`css-math: var() nesting too deep in ${expr}`)
}

const TOKEN = /\s*(?:(-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?)(rem|px|%)?|([a-z-]+)\(|([()+\-*/,]))/y

function tokenize(src: string): string[] {
  const tokens: string[] = []
  let at = 0
  while (!/^\s*$/.test(src.slice(at))) {
    TOKEN.lastIndex = at
    const m = TOKEN.exec(src)
    if (!m) throw new Error(`css-math: cannot read "${src.slice(at)}" in "${src}"`)
    if (m[1] !== undefined) tokens.push(m[2] === 'rem' ? `${Number(m[1]) * 16}px` : `${m[1]}${m[2] ?? ''}`)
    else if (m[3]) tokens.push(`${m[3]}(`)
    else tokens.push(m[4]!)
    at = TOKEN.lastIndex
  }
  return tokens
}

/** A CSS length in px, or a plain number when the expression has no unit. */
export function evalCss(expr: string, vars: Record<string, string> = {}): number {
  const src = substitute(expr, vars).trim()
  const tokens = tokenize(src)
  let i = 0
  const peek = () => tokens[i]
  const next = () => tokens[i++]
  const fail = (why: string): never => {
    throw new Error(`css-math: ${why} in "${src}"`)
  }
  const expect = (t: string) => {
    if (next() !== t) fail(`expected ${t}`)
  }

  const sum = (): Value => {
    let v = product()
    while (peek() === '+' || peek() === '-') {
      const sign = next() === '+' ? 1 : -1
      const r = product()
      if (v.px !== r.px && v.n !== 0 && r.n !== 0) fail('mixed units')
      v = { n: v.n + sign * r.n, px: v.px || r.px }
    }
    return v
  }
  const product = (): Value => {
    let v = unary()
    while (peek() === '*' || peek() === '/') {
      const op = next()
      const r = unary()
      if (op === '*') {
        if (v.px && r.px) fail('px * px')
        v = { n: v.n * r.n, px: v.px || r.px }
      } else {
        if (r.px) fail('division by a length')
        v = { n: v.n / r.n, px: v.px }
      }
    }
    return v
  }
  const unary = (): Value => {
    if (peek() !== '-') return primary()
    next()
    const v = unary()
    return { n: -v.n, px: v.px }
  }
  const args = (): Value[] => {
    const out = [sum()]
    while (peek() === ',') {
      next()
      out.push(sum())
    }
    expect(')')
    return out
  }
  const primary = (): Value => {
    const t = next() ?? fail('unexpected end')
    if (t === '(' || t === 'calc(') {
      const v = sum()
      expect(')')
      return v
    }
    if (t === 'min(' || t === 'max(') {
      const vs = args()
      const n = t === 'min(' ? Math.min(...vs.map((v) => v.n)) : Math.max(...vs.map((v) => v.n))
      return { n, px: vs.some((v) => v.px) }
    }
    if (t === 'clamp(') {
      const [lo, mid, hi] = args()
      if (!lo || !mid || !hi) return fail('clamp() takes three values')
      return { n: Math.min(Math.max(mid.n, lo.n), hi.n), px: mid.px || lo.px || hi.px }
    }
    const num = /^(-?[\d.]+(?:e-?\d+)?)(px|%)?$/.exec(t) ?? fail(`unexpected "${t}"`)
    if (num[2] === '%') return { n: Number(num[1]) / 100, px: false }
    return { n: Number(num[1]), px: num[2] === 'px' }
  }

  const v = sum()
  if (i !== tokens.length) fail('trailing input')
  return Math.round(v.n * 1e6) / 1e6
}
