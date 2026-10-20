'use client'

import { createContext, memo, useContext, useMemo, useRef, type ComponentProps, type ReactNode } from 'react'
import { useYouj } from '@youj/core/lib/youj/provider'
import { useComponentLabels } from '@youj/core/labels'
import { chatMarkdownLabels } from '@youj/core/labels'
import { cn } from '../../../lib/utils'
import { CodeBlock as SharedCodeBlock } from '../code-block/code-block'
import { ScrollArea } from '../scroll-area'
import { ChatCitation, type ChatSource } from './chat-citation'
import { ChatCopyButton } from './chat-copy-button'
import { createBlockParser, parseInline, type ChatMarkdownAlign, type MarkdownBlock, type MarkdownInline } from './chat-markdown-parse'
import { ChatStyles } from './chat-styles'
import { useChatText, type ChatText } from './chat-text-stream'

/* Streamed markdown. The source is parsed into data (chat-markdown-parse)
 * and rendered as React elements, so a model's answer can never inject
 * markup: raw HTML is text, and only http(s) and mailto URLs become links.
 *
 * While `streaming`, each word surfaces as it arrives: it mounts with an
 * opacity of 0 and fades up on the slow token (@starting-style, so it plays
 * once and costs nothing after), and a caret marks where writing happens. The
 * caret holds solid while tokens flow and blinks only when the stream pauses.
 * Unfinished syntax renders optimistically (see the parser), so nothing
 * flickers from raw asterisks into bold.
 *
 * Performance: blocks are memoised by their source, so a token re-renders
 * only the block it lands in. Pass a ChatTextSource as `content` and a token
 * re-renders only this component, never the message or list around it.
 *
 * Reduced motion: no fades and no blink. The text is revealed in whole
 * sentences and lines rather than word by word, so the answer arrives in
 * calm chunks instead of a constant trickle. */

export interface ChatMarkdownProps extends Omit<ComponentProps<'div'>, 'children' | 'content'> {
  /** Markdown source: a string, or a ChatTextSource that streams it. */
  content: ChatText
  /** Still being written: words fade in, a caret marks the end, unfinished syntax renders optimistically. */
  streaming?: boolean
  /** Cut off (stopped, or failed part-way): the unfinished end still renders as it did while streaming, without the caret. */
  incomplete?: boolean
  /** Numbered citations: `[1]` in the text becomes a chip for `sources[0]`, previewed on hover. */
  sources?: ChatSource[]
  /**
   * The outline level of the message's top heading, whatever markdown level
   * the model used for it (models often start at `##`); deeper ones follow.
   * Default 2, for a chat under the page's h1.
   */
  headingLevel?: number
}

/** Reaches the citations inside memoised blocks without being part of their comparison. */
const SourcesContext = createContext<ChatSource[] | undefined>(undefined)

/** Added to a markdown heading's level to place it in the page's outline. */
const HeadingOffsetContext = createContext(0)

function topHeading(blocks: MarkdownBlock[]): number {
  let top = 7
  for (const block of blocks) {
    if (block.type === 'heading') top = Math.min(top, block.level)
    else if (block.type === 'quote') top = Math.min(top, topHeading(block.blocks))
    else if (block.type === 'list') for (const item of block.items) top = Math.min(top, topHeading(item))
  }
  return top
}

function Cite({ index }: { index: number }) {
  const source = useContext(SourcesContext)?.[index - 1]
  return source ? <ChatCitation index={index} source={source} /> : `[${index}]`
}

/** How far a reduced-motion reader sees a stream: up to the last finished sentence or line. */
export function revealedUnderReducedMotion(text: string): string {
  const boundary = /[\s\S]*(?:\n|[.!?;:](?=\s))/.exec(text)
  let end = boundary ? boundary[0].length : 0
  // A long run without punctuation still arrives, a phrase at a time.
  if (text.length - end > 240) end = Math.max(end, text.lastIndexOf(' ') + 1)
  return text.slice(0, end)
}

function ChatMarkdown({ content, streaming = false, incomplete = false, sources, headingLevel = 2, className, ...props }: ChatMarkdownProps) {
  const k = useYouj()
  const text = useChatText(content)
  const shown = streaming && k.reduced ? revealedUnderReducedMotion(text) : text
  // A stream still open, or one that was cut off: its last block may be half written.
  const open = streaming || incomplete
  const parser = useRef<ReturnType<typeof createBlockParser>>(null)
  const blocks = useMemo(() => (parser.current ??= createBlockParser())(shown, open), [shown, open])
  const animate = streaming && !k.reduced
  const last = blocks.length - 1
  const top = topHeading(blocks)
  const offset = top > 6 ? 0 : headingLevel - top
  return (
    <div
      data-slot="chat-markdown"
      data-streaming={streaming || undefined}
      data-reduced-motion={k.reduced || undefined}
      className={cn('own:flex min-w-0 flex-col gap-3 break-words', className)}
      {...props}
    >
      <ChatStyles />
      <SourcesContext.Provider value={sources}>
        <HeadingOffsetContext.Provider value={offset}>
          {blocks.map((block, index) => (
            <Block key={index} block={block} animate={animate} tail={open && index === last} caret={streaming && index === last ? shown.length : null} />
          ))}
        </HeadingOffsetContext.Provider>
      </SourcesContext.Provider>
      {streaming && blocks.length === 0 && (
        <p>
          <Caret key={shown.length} />
        </p>
      )}
    </div>
  )
}

/* ── Blocks ─────────────────────────────────────────────────────────────── */

interface BlockProps {
  block: MarkdownBlock
  /** Wrap words so they fade in as they mount. */
  animate: boolean
  /** The end of a stream: inline syntax closes optimistically. */
  tail: boolean
  /** Where the caret goes, keyed by the text length so its blink restarts with every token; null for none. */
  caret: number | null
}

const Block = memo(
  function Block({ block, animate, tail, caret }: BlockProps) {
    const inlines = (source: string, withCaret: boolean) => (
      <>
        {renderInlines(parseInline(source, tail), animate)}
        {withCaret && caret !== null && <Caret key={caret} />}
      </>
    )
    const children = (blocks: MarkdownBlock[]) =>
      blocks.map((child, index) => {
        const lastChild = index === blocks.length - 1
        return <Block key={index} block={child} animate={animate} tail={tail && lastChild} caret={lastChild ? caret : null} />
      })

    switch (block.type) {
      case 'paragraph':
        return <p>{inlines(block.text, true)}</p>
      case 'heading':
        return <Heading level={block.level} className={headingClass[Math.min(block.level, 3) - 1]!}>{inlines(block.text, true)}</Heading>
      case 'code':
        return <CodeBlock lang={block.lang} code={block.code} caret={caret} />
      case 'quote':
        return <blockquote className="flex flex-col gap-2 border-s-2 border-line ps-3.5 text-fg-muted">{children(block.blocks)}</blockquote>
      case 'list': {
        const List = block.ordered ? 'ol' : 'ul'
        return (
          <List
            start={block.ordered && block.start !== 1 ? block.start : undefined}
            className={cn(
              'flex flex-col ps-5',
              block.loose ? 'gap-2' : 'gap-1',
              block.ordered ? 'list-decimal marker:text-fg-muted marker:tabular-nums' : 'list-disc marker:text-fg-subtle',
            )}
          >
            {block.items.map((item, index) => {
              const lastItem = index === block.items.length - 1
              return (
                <li key={index} className="ps-1 [&>*+*]:mt-1.5">
                  {item.map((child, childIndex) => {
                    const lastChild = lastItem && childIndex === item.length - 1
                    return <Block key={childIndex} block={child} animate={animate} tail={tail && lastChild} caret={lastChild ? caret : null} />
                  })}
                </li>
              )
            })}
          </List>
        )
      }
      case 'table':
        return <TableBlock align={block.align} header={block.header} rows={block.rows} animate={animate} tail={tail} caret={caret} />
      case 'rule':
        return <hr className="my-1 border-line" />
    }
  },
  (a, b) => a.block.raw === b.block.raw && a.block.type === b.block.type && a.animate === b.animate && a.tail === b.tail && a.caret === b.caret,
)

/** A heading placed in the page's outline; it looks like its markdown level. */
function Heading({ level, className, children }: { level: number; className: string; children: ReactNode }) {
  const outline = Math.min(6, Math.max(1, level + useContext(HeadingOffsetContext)))
  const Tag = (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const)[outline - 1]!
  return <Tag className={className}>{children}</Tag>
}

const headingClass = [
  'own:text-[1.0625rem] own:leading-7 own:font-semibold own:tracking-tight own:text-fg',
  'own:text-[0.9375rem] own:leading-6 own:font-semibold own:tracking-tight own:text-fg',
  'own:font-semibold own:text-fg',
]

/* ── Inlines ────────────────────────────────────────────────────────────── */

function renderInlines(nodes: MarkdownInline[], animate: boolean): ReactNode[] {
  return nodes.map((node, index) => {
    switch (node.type) {
      case 'text':
        return animate ? <Words key={index} text={node.text} at={node.at} /> : node.text
      case 'code':
        return (
          <code key={index} className={cn('rounded-sm bg-band px-[0.3em] py-px font-mono text-[0.875em] text-fg', animate && 'yj-chat-word')}>
            {node.text}
          </code>
        )
      case 'strong':
        return (
          <strong key={index} className="font-semibold text-fg">
            {renderInlines(node.children, animate)}
          </strong>
        )
      case 'em':
        return <em key={index}>{renderInlines(node.children, animate)}</em>
      case 'del':
        return (
          <del key={index} className="text-fg-muted">
            {renderInlines(node.children, animate)}
          </del>
        )
      case 'link':
        return node.href ? (
          <a
            key={index}
            href={node.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'rounded-xs font-medium text-accent-text underline decoration-accent-line underline-offset-[3px] focus-ring',
              'transition-[text-decoration-color] yj-duration-fast ease-standard hover:decoration-accent',
            )}
          >
            {renderInlines(node.children, animate)}
          </a>
        ) : (
          <span key={index}>{renderInlines(node.children, animate)}</span>
        )
      case 'cite':
        return <Cite key={index} index={node.index} />
      case 'break':
        return <br key={index} />
    }
  })
}

/** Each word (with its trailing space) in a span that fades in once, when it mounts. Keys are text offsets, stable as the text grows. */
function Words({ text, at }: { text: string; at: number }) {
  const parts: ReactNode[] = []
  for (const match of text.matchAll(/\s+|\S+\s*/g)) {
    parts.push(
      /^\s/.test(match[0]) ? (
        match[0]
      ) : (
        <span key={at + match.index} className="yj-chat-word">
          {match[0]}
        </span>
      ),
    )
  }
  return parts
}

/** Where writing happens. Solid while tokens flow; blinks (2 × deliberate) once the stream pauses a deliberate beat. */
function Caret() {
  return (
    <span
      aria-hidden
      data-slot="chat-caret"
      className="yj-chat-caret own:ms-px own:inline-block h-[1.15em] w-0.5 translate-y-[0.2em] rounded-full own:bg-accent align-baseline"
    />
  )
}

/* ── Code ───────────────────────────────────────────────────────────────── */

/** Highlighted code as spans: the same colors as a markdown code block. */
export { CodeTokens } from '../code-block/code-block'

/* The public CodeBlock, with chat's copy button (announced through the message list) and the streaming caret. */
function CodeBlock({ lang, code, caret }: { lang: string; code: string; caret: number | null }) {
  const labels = useComponentLabels(chatMarkdownLabels)
  return (
    <SharedCodeBlock
      data-slot="chat-code"
      code={code}
      language={lang}
      actions={<ChatCopyButton text={code} label={labels.copyCode} />}
      tail={caret !== null && <Caret key={caret} />}
    />
  )
}

/* ── Tables ─────────────────────────────────────────────────────────────── */

const alignClass = (align: ChatMarkdownAlign | undefined) => (align === 'center' ? 'text-center' : align === 'right' ? 'text-end' : 'text-start')

function TableBlock({
  align,
  header,
  rows,
  animate,
  tail,
  caret,
}: {
  align: ChatMarkdownAlign[]
  header: string[]
  rows: string[][]
  animate: boolean
  tail: boolean
  caret: number | null
}) {
  const labels = useComponentLabels(chatMarkdownLabels)
  // The caret sits in the last cell written so far (rows are padded to the header's width).
  const lastRow = rows.length - 1
  let lastCell = header.length - 1
  if (lastRow >= 0) while (lastCell > 0 && rows[lastRow]![lastCell] === '') lastCell--
  const cell = (source: string, isLast: boolean) => (
    <>
      {renderInlines(parseInline(source, tail && isLast), animate)}
      {isLast && caret !== null && <Caret key={caret} />}
    </>
  )
  return (
    <ScrollArea orientation="horizontal" aria-label={labels.chatTable} className="rounded-lg border own:border-line">
      <table className="w-full border-separate border-spacing-0 text-ui">
        <thead>
          <tr>
            {header.map((text, column) => (
              <th
                key={column}
                scope="col"
                className={cn('border-b border-line bg-band px-3 py-2 own:font-medium whitespace-nowrap own:text-fg', alignClass(align[column]))}
              >
                {cell(text, lastRow < 0 && column === lastCell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((text, column) => (
                <td
                  key={column}
                  className={cn('border-b border-line px-3 py-2 align-top [tr:last-child>&]:border-b-0', alignClass(align[column]))}
                >
                  {cell(text, index === lastRow && column === lastCell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollArea>
  )
}

export { ChatMarkdown }
