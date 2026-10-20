/* The markdown chat needs, parsed into plain data, never into HTML: the
 * renderer turns this tree into React elements, so text is always text and
 * nothing in a model's answer can inject markup. The subset: paragraphs,
 * headings, lists (nested, ordered or not), fenced code, blockquotes, GFM
 * tables and rules; inline code, strong, emphasis, strikethrough, links,
 * autolinks and numbered citations ([1]). Raw HTML stays literal text,
 * images become links, and a link is only a link when its URL is http(s) or
 * mailto.
 *
 * It is built for text that is still arriving. With `streaming`, the parser
 * holds back a last line that can't be read yet (a lone "-", "#", "``" or
 * "|", which a few more characters will turn into a list, a heading, a fence
 * or a table), and inline syntax at the tail is closed optimistically:
 * "**bol" is already bold, an unclosed fence is already code. So nothing
 * flickers from raw syntax into formatting as the answer streams in. */
import { safeHref } from '../../../lib/safe-href'


export type ChatMarkdownAlign = 'left' | 'center' | 'right' | null

export type MarkdownBlock =
  | { type: 'paragraph'; raw: string; text: string }
  | { type: 'heading'; raw: string; level: number; text: string }
  | { type: 'code'; raw: string; lang: string; code: string; closed: boolean }
  | { type: 'quote'; raw: string; blocks: MarkdownBlock[] }
  | { type: 'list'; raw: string; ordered: boolean; start: number; loose: boolean; items: MarkdownBlock[][] }
  | { type: 'table'; raw: string; align: ChatMarkdownAlign[]; header: string[]; rows: string[][] }
  | { type: 'rule'; raw: string }

export type MarkdownInline =
  /** `at` is the text's offset in its block, a stable key while the block grows. */
  | { type: 'text'; text: string; at: number }
  | { type: 'code'; text: string }
  | { type: 'strong' | 'em' | 'del'; children: MarkdownInline[] }
  /** `href` is null for an unsafe URL or one still streaming: the label renders as text. */
  | { type: 'link'; href: string | null; children: MarkdownInline[] }
  | { type: 'cite'; index: number }
  | { type: 'break' }

/* ── Blocks ─────────────────────────────────────────────────────────────── */

const FENCE = /^( {0,3})(`{3,}|~{3,})[ \t]*([^\s`]*)[^`]*$/
const FENCE_CLOSE = /^ {0,3}(`{3,}|~{3,})[ \t]*$/
const HEADING = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/
const RULE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/
const QUOTE = /^ {0,3}>[ \t]?/
const BULLET = /^( {0,3})([-*+])(?:([ \t]+)|$)/
const ORDERED = /^( {0,3})(\d{1,9})([.)])(?:([ \t]+)|$)/
const DELIMITER = /^[ \t]*\|?[ \t]*:?-+:?[ \t]*(?:\|[ \t]*:?-+:?[ \t]*)*\|?[ \t]*$/
/** A delimiter row still being typed. */
const PARTIAL_DELIMITER = /^[ \t]*\|?[ \t:|-]*$/
/** A last line that a few more characters will turn into structure. */
const PENDING = /^ {0,3}(?:[-*+>#]|\d{1,9}[.)]?|`{1,2}|~{1,2}|[-*_]{2}|[-*_] [-*_])[ \t]*$/

const isBlank = (line: string) => /^[ \t]*$/.test(line)
const indentOf = (line: string) => /^ */.exec(line)![0].length

interface ListMarker {
  indent: number
  ordered: boolean
  start: number
  /** Where the item's content starts. */
  width: number
}

function listMarker(line: string): ListMarker | null {
  const bullet = BULLET.exec(line)
  if (bullet) {
    const gap = bullet[3]?.length ?? 1
    return { indent: bullet[1]!.length, ordered: false, start: 1, width: bullet[1]!.length + 1 + (gap > 4 ? 1 : gap) }
  }
  const ordered = ORDERED.exec(line)
  if (ordered) {
    const gap = ordered[4]?.length ?? 1
    const marker = ordered[2]!.length + 1
    return { indent: ordered[1]!.length, ordered: true, start: Number(ordered[2]), width: ordered[1]!.length + marker + (gap > 4 ? 1 : gap) }
  }
  return null
}

/** Cells of a table row: outer pipes dropped, `\|` kept as a pipe. */
export function splitRow(line: string): string[] {
  let row = line.trim()
  if (row.startsWith('|')) row = row.slice(1)
  if (row.endsWith('|') && !row.endsWith('\\|')) row = row.slice(0, -1)
  const cells: string[] = []
  let cell = ''
  for (let i = 0; i < row.length; i++) {
    if (row[i] === '\\' && row[i + 1] === '|') {
      cell += '|'
      i++
    } else if (row[i] === '|') {
      cells.push(cell.trim())
      cell = ''
    } else cell += row[i]
  }
  cells.push(cell.trim())
  return cells
}

function alignOf(cell: string): ChatMarkdownAlign {
  const left = cell.startsWith(':')
  const right = cell.endsWith(':') && cell.length > 1
  return left && right ? 'center' : right ? 'right' : left ? 'left' : null
}

/** A header row followed by its delimiter row (or, at a streaming tail, the start of one). */
function tableAt(lines: string[], i: number, tail: boolean): boolean {
  const head = lines[i]!
  const next = lines[i + 1]
  if (!head.includes('|') || next === undefined) return false
  if (DELIMITER.test(next) && splitRow(next).length === splitRow(head).length) return true
  return tail && i + 2 === lines.length && PARTIAL_DELIMITER.test(next) && /[-:]/.test(next)
}

/** Lines that end a paragraph without a blank line between. */
function interrupts(lines: string[], i: number, tail: boolean): boolean {
  const line = lines[i]!
  if (FENCE.test(line) || HEADING.test(line) || RULE.test(line) || QUOTE.test(line)) return true
  const marker = listMarker(line)
  // As in CommonMark, an ordered list only interrupts a paragraph when it starts at 1.
  if (marker && !isBlank(line.slice(marker.width)) && (!marker.ordered || marker.start === 1)) return true
  return tableAt(lines, i, tail)
}

/** While streaming, holds back a last line that can't be read yet. */
function holdPendingTail(lines: string[]): string[] {
  let last = lines.length - 1
  while (last >= 0 && isBlank(lines[last]!)) last--
  if (last < 0) return lines
  // "-", "1.", "#", "``", "--": a marker, heading, fence or rule on its way.
  if (last === lines.length - 1 && PENDING.test(lines[last]!)) return lines.slice(0, last)
  // A first row of pipes may be a table's header: wait for its delimiter row,
  // rather than show it as a paragraph that then turns into a table.
  if (/^[ \t]*\|/.test(lines[last]!) && (last === 0 || !lines[last - 1]!.includes('|'))) return lines.slice(0, last)
  return lines
}

const normalizeLine = (line: string) => line.replace(/^\t+/, (tabs) => '    '.repeat(tabs.length))

const splitLines = (source: string) => source.replace(/\r\n?/g, '\n').split('\n').map(normalizeLine)

/** Parses markdown into blocks. `streaming` holds back an unreadable last line and lets the tail stay open. */
export function parseBlocks(source: string, streaming = false): MarkdownBlock[] {
  let lines = splitLines(source)
  if (streaming) lines = holdPendingTail(lines)
  return parseLines(lines, streaming)
}

/**
 * A parser for text that only grows, giving exactly what `parseBlocks` gives
 * at every step. A block ends where the next one starts, so a new token can
 * only change the last two blocks (the last one, and the one before it, which
 * the last line may have interrupted or joined). The rest are kept and the
 * parse resumes at the start of the second-to-last. `onParse` gets the number
 * of lines each call scans.
 */
export function createBlockParser(onParse?: (lines: number) => void) {
  let source = ''
  let streaming = false
  let lines: string[] = []
  let blocks: MarkdownBlock[] = []
  let starts: number[] = []

  return function parse(next: string, nextStreaming = false): MarkdownBlock[] {
    // Only a plain extension can reuse the last parse. Lone "\r" line ends keep it simple: those take the full path.
    const grew = source !== '' && nextStreaming === streaming && next.startsWith(source) && !next.includes('\r')
    if (grew) {
      if (next === source) return blocks
      const lastLine = source.lastIndexOf('\n') + 1
      lines = lines.slice(0, -1).concat(splitLines(next.slice(lastLine)))
    } else lines = splitLines(next)
    source = next
    streaming = nextStreaming
    const held = streaming ? holdPendingTail(lines) : lines
    const keep = grew && blocks.length > 2 ? blocks.length - 2 : 0
    const from = keep ? starts[keep]! : 0
    const nextStarts: number[] = keep ? starts.slice(0, keep) : []
    const tail: number[] = []
    blocks = (keep ? blocks.slice(0, keep) : []).concat(parseLines(held, streaming, from, tail))
    starts = nextStarts.concat(tail)
    onParse?.(held.length - from)
    return blocks
  }
}

function parseLines(lines: string[], tail: boolean, from = 0, starts?: number[]): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = []
  let i = from
  while (i < lines.length) {
    const line = lines[i]!
    if (isBlank(line)) {
      i++
      continue
    }
    const start = i
    starts?.push(start)
    const raw = () => lines.slice(start, i).join('\n')

    const fence = FENCE.exec(line)
    if (fence) {
      const indent = fence[1]!.length
      const marker = fence[2]!
      const body: string[] = []
      let closed = false
      for (i++; i < lines.length; i++) {
        const close = FENCE_CLOSE.exec(lines[i]!)
        if (close && close[1]![0] === marker[0] && close[1]!.length >= marker.length) {
          closed = true
          i++
          break
        }
        body.push(lines[i]!.slice(Math.min(indent, indentOf(lines[i]!))))
      }
      blocks.push({ type: 'code', raw: raw(), lang: fence[3]!.toLowerCase(), code: body.join('\n'), closed })
      continue
    }

    const heading = HEADING.exec(line)
    if (heading) {
      i++
      blocks.push({ type: 'heading', raw: raw(), level: heading[1]!.length, text: heading[2] ?? '' })
      continue
    }

    if (RULE.test(line)) {
      i++
      blocks.push({ type: 'rule', raw: raw() })
      continue
    }

    if (QUOTE.test(line)) {
      const body: string[] = []
      while (i < lines.length && !isBlank(lines[i]!)) {
        const current = lines[i]!
        if (QUOTE.test(current)) body.push(current.replace(QUOTE, ''))
        // A lazy continuation line carries on the quote's paragraph.
        else if (!interrupts(lines, i, false)) body.push(current)
        else break
        i++
      }
      blocks.push({ type: 'quote', raw: raw(), blocks: parseLines(body, tail && i >= lines.length) })
      continue
    }

    const marker = listMarker(line)
    if (marker) {
      const items: string[][] = []
      let item = [line.slice(marker.width)]
      let width = marker.width
      let loose = false
      for (i++; i < lines.length; ) {
        const current = lines[i]!
        if (isBlank(current)) {
          let next = i + 1
          while (next < lines.length && isBlank(lines[next]!)) next++
          if (next >= lines.length) break
          const sibling = listMarker(lines[next]!)
          if (indentOf(lines[next]!) >= width) {
            while (i < next) {
              item.push('')
              i++
            }
            continue
          }
          if (sibling && sibling.ordered === marker.ordered && sibling.indent < width) {
            loose = true
            i = next
            continue
          }
          break
        }
        const sibling = listMarker(current)
        if (sibling && sibling.ordered === marker.ordered && sibling.indent < width) {
          items.push(item)
          item = [current.slice(sibling.width)]
          width = sibling.width
        } else if (indentOf(current) >= width) {
          item.push(current.slice(width))
        } else if (!sibling && !interrupts(lines, i, false) && item.length > 0 && !isBlank(item[item.length - 1]!)) {
          // Lazy continuation of the item's paragraph.
          item.push(current.trim())
        } else break
        i++
      }
      items.push(item)
      const atTail = tail && i >= lines.length
      blocks.push({
        type: 'list',
        raw: raw(),
        ordered: marker.ordered,
        start: marker.start,
        loose,
        items: items.map((lines, index) => parseLines(lines, atTail && index === items.length - 1)),
      })
      continue
    }

    if (tableAt(lines, i, tail)) {
      const header = splitRow(line)
      const delimiter = splitRow(lines[i + 1]!)
      const align = header.map((_, column) => alignOf(delimiter[column] ?? ''))
      const rows: string[][] = []
      for (i += 2; i < lines.length && !isBlank(lines[i]!) && lines[i]!.includes('|'); i++) {
        const cells = splitRow(lines[i]!)
        rows.push(header.map((_, column) => cells[column] ?? ''))
      }
      blocks.push({ type: 'table', raw: raw(), align, header, rows })
      continue
    }

    const body = [line.trim()]
    for (i++; i < lines.length && !isBlank(lines[i]!) && !interrupts(lines, i, tail); i++) body.push(lines[i]!.trim())
    blocks.push({ type: 'paragraph', raw: raw(), text: body.join('\n') })
  }
  return blocks
}

/* ── Inlines ────────────────────────────────────────────────────────────── */

const ESCAPABLE = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/
const WORD = /[\p{L}\p{N}]/u

/** The length of the run of `char` at `i`. */
function runAt(s: string, i: number, char: string, to: number): number {
  let n = 0
  while (i + n < to && s[i + n] === char) n++
  return n
}

/** Where the next run of exactly `length` backticks starts, or -1. */
function closingTicks(s: string, from: number, length: number, to: number): number {
  for (let i = from; i < to; ) {
    if (s[i] !== '`') {
      i++
      continue
    }
    const n = runAt(s, i, '`', to)
    if (n === length) return i
    i += n
  }
  return -1
}

/** A trailing run of formatting characters that has nothing to format yet. */
function dropDanglingTail(s: string): string {
  return s.replace(/(^|[\s([{])(?:[*_~`]{1,3}|!?\[)$/, '$1')
}

interface Parsed {
  node: MarkdownInline
  end: number
}

/**
 * Parses inline markdown. With `tail`, the text is the end of a stream:
 * unclosed code, emphasis and links close at the end instead of showing
 * their syntax.
 */
export function parseInline(source: string, tail = false): MarkdownInline[] {
  const s = tail ? dropDanglingTail(source) : source
  return inline(s, 0, s.length, tail)
}

function inline(s: string, from: number, to: number, tail: boolean): MarkdownInline[] {
  const out: MarkdownInline[] = []
  let text = ''
  let at = from
  const push = (chunk: string, position: number) => {
    if (!text) at = position
    text += chunk
  }
  const flush = () => {
    if (text) out.push({ type: 'text', text, at })
    text = ''
  }
  const emit = (parsed: Parsed) => {
    flush()
    out.push(parsed.node)
    return parsed.end
  }

  let i = from
  while (i < to) {
    const c = s[i]!
    if (c === '\\' && i + 1 < to && ESCAPABLE.test(s[i + 1]!)) {
      push(s[i + 1]!, i)
      i += 2
      continue
    }
    if (c === '\n') {
      // Chat text means its line breaks: every newline inside a paragraph is one.
      flush()
      out.push({ type: 'break' })
      i++
      continue
    }
    if (c === '`') {
      const n = runAt(s, i, '`', to)
      const close = closingTicks(s, i + n, n, to)
      if (close >= 0 || tail) {
        const body = s.slice(i + n, close >= 0 ? close : to)
        // One space of padding on both sides is syntax, so `` `x` `` can hold a backtick.
        const trimmed = body.length > 2 && body.startsWith(' ') && body.endsWith(' ') ? body.slice(1, -1) : body
        i = emit({ node: { type: 'code', text: trimmed.replace(/\n/g, ' ') }, end: close >= 0 ? close + n : to })
        continue
      }
      push(s.slice(i, i + n), i)
      i += n
      continue
    }
    if (c === '*' || c === '_' || c === '~') {
      const parsed = emphasis(s, i, to, tail)
      if (parsed) {
        i = emit(parsed)
        continue
      }
      const n = runAt(s, i, c, to)
      push(s.slice(i, i + n), i)
      i += n
      continue
    }
    if (c === '[' || (c === '!' && s[i + 1] === '[')) {
      const parsed = link(s, i, to, tail)
      if (parsed) {
        i = emit(parsed)
        continue
      }
    }
    if (c === '<') {
      const auto = /^<((?:https?:\/\/|mailto:)[^\s<>]+)>/i.exec(s.slice(i, to))
      if (auto) {
        const href = safeHref(auto[1]!)
        i = emit({ node: { type: 'link', href, children: [{ type: 'text', text: auto[1]!, at: i + 1 }] }, end: i + auto[0].length })
        continue
      }
    }
    if ((c === 'h' || c === 'H') && (i === from || /[\s(]/.test(s[i - 1]!))) {
      const bare = /^https?:\/\/[^\s<>"'`]+/i.exec(s.slice(i, to))
      if (bare) {
        const url = trimUrl(bare[0])
        i = emit({ node: { type: 'link', href: safeHref(url), children: [{ type: 'text', text: url, at: i }] }, end: i + url.length })
        continue
      }
    }
    push(c, i)
    i++
  }
  flush()
  return out
}

/** A bare URL ends before trailing punctuation, and before a ")" it didn't open. */
function trimUrl(url: string): string {
  let end = url.length
  while (end > 0) {
    const last = url[end - 1]!
    if (/[.,:;!?'"*_~]/.test(last)) end--
    else if (last === ')' && (url.slice(0, end).match(/\(/g)?.length ?? 0) < (url.slice(0, end).match(/\)/g)?.length ?? 0)) end--
    else break
  }
  return url.slice(0, end)
}

function emphasis(s: string, i: number, to: number, tail: boolean): Parsed | null {
  const c = s[i]!
  const run = runAt(s, i, c, to)
  if (c === '~' && run !== 2) return null
  // An opener is followed by something to format, and `_` never opens inside a word (snake_case).
  const next = s[i + run]
  if (next === undefined || /\s/.test(next)) return null
  if (c === '_' && i > 0 && WORD.test(s[i - 1]!)) return null
  const sizes = c === '~' ? [2] : run >= 3 ? [3, 2, 1] : run === 2 ? [2, 1] : [1]
  const make = (size: number, children: MarkdownInline[]): MarkdownInline =>
    c === '~'
      ? { type: 'del', children }
      : size === 3
        ? { type: 'strong', children: [{ type: 'em', children }] }
        : { type: size === 2 ? 'strong' : 'em', children }

  for (const size of sizes) {
    const close = closer(s, i + size, to, c, size)
    if (close !== null) return { node: make(size, inline(s, i + size, close, false)), end: close + size }
  }
  if (!tail) return null
  // The end of a stream: close it here, minus any closer that is half typed ("**bold*").
  const size = sizes[0]!
  let end = to
  while (end > i + size && s[end - 1] === c) end--
  if (end <= i + size) return null
  return { node: make(size, inline(s, i + size, end, true)), end: to }
}

/** Where the closing run for an opener of `size` starts, skipping code spans, links and nested emphasis. */
function closer(s: string, from: number, to: number, c: string, size: number): number | null {
  let j = from
  while (j < to) {
    const ch = s[j]!
    if (ch === '\\') {
      j += 2
      continue
    }
    if (ch === '`') {
      const n = runAt(s, j, '`', to)
      const close = closingTicks(s, j + n, n, to)
      j = close >= 0 ? close + n : j + n
      continue
    }
    if (ch === '[') {
      // A link's label is its own scope: `[a*b](…)` doesn't close emphasis outside it.
      const end = bracketEnd(s, j, to)
      if (end > 0) {
        j = end + 1
        continue
      }
    }
    if (ch !== c) {
      j++
      continue
    }
    const run = runAt(s, j, c, to)
    const before = s[j - 1] ?? ''
    const after = s[j + run]
    const canClose = j > from && !/\s/.test(before) && (c !== '_' || after === undefined || !WORD.test(after))
    if (canClose && run >= size) return j
    // A nested opener: skip past its own closer, so `*a **b** c*` closes at the last `*`.
    const canOpen = after !== undefined && !/\s/.test(after) && (c !== '_' || !WORD.test(before))
    if (canOpen) {
      const nested = Math.min(run, 3)
      const inner = closer(s, j + nested, to, c, nested)
      if (inner !== null) {
        j = inner + nested
        continue
      }
    }
    j += run
  }
  return null
}

/** The index of the `]` that closes the `[` at `i`, or -1. */
function bracketEnd(s: string, i: number, to: number): number {
  let depth = 0
  for (let j = i; j < to; j++) {
    const ch = s[j]
    if (ch === '\\') {
      j++
      continue
    }
    if (ch === '`') {
      const n = runAt(s, j, '`', to)
      const close = closingTicks(s, j + n, n, to)
      if (close >= 0) j = close + n - 1
      continue
    }
    if (ch === '[') depth++
    else if (ch === ']' && --depth === 0) return j
  }
  return -1
}

function link(s: string, i: number, to: number, tail: boolean): Parsed | null {
  const image = s[i] === '!'
  const open = image ? i + 1 : i
  const close = bracketEnd(s, open, to)
  if (close < 0) {
    // Still streaming its label: show the label, not the bracket.
    if (!tail) return null
    return { node: { type: 'link', href: null, children: inline(s, open + 1, to, true) }, end: to }
  }
  const label = s.slice(open + 1, close)
  if (!image && /^\^?\d{1,3}$/.test(label) && s[close + 1] !== '(') {
    return { node: { type: 'cite', index: Number(label.replace('^', '')) }, end: close + 1 }
  }
  if (s[close + 1] !== '(') return null

  let j = close + 2
  let depth = 0
  let url = ''
  let done = false
  while (j < to) {
    const ch = s[j]!
    if (ch === '\\' && j + 1 < to) {
      url += s[j + 1]
      j += 2
      continue
    }
    if (ch === '(') depth++
    if (ch === ')') {
      if (depth === 0) {
        done = true
        break
      }
      depth--
    }
    if (/\s/.test(ch)) {
      // An optional "title" follows the URL.
      const title = /^\s+(?:"[^"]*"|'[^']*')?\s*\)/.exec(s.slice(j, to))
      if (!title) return null
      j += title[0].length - 1
      done = true
      break
    }
    url += ch
    j++
  }
  if (!done && !tail) return null
  const href = done ? safeHref(url.replace(/^<|>$/g, '')) : null
  const children: MarkdownInline[] = image
    ? [{ type: 'text', text: label || 'Image', at: open + 1 }]
    : inline(s, open + 1, close, false)
  return { node: { type: 'link', href, children }, end: done ? j + 1 : to }
}

/* ── Plain text ─────────────────────────────────────────────────────────── */

function inlineText(nodes: MarkdownInline[]): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case 'text':
        case 'code':
          return node.text
        case 'break':
          return '\n'
        case 'cite':
          return `[${node.index}]`
        default:
          return inlineText(node.children)
      }
    })
    .join('')
}

function blocksText(blocks: MarkdownBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'paragraph':
        case 'heading':
          return inlineText(parseInline(block.text))
        case 'code':
          return block.code
        case 'quote':
          return blocksText(block.blocks)
        case 'list':
          return block.items.map((item, index) => `${block.ordered ? `${block.start + index}.` : '•'} ${blocksText(item)}`).join('\n')
        case 'table':
          return [block.header, ...block.rows].map((row) => row.map((cell) => inlineText(parseInline(cell))).join(', ')).join('\n')
        case 'rule':
          return ''
      }
    })
    .filter(Boolean)
    .join('\n\n')
}

/** The text a reader hears: formatting dropped, link labels kept, lists and tables flattened. */
export function markdownToPlainText(source: string): string {
  return blocksText(parseBlocks(source))
}
