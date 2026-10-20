import type { ReactNode } from 'react'
import { ChevronsUpDownIcon } from '@youj/icons/components/youj/icons/chevrons-up-down'
import { cn } from '../../../lib/utils'
import { highlight, type CodeToken } from '../code-block/code-block-highlight'
import { tokenClass } from '../code-block/code-block'
import type { DiffLine, DiffMark, DiffRow } from './diff-viewer-diff'

/* DiffViewer's rows: what the table shows (lines, folded runs of unchanged
 * lines, a patch's hunk headers) in either view, and how one line is drawn
 * (its syntax tokens cut at the marks of what changed inside it). */

export type DiffView = 'unified' | 'split'

/** One table row: a line (unified), a pair of lines (split), a fold or a hunk header. Changes count from 0. */
export type DiffItem =
  | { kind: 'line'; line: DiffLine; change?: number }
  | { kind: 'pair'; before?: DiffLine; after?: DiffLine; change?: number }
  | { kind: 'fold'; start: number; count: number }
  | { kind: 'gap'; header: string }

const FOLD_MIN = 4

/** The visible rows: runs of unchanged lines longer than `context` on each side of a change fold, unless opened. */
export function buildItems(rows: DiffRow[], view: DiffView, context: number, open: ReadonlySet<number>): { items: DiffItem[]; changes: number } {
  const items: DiffItem[] = []
  let changes = 0
  let i = 0
  while (i < rows.length) {
    const row = rows[i]!
    if (row.type === 'gap') {
      items.push({ kind: 'gap', header: row.header })
      i++
    } else if (row.type === 'context') {
      let end = i
      while (end < rows.length && rows[end]!.type === 'context') end++
      const lead = i === 0 || rows[i - 1]!.type === 'gap'
      const trail = end === rows.length || rows[end]!.type === 'gap'
      const from = lead ? i : i + context
      const to = trail ? end : end - context
      const fold = !open.has(i) && to - from >= FOLD_MIN
      for (let r = i; r < end; r++) {
        if (fold && r === from) items.push({ kind: 'fold', start: i, count: to - from })
        if (fold && r >= from && r < to) continue
        const line = rows[r] as DiffLine
        items.push(view === 'split' ? { kind: 'pair', before: line, after: line } : { kind: 'line', line })
      }
      i = end
    } else {
      const change = changes++
      const dels: DiffLine[] = []
      const adds: DiffLine[] = []
      while (i < rows.length && rows[i]!.type === 'del') dels.push(rows[i++] as DiffLine)
      while (i < rows.length && rows[i]!.type === 'add') adds.push(rows[i++] as DiffLine)
      if (view === 'split') {
        for (let p = 0; p < Math.max(dels.length, adds.length); p++)
          items.push({ kind: 'pair', before: dels[p], after: adds[p], ...(p === 0 && { change }) })
      } else [...dels, ...adds].forEach((line, p) => items.push({ kind: 'line', line, ...(p === 0 && { change }) }))
    }
  }
  return { items, changes }
}

/** Highlights each side as one text, so a comment or string spanning lines colors right, then hands each line its tokens. */
export function highlightRows(rows: DiffRow[], language: string): Map<DiffLine, CodeToken[]> {
  const out = new Map<DiffLine, CodeToken[]>()
  for (const side of ['old', 'new'] as const) {
    const lines = rows.filter((r): r is DiffLine => r.type !== 'gap' && (side === 'old' ? r.type === 'del' : r.type !== 'del'))
    const tokenLines = splitTokens(highlight(lines.map((l) => l.text).join('\n'), language))
    lines.forEach((line, i) => out.set(line, tokenLines[i] ?? [{ text: line.text }]))
  }
  return out
}

function splitTokens(tokens: CodeToken[]): CodeToken[][] {
  const lines: CodeToken[][] = [[]]
  for (const token of tokens) {
    token.text.split('\n').forEach((part, i) => {
      if (i > 0) lines.push([])
      if (part) lines.at(-1)!.push({ text: part, kind: token.kind })
    })
  }
  return lines
}

/** A line's tokens, cut where a mark of what changed inside it starts or ends. */
export function LineCode({ tokens, marks, tone }: { tokens: CodeToken[]; marks?: DiffMark[]; tone: 'add' | 'del' }) {
  const out: ReactNode[] = []
  let at = 0
  let m = 0
  tokens.forEach((token, t) => {
    let start = 0
    while (start < token.text.length) {
      while (marks && m < marks.length && marks[m]![1] <= at + start) m++
      const mark = marks?.[m]
      const inside = !!mark && mark[0] <= at + start
      const stop = mark ? (inside ? mark[1] : mark[0]) - at : token.text.length
      const end = Math.min(token.text.length, Math.max(stop, start + 1))
      const text = token.text.slice(start, end)
      const key = `${t}-${start}`
      const span = token.kind ? (
        // The mark's tint is strong: token colors written for the row's own tint fall under 4.5:1 on it, so a marked word reads in plain text.
        <span key={key} className={inside ? 'own:text-fg' : tokenClass[token.kind]}>
          {text}
        </span>
      ) : (
        text
      )
      out.push(
        inside ? (
          <span
            key={key}
            data-slot="diff-viewer-mark"
            className={tone === 'add' ? 'own:bg-success-line' : 'own:bg-danger-line'}
          >
            {span}
          </span>
        ) : typeof span === 'string' ? (
          <span key={key}>{span}</span>
        ) : (
          span
        ),
      )
      start = end
    }
    at += token.text.length
  })
  return out
}

export function FoldRow({ label, colSpan, onOpen }: { label: string; colSpan: number; onOpen: () => void }) {
  return (
    <tr data-slot="diff-viewer-fold">
      <td colSpan={colSpan} className="own:p-0">
        <button
          type="button"
          aria-expanded={false}
          onClick={onOpen}
          className={cn(
            'own:flex h-7 w-full items-center gap-2 own:bg-band own:px-3 own:font-sans own:text-ui-xs own:text-fg-muted',
            'transition-[color,background-color] own:yj-duration-fast own:ease-standard own:hover:bg-hover own:hover:text-fg focus-ring',
          )}
        >
          <ChevronsUpDownIcon size={13} strokeWidth={1.75} />
          {label}
        </button>
      </td>
    </tr>
  )
}
