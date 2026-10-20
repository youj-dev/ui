/* Docs site only: the pure half of the Code entrance (./code.ts). `shapeCode` trims a demo's source to what reads well
 * in a small editor panel (imports and long non-JSX blocks fold to one "⋯" line), and `mapParts` decides which line
 * of it each part of the demo compiles with: by component name (FieldLabel ↔ data-slot=field-label), icon name
 * (ShareIcon ↔ data-icon=share), tag, role and text. A part no line names compiles with its nearest neighbour in the
 * build order (the runtime's). No DOM here, so it is tested on its own (./code-map.test.ts). */

/** A shown line: one of the source's (by index; with `tail`, a block folded in place: its opening line, "⋯" and its
 *  closing line), or a fold standing for the lines it hides. */
export type Shown = { src: number; tail?: number } | { fold: string; indent: number }

/** A shown line's text, a fold's as "" (it names no part). */
export const shownText = (raw: string[], s: Shown) => ('src' in s ? (s.tail === undefined ? raw[s.src]! : `${raw[s.src]!} ⋯ ${raw[s.tail]!.trim()}`) : '')

/** Folding stops once the shown code is at most this long. */
const MAX_LINES = 44
const MAX_CHARS = 1500

const IMPORT_END = /\bfrom\s*['"]|^\s*import\s*['"]|^\s*import\s[^{]*$/

/** What a line holds after stripping strings, template literals and comments: its brackets' net depth change. */
function depthChange(line: string, state: { quote: string | null; comment: boolean }) {
  let d = 0
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!
    if (state.comment) {
      if (c === '*' && line[i + 1] === '/') {
        state.comment = false
        i++
      }
      continue
    }
    if (state.quote) {
      if (c === '\\') i++
      else if (c === state.quote) state.quote = null
      continue
    }
    if (c === '/' && line[i + 1] === '/') break
    if (c === '/' && line[i + 1] === '*') {
      state.comment = true
      i++
    } else if (c === '"' || c === "'" || c === '`') state.quote = c
    else if (c === '{' || c === '[' || c === '(') d++
    else if (c === '}' || c === ']' || c === ')') d--
  }
  // a quote doesn't run past the end of a line, but a template literal can
  if (state.quote && state.quote !== '`') state.quote = null
  return d
}

/** Whether a line writes JSX: a tag at its start, or one opened after `(`, `{`, `return`, `=>`, `?`, `:` or `&&`. */
export const hasJsx = (line: string) => /^\s*<\/?[A-Za-z>]/.test(line) || /(?:[({?:]|=>|&&|\|\||\breturn)\s*<[A-Za-z]/.test(line)

/** The source as the panel shows it: no directive or imports (one fold instead), runs of blank lines as one, and
 *  blocks without JSX (data, handlers) longer than a threshold folded, tighter until it fits. */
export function shapeCode(code: string): Shown[] {
  const raw = code.replace(/\r/g, '').split('\n')
  let i = 0
  let imports = 0
  // the directive, imports and the blank lines among them
  while (i < raw.length) {
    const t = raw[i]!.trim()
    if (!t || /^['"]use (client|server)['"];?$/.test(t)) {
      i++
      continue
    }
    if (!/^import\b/.test(t)) break
    imports++
    while (i < raw.length && !IMPORT_END.test(raw[i]!)) i++
    i++
  }
  // the trailing re-exports say nothing about what's drawn
  let end = raw.length
  while (end > i && (!raw[end - 1]!.trim() || /^export\s+(type\s+)?\{[^}]*\};?$/.test(raw[end - 1]!.trim()))) end--
  const body: number[] = []
  for (let k = i; k < end; k++) {
    if (!raw[k]!.trim() && (!body.length || !raw[body[body.length - 1]!]!.trim())) continue
    body.push(k)
  }

  // every block a line opens and doesn't close: [opening line, closing line] in `body` positions
  const state = { quote: null as string | null, comment: false }
  const depthAt: number[] = []
  let depth = 0
  for (const k of body) {
    depthAt.push(depth)
    depth += depthChange(raw[k]!, state)
  }
  depthAt.push(depth)
  const blocks: [number, number][] = []
  for (let a = 0; a < body.length; a++) {
    if (depthAt[a + 1]! <= depthAt[a]!) continue
    let b = a + 1
    while (b < body.length && depthAt[b + 1]! > depthAt[a]!) b++
    if (b < body.length && b - a > 1) blocks.push([a, b])
  }
  const jsxIn = (a: number, b: number) => body.slice(a + 1, b).some((k) => hasJsx(raw[k]!))
  // a handler written in a JSX prop (`onInvite={async () => {`) folds at any length
  const prop = (a: number) => /^\s*[\w-]+=\{/.test(raw[body[a]!]!)
  // a comment of more than one line folds to one
  const comments: [number, number][] = []
  for (let a = 0; a < body.length; a++) {
    const t = raw[body[a]!]!.trim()
    let b = a
    if (t.startsWith('/*') && !t.includes('*/')) while (b + 1 < body.length && !raw[body[b]!]!.includes('*/')) b++
    else if (t.startsWith('//')) while (b + 1 < body.length && raw[body[b + 1]!]!.trim().startsWith('//')) b++
    if (b > a) comments.push([a, b])
    a = b
  }

  const build = (threshold: number): Shown[] => {
    const out: Shown[] = imports ? [{ fold: imports === 1 ? 'import' : `${imports} imports`, indent: 0 }] : []
    let a = 0
    while (a < body.length) {
      const note = comments.find(([s]) => s === a)
      if (note) {
        out.push({ fold: 'comment', indent: raw[body[a]!]!.match(/^\s*/)![0].length })
        a = note[1] + 1
        continue
      }
      const block = blocks.find(([s, e]) => s === a && e - s - 1 > (prop(s) ? 1 : threshold) && !jsxIn(s, e))
      if (block) {
        // folded in place, as an editor does: `onInvite={async () => { ⋯ }}`
        out.push({ src: body[a]!, tail: body[block[1]]! })
        a = block[1] + 1
        continue
      }
      out.push({ src: body[a]! })
      a++
    }
    return out
  }
  const size = (s: Shown[]) => ({ lines: s.length, chars: s.reduce((n, x) => n + ('src' in x ? shownText(raw, x).trim().length : 6), 0) })
  let shown = build(3)
  for (const threshold of [2, 1]) {
    const { lines, chars } = size(shown)
    if (lines <= MAX_LINES && chars <= MAX_CHARS) break
    shown = build(threshold)
  }
  return shown
}

// ─── which line each part compiles with ───

/** A part of the demo, as the mapping sees it (./code.ts reads these off the DOM). */
export interface PartInfo {
  /** Its own data-slot, then its ancestors' up to the demo (nearest first); '' where one has none. */
  slots: string[]
  /** Its tag, lower case. */
  tag: string
  role?: string
  /** An icon's name (`data-icon`). */
  icon?: string
  /** The text it shows (a heading, a label, a field's placeholder). */
  text?: string
  /** A text that names it only weakly (a button's label: its tag says more). */
  weakText?: boolean
}

type LineFacts = { keys: string[]; icons: string[]; texts: string[]; literals: string[]; tagged: boolean }

/** `FieldLabel` → `field-label`, `Card.Header` → `card-header`. */
export const kebab = (name: string) =>
  name
    .replace(/\./g, '-')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()

const norm = (s: string) => s.replace(/\s+/g, ' ').trim()

function facts(line: string): LineFacts {
  const tags = [...line.matchAll(/(?<![\w$.])<([A-Za-z][\w.]*)/g)].map((m) => m[1]!)
  const keys = tags.map(kebab)
  const icons = tags.filter((t) => /Icon$/.test(t)).map((t) => kebab(t.replace(/Icon$/, '')))
  const texts = [...line.matchAll(/>([^<>{}]+)</g)].map((m) => norm(m[1]!)).filter(Boolean)
  // a line of bare text inside JSX (`Share`), or what follows a tag that closes on this line (`<b>Share`)
  const bare = line.trim()
  if (bare && !/[<>{}()=;,'"`]/.test(bare) && !/^(return|const|let|var|export|function|if|else)\b/.test(bare)) texts.push(norm(bare))
  const tail = /^\s*<[^>]*>([^<>{}]+)$/.exec(line)?.[1]
  if (tail) texts.push(norm(tail))
  const head = /^([^<>{}=]+)<\//.exec(line.trim())?.[1]
  if (head) texts.push(norm(head))
  const literals = [...line.matchAll(/(["'`])((?:(?!\1)[^\\]|\\.){2,}?)\1/g)].map((m) => norm(m[2]!))
  return { keys, icons, texts, literals, tagged: tags.length > 0 }
}

/** How well a line names a part, and the name it was matched by. */
function score(p: PartInfo, f: LineFacts): [number, string] {
  let best: [number, string] = [0, '']
  const take = (s: number, key: string) => {
    if (s > best[0]) best = [s, key]
  }
  const text = p.text ? norm(p.text) : ''
  if (text) {
    const strong = p.weakText ? 5 : 12
    if (f.texts.includes(text)) take(strong, `text:${text}`)
    else if (f.literals.includes(text)) take(p.weakText ? 4 : f.tagged ? 9 : 5, `text:${text}`)
    else if (text.length >= 4 && f.texts.some((t) => t.length >= 4 && (text.startsWith(t) || t.startsWith(text)))) take(p.weakText ? 3 : 7, `text:${text}`)
  }
  if (p.icon && f.icons.includes(p.icon)) take(10, `icon:${p.icon}`)
  const own = p.slots[0]
  for (const key of f.keys) {
    if (own && key === own) take(10, key)
    if (!own)
      p.slots.slice(1).forEach((s, i) => {
        if (s && s === key) take(Math.max(3, 6 - i), key)
      })
    if (key === p.tag) take(6, key)
    if (p.role && key === p.role) take(5, key)
  }
  if (p.tag === 'svg' && !p.icon && f.icons.length) take(4, `icon:${f.icons[0]}`)
  return best
}

/** The line (an index into `lines`) each part compiles with, parts in build order. A name several lines share is dealt
 *  out in order (the second <Button> line gets the second button); more parts than lines (a `.map`) share them in
 *  runs. A part no line names takes its nearest named neighbour's line, the one before it first. */
export function mapParts(lines: string[], parts: PartInfo[]): number[] {
  const F = lines.map(facts)
  const best = parts.map((p) => {
    let top = 0
    let key = ''
    const at: number[] = []
    F.forEach((f, li) => {
      const [s, k] = score(p, f)
      if (s > top) {
        top = s
        key = k
        at.length = 0
      }
      if (s === top && s > 0 && k === key) at.push(li)
    })
    return top >= 3 ? { key: `${top}|${key}`, at } : null
  })
  const out = parts.map(() => -1)
  const groups = new Map<string, number[]>()
  best.forEach((b, i) => {
    if (b) groups.set(b.key, [...(groups.get(b.key) ?? []), i])
  })
  for (const members of groups.values()) {
    const at = best[members[0]!]!.at
    members.forEach((pi, k) => {
      out[pi] = members.length <= at.length ? at[k]! : at[Math.floor((k * at.length) / members.length)]!
    })
  }
  // the unnamed, in runs: a run takes the line of the named part before it (else the first line with a tag) and
  // the written lines after it, up to the next line that names a part, one part after another (a wrapper's
  // `<SignInForm` and its props deal out the form it draws, field by field)
  const used = new Set(out.filter((l) => l >= 0))
  const firstTag = Math.max(0, F.findIndex((f) => f.tagged))
  const written = (l: number) => {
    const t = lines[l]!.trim()
    return t !== '' && !/^[)}\]>/]/.test(t) && !/^<\//.test(t)
  }
  let i = 0
  while (i < parts.length) {
    if (out[i]! >= 0) {
      i++
      continue
    }
    let j = i
    while (j < parts.length && out[j]! < 0) j++
    let before = -1
    for (let k = i - 1; k >= 0 && before < 0; k--) before = out[k]!
    const from = before >= 0 ? before : firstTag
    const pool = [from]
    for (let l = from + 1; l < lines.length && !used.has(l); l++) if (written(l)) pool.push(l)
    const m = j - i
    for (let k = 0; k < m; k++) out[i + k] = pool[Math.floor((k * pool.length) / m)]!
    i = j
  }
  return out

}
