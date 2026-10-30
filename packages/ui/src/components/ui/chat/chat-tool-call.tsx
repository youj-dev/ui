'use client'

import { chatToolCallLabels } from '@youj/core/labels'
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { m } from 'motion/react'
import { type YoujLabels, MotionFeatures } from '@youj/core'
import { Collapse, MorphLabel, useMorphRoot } from '@youj/motion'
import { useComponentLabels } from '@youj/core/labels'
import { AlertTriangleIcon } from '@youj/icons/components/youj/icons/alert-triangle'
import { CheckIcon } from '@youj/icons/components/youj/icons/check'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '../../../lib/utils'
import { Badge } from '../badge'
import { Card } from '../card'
import { Collapsible, CollapsibleChevron, CollapsibleContent, CollapsibleTrigger } from '../collapsible'
import { ScrollArea } from '../scroll-area'
import { Spinner } from '../spinner'
import { useChatList } from './chat-context'
import { CodeTokens } from './chat-markdown'

/* A tool the assistant called: its name, its arguments folded away, how it
 * went, and a preview of what came back.
 * - One calm line at rest: a status mark, the tool, a short read of its
 *   arguments and a badge. The mark is a spinner while it runs, then a check
 *   that draws itself in, or a warning that rocks once. The badge's label
 *   crossfades between states while its box morphs to the new width
 *   (MorphLabel on the snappy spring).
 * - When the result arrives, a two-line preview unfolds under the header
 *   (motion's Collapse). Opening the card (Base UI Collapsible, yj-collapse)
 *   shows the arguments and the full result, highlighted.
 * - Status changes are announced once each: through the conversation's live
 *   regions inside a ChatMessageList, through its own on its own.
 * Reduced motion: every swap and fold is instant; the marks appear drawn. */

export type ChatToolStatus = 'pending' | 'running' | 'success' | 'error'

export interface ChatToolCallProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** The tool's name, e.g. "get_deployments". */
  name: string
  /** Arguments, shown as JSON when opened and summarized in the header. */
  args?: Record<string, unknown>
  status: ChatToolStatus
  /** What it returned: text, or anything JSON can show. */
  result?: unknown
  /** Why it failed. */
  error?: string
  /** How long it ran, in ms. */
  duration?: number
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const statusLabel = (labels: Pick<YoujLabels, keyof typeof chatToolCallLabels>): Record<ChatToolStatus, string> => ({
  pending: labels.chatToolQueued,
  running: labels.chatToolRunning,
  success: labels.done,
  error: labels.failed,
})
const BADGE: Record<ChatToolStatus, 'secondary' | 'success' | 'danger'> = { pending: 'secondary', running: 'secondary', success: 'success', error: 'danger' }

/** "project: orion, target: production, limit: 3", for the header. */
function summarise(args: Record<string, unknown> | undefined) {
  if (!args) return ''
  return Object.entries(args)
    .map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
    .join(', ')
}

const asText = (value: unknown) => (typeof value === 'string' ? value : JSON.stringify(value, null, 2))
const isJson = (text: string) => /^\s*[[{]/.test(text)

function StatusMark({ status }: { status: ChatToolStatus }) {
  return (
    <span aria-hidden className="own:grid size-5 shrink-0 place-items-center">
      {status === 'running' || status === 'pending' ? (
        <Spinner label={null} size={14} className={cn(status === 'pending' && 'opacity-50')} />
      ) : status === 'success' ? (
        <CheckIcon key="success" trigger="mount" size={16} strokeWidth={2} className="own:text-success-text" />
      ) : (
        <AlertTriangleIcon key="error" trigger="mount" size={16} strokeWidth={1.75} className="own:text-danger-text" />
      )}
    </span>
  )
}

function ChatToolCall({ name, args, status, result, error, duration, defaultOpen, open: openProp, onOpenChange, className, ...props }: ChatToolCallProps) {
  const k = useYouj()
  const labels = useComponentLabels(chatToolCallLabels)
  const STATUS_LABEL = statusLabel(labels)
  const list = useChatList()
  const [ownOpen, setOwnOpen] = useState(defaultOpen ?? false)
  const open = openProp ?? ownOpen
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOwnOpen(next)
    onOpenChange?.(next)
  }
  const morph = useMorphRoot('9999px')
  const label = status === 'success' && duration !== undefined ? `${STATUS_LABEL.success} · ${labels.chatToolDuration(duration)}` : STATUS_LABEL[status]
  const summary = summarise(args)
  // Only a finished call has something to show.
  const output = status === 'error' ? error : status === 'success' && result !== undefined ? asText(result) : undefined

  // Each status change is announced once; a tool call that mounts settled (history) is not.
  const [spoken, setSpoken] = useState('')
  const previous = useRef<ChatToolStatus | null>(list?.isSettled() || !list ? null : status)
  useEffect(() => {
    if (previous.current === status) return
    previous.current = status
    const message = status === 'error' ? labels.chatToolFailed(name, error) : `${name}: ${STATUS_LABEL[status].toLowerCase()}`
    if (list) list.announce(message, status === 'error' ? 'assertive' : 'polite')
    else setSpoken(message)
  }, [status, name, error, list])

  return (
    <MotionFeatures features="max">
      <Card
        size="sm"
        data-slot="chat-tool-call"
        data-status={status}
        data-reduced-motion={k.reduced || undefined}
        className={cn('own:gap-0 own:py-0 own:shadow-none', status === 'error' && 'own:border-danger-line', className)}
        {...props}
      >
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger
            // The call as shown (name, arguments, then the state).
            aria-label={`${summary ? `${name} ${summary}` : name}: ${label}`}
            className={cn(
              '@container/tool own:flex own:min-h-10 own:w-full own:min-w-0 own:items-center own:gap-2.5 own:rounded-[calc(var(--radius-xl)-1px)] own:px-3 own:py-2 own:text-start focus-ring',
              'transition-colors yj-duration-fast ease-standard own:hover:bg-hover',
            )}
          >
            <StatusMark status={status} />
            <span className="min-w-0 truncate own:font-mono own:text-ui own:font-medium own:text-fg">{name}</span>{' '}
            {/* Narrow (under 20rem), the arguments would be a letter and an ellipsis: the name and status keep the row. */}
            <span className="min-w-0 flex-1 truncate own:font-mono own:text-ui-sm own:text-fg-muted own:@max-xs/tool:hidden">{summary}</span>{' '}
            <Badge variant={BADGE[status]} render={<m.span {...morph} />} className="own:ms-auto own:shrink-0 own:tabular-nums">
              <MorphLabel value={label} contentClassName="own:gap-1">
                {label}
              </MorphLabel>
            </Badge>
            <CollapsibleChevron size={14} className="own:shrink-0 own:text-fg-subtle" />
          </CollapsibleTrigger>
          {/* At rest, a peek at what came back; opened, the whole exchange. */}
          <Collapse open={output !== undefined && !open}>
            {/* The clamp sits inside the padding: overflow clips at the padding box, so padding on the clamp would show a third line. */}
            <div className="border-t border-line px-3 py-2">
              <p
                data-slot="chat-tool-call-preview"
                className={cn('own:line-clamp-2 own:font-mono own:text-ui-sm break-all', status === 'error' ? 'own:text-danger-text' : 'own:text-fg-muted')}
              >
                {output}
              </p>
            </div>
          </Collapse>
          <CollapsibleContent>
            <div className="own:flex flex-col gap-3 border-t border-line px-3 pt-2.5 pb-3">
              {args && <Payload title={labels.chatToolArguments} text={JSON.stringify(args, null, 2)} />}
              {output !== undefined && <Payload title={status === 'error' ? labels.chatToolError : labels.chatToolResult} text={output} error={status === 'error'} />}
            </div>
          </CollapsibleContent>
        </Collapsible>
        {!list && (
          <span role="status" className="sr-only">
            {spoken}
          </span>
        )}
      </Card>
    </MotionFeatures>
  )
}

function Payload({ title, text, error }: { title: string; text: string; error?: boolean }): ReactNode {
  return (
    <section className="own:flex min-w-0 flex-col gap-1.5">
      {/* A label, not a heading: the region below is already named by it. */}
      <p aria-hidden className="own:text-ui-xs own:font-medium own:tracking-wide own:text-fg-muted own:uppercase">
        {title}
      </p>
      {/* Long results scroll inside, and the scroller is a tab stop once they do. */}
      <ScrollArea aria-label={title} className="own:rounded-md own:bg-band" viewportClassName="own:max-h-64">
        <pre className={cn('px-2.5 py-2 own:font-mono own:text-ui-sm own:leading-5 whitespace-pre-wrap break-all', error ? 'own:text-danger-text' : 'own:text-fg')}>
          {isJson(text) && !error ? <CodeTokens code={text} lang="json" /> : text}
        </pre>
      </ScrollArea>
    </section>
  )
}

export { ChatToolCall }
