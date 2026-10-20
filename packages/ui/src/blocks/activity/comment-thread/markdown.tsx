import { memo, useMemo, type ReactNode } from 'react'
import { cn } from '../../../lib/utils'
import { safeHref } from '../../../lib/safe-href'
import type { CommentThreadPerson } from './data'

/* Markdown-lite: what people actually type in comments, parsed into data and
 * rendered as React elements, so a comment can never inject markup (raw HTML
 * is text, and only http(s) and mailto URLs become links).
 *   **bold**  _italic_ or *italic*  ~~strike~~  `code`  [text](url)  bare URLs
 *   - lists  1. lists  > quotes  @handle mentions  line breaks
 * Emphasis needs a word boundary on both sides, so snake_case and 2*3*4 stay
 * text; a mention needs one before the @, so an email address stays text. */

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'strong' | 'em' | 'del'; children: Inline[] }
  | { type: 'code'; text: string }
  | { type: 'link'; href: string; children: Inline[] }
  | { type: 'mention'; handle: string }
  | { type: 'break' }

export type Block = { type: 'p' | 'quote'; children: Inline[] } | { type: 'list'; ordered: boolean; items: Inline[][] }

const WORD = /[\p{L}\p{N}_]/u
const isWord = (c: string | undefined) => c !== undefined && WORD.test(c)
const MENTION = /^@([\p{L}\p{N}._-]*[\p{L}\p{N}_])/u
const URL_AT = /^https?:\/\/[^\s<>]*[^\s<>.,;:!?'")\]]/

/** The closing `marker` of a run that opened at `from`, or -1: not after a space, and not inside a word when `boundary`. */
function closing(src: string, marker: string, from: number, boundary: boolean) {
  for (let end = src.indexOf(marker, from); end !== -1; end = src.indexOf(marker, end + 1)) {
    if (src[end - 1] !== ' ' && (!boundary || !isWord(src[end + marker.length]))) return end
  }
  return -1
}

export function parseInline(src: string): Inline[] {
  const out: Inline[] = []
  let text = ''
  const push = (node: Inline) => {
    if (text) out.push({ type: 'text', text })
    text = ''
    out.push(node)
  }
  let i = 0
  while (i < src.length) {
    const ch = src[i]!
    const rest = src.slice(i)
    if (ch === '`') {
      const end = src.indexOf('`', i + 1)
      if (end > i + 1) {
        push({ type: 'code', text: src.slice(i + 1, end) })
        i = end + 1
        continue
      }
    }
    const pair = rest.startsWith('**') ? '**' : rest.startsWith('~~') ? '~~' : null
    if (pair && src[i + 2] && src[i + 2] !== ' ') {
      const end = closing(src, pair, i + 2, false)
      if (end > i + 2) {
        push({ type: pair === '**' ? 'strong' : 'del', children: parseInline(src.slice(i + 2, end)) })
        i = end + 2
        continue
      }
    }
    if ((ch === '_' || ch === '*') && !isWord(src[i - 1]) && src[i + 1] && src[i + 1] !== ' ' && src[i + 1] !== ch) {
      const end = closing(src, ch, i + 1, true)
      if (end > i + 1) {
        push({ type: 'em', children: parseInline(src.slice(i + 1, end)) })
        i = end + 1
        continue
      }
    }
    if (ch === '[') {
      const link = /^\[([^\]\n]+)\]\(([^)\s]+)\)/.exec(rest)
      if (link) {
        const href = safeHref(link[2]!)
        if (href) push({ type: 'link', href, children: parseInline(link[1]!) })
        else text += link[1]
        i += link[0].length
        continue
      }
    }
    if (ch === 'h' && !isWord(src[i - 1])) {
      const url = URL_AT.exec(rest)
      const href = url && safeHref(url[0])
      if (url && href) {
        push({ type: 'link', href, children: [{ type: 'text', text: url[0] }] })
        i += url[0].length
        continue
      }
    }
    if (ch === '@' && !isWord(src[i - 1])) {
      const mention = MENTION.exec(rest)
      if (mention) {
        push({ type: 'mention', handle: mention[1]! })
        i += mention[0].length
        continue
      }
    }
    text += ch
    i++
  }
  if (text) out.push({ type: 'text', text })
  return out
}

/** Lines joined by breaks. */
const lines = (rows: string[]): Inline[] => rows.flatMap((row, i) => (i ? [{ type: 'break' } as Inline, ...parseInline(row)] : parseInline(row)))

export function parse(source: string): Block[] {
  const blocks: Block[] = []
  let paragraph: string[] = []
  let quote: string[] = []
  const flush = () => {
    if (paragraph.length) blocks.push({ type: 'p', children: lines(paragraph) })
    if (quote.length) blocks.push({ type: 'quote', children: lines(quote) })
    paragraph = []
    quote = []
  }
  for (const line of source.replace(/\r\n?/g, '\n').split('\n')) {
    const item = /^\s*(?:([-*•])|\d{1,3}[.)])\s+(.*)$/.exec(line)
    const quoted = /^\s*>\s?(.*)$/.exec(line)
    if (!line.trim()) flush()
    else if (item) {
      flush()
      const ordered = !item[1]
      const last = blocks[blocks.length - 1]
      if (last?.type === 'list' && last.ordered === ordered) last.items.push(parseInline(item[2]!))
      else blocks.push({ type: 'list', ordered, items: [parseInline(item[2]!)] })
    } else if (quoted) {
      if (paragraph.length) flush()
      quote.push(quoted[1]!)
    } else {
      if (quote.length) flush()
      paragraph.push(line)
    }
  }
  flush()
  return blocks
}

export type PeopleByHandle = Map<string, CommentThreadPerson>
export const handleOf = (person: CommentThreadPerson) => person.handle ?? person.id
export const peopleByHandle = (people: readonly CommentThreadPerson[]): PeopleByHandle => new Map(people.map((p) => [handleOf(p).toLowerCase(), p]))

/** The ids of the people a comment mentions, in order, once each. */
export function mentionIds(source: string, people: PeopleByHandle): string[] {
  const ids: string[] = []
  const visit = (nodes: Inline[]) => {
    for (const node of nodes) {
      if (node.type === 'mention') {
        const id = people.get(node.handle.toLowerCase())?.id
        if (id && !ids.includes(id)) ids.push(id)
      } else if ('children' in node) visit(node.children)
    }
  }
  for (const block of parse(source)) {
    if (block.type === 'list') block.items.forEach(visit)
    else visit(block.children)
  }
  return ids
}

/** The comment as plain text, mentions by name: for previews and announcements. */
export function plainText(source: string, people: PeopleByHandle): string {
  const flat = (nodes: Inline[]): string =>
    nodes
      .map((n) =>
        n.type === 'text' || n.type === 'code'
          ? n.text
          : n.type === 'mention'
            ? `@${people.get(n.handle.toLowerCase())?.name ?? n.handle}`
            : n.type === 'break'
              ? ' '
              : flat(n.children),
      )
      .join('')
  return parse(source)
    .map((b) => (b.type === 'list' ? b.items.map(flat).join(', ') : flat(b.children)))
    .join(' ')
}

function render(nodes: Inline[], people: PeopleByHandle, me: string | undefined): ReactNode[] {
  return nodes.map((node, i) => {
    switch (node.type) {
      case 'text':
        return node.text
      case 'break':
        return <br key={i} />
      case 'code':
        return (
          <code key={i} className="rounded-sm border border-line-subtle bg-well px-1 font-mono text-[0.9em] text-fg">
            {node.text}
          </code>
        )
      case 'strong':
        return (
          <strong key={i} className="font-semibold text-fg">
            {render(node.children, people, me)}
          </strong>
        )
      case 'em':
        return <em key={i}>{render(node.children, people, me)}</em>
      case 'del':
        return (
          <del key={i} className="text-fg-muted">
            {render(node.children, people, me)}
          </del>
        )
      case 'link':
        return (
          <a
            key={i}
            href={node.href}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-xs font-medium text-accent-text underline decoration-accent-line underline-offset-2 transition-colors yj-duration-fast ease-standard hover:decoration-current focus-ring"
          >
            {render(node.children, people, me)}
          </a>
        )
      case 'mention': {
        const person = people.get(node.handle.toLowerCase())
        if (!person) return `@${node.handle}`
        const mine = person.id === me
        return (
          <span
            key={i}
            data-slot="mention"
            data-yj-me={mine || undefined}
            title={`@${handleOf(person)}`}
            // Yours light up like a highlighter; anyone else's is a quiet chip, so it reads in any accent.
            className={cn('rounded-sm px-0.5 font-medium whitespace-nowrap', mine ? 'bg-warning-subtle text-warning-text' : 'bg-hover text-fg')}
          >
            @{person.name}
          </span>
        )
      }
    }
  })
}

/** A comment's body, rendered from its markdown-lite. */
export const CommentBody = memo(function CommentBody({
  source,
  people,
  me,
  clamp,
  className,
}: {
  source: string
  people: PeopleByHandle
  me?: string
  /** Three lines at most, the rest cut with an ellipsis (a comment in a compact list). */
  clamp?: boolean
  className?: string
}) {
  const blocks = useMemo(() => parse(source), [source])
  return (
    <div
      data-slot="comment-body"
      className={cn(
        'text-ui leading-relaxed text-fg [overflow-wrap:anywhere]',
        clamp ? 'line-clamp-3 [&>*+*]:mt-1.5' : 'flex flex-col gap-1.5',
        className,
      )}
    >
      {blocks.map((block, i) =>
        block.type === 'list' ? (
          (() => {
            const List = block.ordered ? 'ol' : 'ul'
            return (
              <List key={i} className={cn('flex flex-col gap-0.5 ps-5 marker:text-fg-subtle', block.ordered ? 'list-decimal' : 'list-disc')}>
                {block.items.map((item, j) => (
                  <li key={j}>{render(item, people, me)}</li>
                ))}
              </List>
            )
          })()
        ) : block.type === 'quote' ? (
          <blockquote key={i} className="border-s-2 border-line ps-3 text-fg-muted">
            {render(block.children, people, me)}
          </blockquote>
        ) : (
          <p key={i}>{render(block.children, people, me)}</p>
        ),
      )}
    </div>
  )
})
