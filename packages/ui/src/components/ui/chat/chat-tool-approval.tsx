'use client'

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react'
import { m } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { Collapse, MorphLabel, useMorphRoot } from '@youj/motion'
import { chatToolApprovalLabels, useComponentLabels } from '@youj/core/labels'
import { useLocale } from '@youj/core/lib/youj/provider'
import { AlertTriangleIcon } from '@youj/icons/components/youj/icons/alert-triangle'
import { CheckIcon } from '@youj/icons/components/youj/icons/check'
import { ClockIcon } from '@youj/icons/components/youj/icons/clock'
import { HourglassIcon } from '@youj/icons/components/youj/icons/hourglass'
import { OctagonAlertIcon } from '@youj/icons/components/youj/icons/octagon-alert'
import { PencilIcon } from '@youj/icons/components/youj/icons/pencil'
import { ShieldAlertIcon } from '@youj/icons/components/youj/icons/shield-alert'
import { ShieldCheckIcon } from '@youj/icons/components/youj/icons/shield-check'
import { TerminalIcon } from '@youj/icons/components/youj/icons/terminal'
import { XIcon } from '@youj/icons/components/youj/icons/x'
import { cn, dateTimeFormat } from '../../../lib/utils'
import { Badge } from '../badge'
import { Button } from '../button'
import { Card } from '../card'
import { Collapsible, CollapsibleChevron, CollapsibleContent, CollapsibleTrigger } from '../collapsible'
import { Spinner } from '../spinner'
import { useChatList } from './chat-context'
import { ArgsForm, ArgsList } from './chat-tool-approval-args'

/* An agent asks before it runs a risky tool: who it is (name and icon), what it
 * wants in plain words, the exact arguments, why, and how risky. People answer
 * with Allow once, Always allow for a scope or Deny, or Edit the arguments first.
 * - The risk tier is a badge with an icon and a word, never colour alone, and a
 *   high tier also draws the card's border in danger.
 * - Focus lands on the summary, not on Allow, when `autoFocus` asks for it.
 *   Enter on the focused summary allows once for low and medium risk, and is
 *   never bound on high risk.
 * - Pending, approved, denied, expired, then running, done or failed: the
 *   status badge morphs between them and each change is announced once
 *   (through the conversation's live regions inside a ChatMessageList).
 * Controlled with `status`, or uncontrolled: a decision resolves it itself.
 * Reduced motion: every swap and fold is instant. */

export type ToolApprovalRisk = 'low' | 'medium' | 'high'
export type ToolApprovalStatus = 'pending' | 'approved' | 'denied' | 'expired' | 'running' | 'done' | 'failed'

export interface ToolApprovalDecision {
  decision: 'allow' | 'deny'
  /** `once` for this call, `always` for every later call within the `scope` prop. A denial is always `once`. */
  scope: 'once' | 'always'
  /** The arguments to run with: the original ones, or the person's edited ones. */
  args: Record<string, unknown>
}

export interface ToolApprovalResolution {
  /** Who decided. */
  by?: string
  /** When they decided. */
  at?: Date | number | string
  /** Why a request was denied. */
  reason?: string
}

export interface ChatToolApprovalProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** The tool's name, e.g. "send_email". */
  name: string
  /** The tool's icon; a terminal by default. */
  icon?: ReactNode
  /** What the agent wants to do, in plain words. */
  summary: ReactNode
  /** The arguments it would run with. */
  args: Record<string, unknown>
  /** The agent's reason for asking. */
  reason?: string
  risk?: ToolApprovalRisk
  /** What "Always allow" covers, e.g. "this project". Without it there is no such button. */
  scope?: string
  /** Argument keys to mask until revealed (names like password, token and api_key are always masked). */
  sensitive?: string[]
  /** Offer Edit (default true). */
  editable?: boolean
  /** Refuse an edited value: return a message. Types are checked first. */
  validate?: (key: string, value: unknown, args: Record<string, unknown>) => string | undefined
  /** Controlled. Without it, the card starts pending and a decision resolves it. */
  status?: ToolApprovalStatus
  defaultStatus?: ToolApprovalStatus
  /** Who decided and when, for the resolved line. Uncontrolled, the card fills it in from `approver`. */
  resolution?: ToolApprovalResolution
  /** The person answering, shown on the resolved line of an uncontrolled card. */
  approver?: string
  onDecision?: (decision: ToolApprovalDecision) => void
  /** Why it failed. */
  error?: string
  /** How long it ran, in ms. */
  duration?: number
  /** Move focus to the summary when it mounts pending. */
  autoFocus?: boolean
}

const RISK_ICON = { low: ShieldCheckIcon, medium: ShieldAlertIcon, high: OctagonAlertIcon }
const RISK_VARIANT = { low: 'success', medium: 'warning', high: 'danger' } as const
const STATUS_VARIANT = { pending: 'secondary', approved: 'success', denied: 'danger', expired: 'secondary', running: 'secondary', done: 'success', failed: 'danger' } as const

function StatusMark({ status }: { status: ToolApprovalStatus }) {
  const size = { size: 12, strokeWidth: 2 }
  if (status === 'pending') return <HourglassIcon {...size} />
  if (status === 'running') return <Spinner label={null} size={12} />
  if (status === 'approved' || status === 'done') return <CheckIcon key={status} trigger="mount" {...size} />
  if (status === 'expired') return <ClockIcon {...size} />
  if (status === 'denied') return <XIcon {...size} />
  return <AlertTriangleIcon key="failed" trigger="mount" {...size} />
}

function ChatToolApproval({
  name,
  icon,
  summary,
  args,
  reason,
  risk = 'medium',
  scope,
  sensitive,
  editable = true,
  validate,
  status: statusProp,
  defaultStatus = 'pending',
  resolution: resolutionProp,
  approver,
  onDecision,
  error,
  duration,
  autoFocus,
  className,
  onKeyDown,
  ...props
}: ChatToolApprovalProps) {
  const locale = useLocale()
  const labels = useComponentLabels(chatToolApprovalLabels)
  const list = useChatList()
  const morph = useMorphRoot('9999px')
  const headingId = useId()
  const summaryRef = useRef<HTMLParagraphElement>(null)
  const editRef = useRef<HTMLButtonElement>(null)

  const [ownStatus, setOwnStatus] = useState(defaultStatus)
  const [ownResolution, setOwnResolution] = useState<ToolApprovalResolution>()
  const [edited, setEdited] = useState<Record<string, unknown>>()
  const [editing, setEditing] = useState(false)
  const status = statusProp ?? ownStatus
  const resolution = resolutionProp ?? ownResolution
  const shown = edited ?? args
  const pending = status === 'pending'

  const statusLabel = useMemo<Record<ToolApprovalStatus, string>>(
    () => ({
      pending: labels.toolApprovalPending,
      approved: labels.toolApprovalApproved,
      denied: labels.toolApprovalDenied,
      expired: labels.toolApprovalExpired,
      running: labels.chatToolRunning,
      done: labels.done,
      failed: labels.failed,
    }),
    [labels],
  )
  const riskLabel = { low: labels.toolApprovalRiskLow, medium: labels.toolApprovalRiskMedium, high: labels.toolApprovalRiskHigh }[risk]
  const badge = status === 'done' && duration !== undefined ? `${labels.done} · ${labels.chatToolDuration(duration)}` : statusLabel[status]
  const RiskIcon = RISK_ICON[risk]

  const decide = (decision: ToolApprovalDecision['decision'], decisionScope: ToolApprovalDecision['scope'] = 'once') => {
    onDecision?.({ decision, scope: decisionScope, args: shown })
    if (statusProp === undefined) {
      setOwnStatus(decision === 'allow' ? 'approved' : 'denied')
      setOwnResolution({ by: approver, at: new Date() })
    }
  }

  // A request that appears is news; one that mounts already settled, as history, is not.
  const [spoken, setSpoken] = useState('')
  const previous = useRef<ToolApprovalStatus | null>(list && !list.isSettled() ? status : null)
  useEffect(() => {
    if (previous.current === status) return
    const first = previous.current === null
    previous.current = status
    if (first && status !== 'pending') return
    const message =
      status === 'pending' ? labels.toolApprovalAnnounce(name, riskLabel) : status === 'failed' ? labels.chatToolFailed(name, error) : `${name}: ${statusLabel[status].toLowerCase()}`
    const politeness = status === 'failed' || (status === 'pending' && risk === 'high') ? 'assertive' : 'polite'
    if (list) list.announce(message, politeness)
    else setSpoken(message)
  }, [status, name, error, risk, list, labels, riskLabel, statusLabel])

  // biome-ignore lint/correctness/useExhaustiveDependencies: focus once, when it mounts
  useEffect(() => {
    if (autoFocus && pending) summaryRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- focus once, when it mounts
  }, [])

  // Enter on the summary is a shortcut for low and medium risk. On high risk it is never bound.
  const onSummaryKey = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (event.key === 'Enter' && event.target === summaryRef.current && pending && !editing && risk !== 'high') {
      event.preventDefault()
      decide('allow')
    }
  }

  const when = resolution?.at !== undefined ? dateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(resolution.at)) : undefined
  const approved = status === 'approved' || status === 'running' || status === 'done' || status === 'failed'
  const verdict = status === 'expired' ? labels.toolApprovalExpired : approved ? (resolution?.by ? labels.toolApprovalApprovedBy(resolution.by) : labels.toolApprovalApproved) : resolution?.by ? labels.toolApprovalDeniedBy(resolution.by) : labels.toolApprovalDenied
  const byLine = [verdict, status === 'expired' ? undefined : when].filter(Boolean).join(' · ')
  const note = status === 'denied' || status === 'expired'
  const hasArgs = Object.keys(shown).length > 0

  const argsBlock = editing ? (
    <ArgsForm
      args={shown}
      sensitive={sensitive}
      validate={validate}
      onSave={(next) => {
        setEdited(next)
        setEditing(false)
        requestAnimationFrame(() => editRef.current?.focus())
      }}
      onCancel={() => {
        setEditing(false)
        requestAnimationFrame(() => editRef.current?.focus())
      }}
    />
  ) : (
    <ArgsList args={shown} sensitive={sensitive} />
  )

  return (
    <MotionFeatures features="max">
      <Card
        size="sm"
        role="group"
        aria-labelledby={headingId}
        data-slot="chat-tool-approval"
        data-status={status}
        data-yj-risk={risk}
        className={cn('own:gap-3', risk === 'high' && pending && 'own:border-danger-line', className)}
        onKeyDown={onSummaryKey}
        {...props}
      >
        <div className="own:flex flex-wrap items-center gap-x-2.5 gap-y-1.5 px-(--card-spacing)">
          <span aria-hidden className="own:grid size-7 shrink-0 place-items-center own:rounded-md border border-line own:bg-band own:text-fg-muted">
            {icon ?? <TerminalIcon size={14} strokeWidth={1.75} />}
          </span>
          <span id={headingId} className="min-w-0 truncate own:font-mono own:text-ui own:font-medium own:text-fg">
            {name}
          </span>
          <Badge variant={RISK_VARIANT[risk]} data-slot="chat-tool-approval-risk" className="own:ms-auto">
            <RiskIcon size={12} strokeWidth={2} />
            {riskLabel}
          </Badge>
          <Badge variant={STATUS_VARIANT[status]} render={<m.span {...morph} />} data-slot="chat-tool-approval-status" className="own:shrink-0 own:tabular-nums">
            <StatusMark status={status} />
            <MorphLabel value={badge} contentClassName="own:gap-1">
              {badge}
            </MorphLabel>
          </Badge>
        </div>

        <div className="own:flex flex-col gap-1 px-(--card-spacing)">
          <p
            ref={summaryRef}
            tabIndex={-1}
            data-slot="chat-tool-approval-summary"
            className="own:rounded-sm own:text-ui own:font-medium own:text-fg focus-ring"
          >
            {summary}
          </p>
          {reason && (
            <p data-slot="chat-tool-approval-reason" className="own:text-ui-sm own:text-fg-muted">
              <span className="own:font-medium">{labels.toolApprovalReason}: </span>
              {reason}
            </p>
          )}
        </div>

        {pending ? (
          hasArgs && (
            <div className="own:flex flex-col gap-1.5 px-(--card-spacing)">
              <p aria-hidden className="own:text-ui-xs own:font-medium own:tracking-wide own:text-fg-muted own:uppercase">
                {labels.chatToolArguments}
              </p>
              <div className="own:rounded-md own:bg-band px-3 py-2.5">{argsBlock}</div>
              {edited && !editing && (
                <Badge variant="outline" className="own:w-fit">
                  <PencilIcon size={12} strokeWidth={1.75} />
                  {labels.toolApprovalEdited}
                </Badge>
              )}
            </div>
          )
        ) : (
          <Collapsible className="own:flex flex-col own:gap-2 own:px-(--card-spacing)">
            <p data-slot="chat-tool-approval-resolution" className="own:text-ui-sm own:text-fg-muted">
              {byLine}
            </p>
            <Collapse open={note}>
              <p className="own:text-ui-sm own:text-fg-muted">
                {labels.toolApprovalNotRun}
                {status === 'denied' && resolution?.reason ? ` ${labels.toolApprovalDeniedReason(resolution.reason)}` : ''}
              </p>
            </Collapse>
            <Collapse open={status === 'failed' && error !== undefined}>
              <p role="alert" className="own:text-ui-sm own:text-danger-text">
                {error}
              </p>
            </Collapse>
            {hasArgs && (
              <>
                <CollapsibleTrigger className="own:flex own:w-fit own:items-center own:gap-1 own:rounded-sm own:text-ui-sm own:font-medium own:text-fg-muted own:hover:text-fg focus-ring">
                  {labels.chatToolArguments}
                  <CollapsibleChevron size={14} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="own:rounded-md own:bg-band px-3 py-2.5">
                    <ArgsList args={shown} sensitive={sensitive} />
                  </div>
                </CollapsibleContent>
              </>
            )}
          </Collapsible>
        )}

        {pending && !editing && (
          <div data-slot="chat-tool-approval-actions" className="own:flex flex-wrap own:items-center own:gap-2 own:px-(--card-spacing)">
            {editable && hasArgs && (
              <Button ref={editRef} type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
                <PencilIcon size={14} strokeWidth={1.75} />
                {labels.edit}
              </Button>
            )}
            <span className="own:ms-auto own:flex flex-wrap items-center justify-end gap-2">
              <Button type="button" variant={risk === 'high' ? 'default' : 'outline'} size="sm" onClick={() => decide('deny')}>
                {labels.toolApprovalDeny}
              </Button>
              {scope && (
                <Button type="button" variant="ghost" size="sm" onClick={() => decide('allow', 'always')}>
                  {labels.toolApprovalAlwaysAllow(scope)}
                </Button>
              )}
              <Button type="button" variant={risk === 'high' ? 'outline' : 'default'} size="sm" onClick={() => decide('allow')}>
                {labels.toolApprovalAllowOnce}
              </Button>
            </span>
          </div>
        )}
        {!list && (
          <span role="status" className="sr-only">
            {spoken}
          </span>
        )}
      </Card>
    </MotionFeatures>
  )
}

export { ChatToolApproval }
