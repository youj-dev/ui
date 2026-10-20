'use client'

import { useId, type ComponentProps, type ReactNode } from 'react'
import { Collapse } from '@youj/motion'
import { proposalCardLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '../../lib/utils'

/* A change someone (or an agent) proposes and a person decides on: a reroute,
 * a reassignment, a new slot. It says where it came from (`source`), what it
 * is (`title`, `description`), then weighs the options side by side: each a
 * row with its name, a figure in mono (an ETA, a price) and how it moves
 * ("+47 min"), the proposed one drawn as a dashed accent outline, like a
 * proposed route on a RouteMap or a proposed bar on TimeLanes. `facts` add
 * the impact as a row of figures (time saved, extra distance, window kept),
 * and `actions` hold your buttons (Approve, Compare, Dismiss).
 * - `status`: once `approved`, the proposed row turns solid and the others
 *   step back, and `actions` fold away for your `resolution` (who approved
 *   it, when); `dismissed` keeps the current row and fades the proposal.
 * - The card is an article named by its title; the proposed row says so to
 *   screen readers ("Proposed").
 * - Motion: rows change tone on the fast token, and the actions and the
 *   resolution trade places through Collapse, so a reversal mid-way never
 *   jumps. Reduced motion: everything changes in place. */

type ProposalTone = 'neutral' | 'success' | 'warning' | 'danger' | 'accent'

interface ProposalOption {
  id: string
  /** "Harbor Fwy · current". */
  label: ReactNode
  /** The figure the options are weighed by: "15:49", "$1,842". */
  value?: ReactNode
  /** How it moves against plan: "+47 min". */
  detail?: ReactNode
  /** The figure's and detail's ink. Default neutral; a proposed option defaults to accent. */
  tone?: ProposalTone
  /** The option being proposed: a dashed accent outline until it's approved. */
  proposed?: boolean
}

interface ProposalFact {
  label: ReactNode
  value: ReactNode
  tone?: ProposalTone
}

type ProposalStatus = 'pending' | 'approved' | 'dismissed'

interface ProposalCardProps extends Omit<ComponentProps<'article'>, 'title'> {
  /** Where it came from, as an eyebrow: an agent's name, a confidence, an age. */
  source?: ReactNode
  title: ReactNode
  description?: ReactNode
  /** The options side by side: usually the current plan, then the proposal. */
  options?: ProposalOption[]
  /** The impact as figures: time saved, extra distance, the window kept. */
  facts?: ProposalFact[]
  /** A line over the actions: why it needs a person ("Route changes need approval"). */
  note?: ReactNode
  /** Your buttons while it's pending. */
  actions?: ReactNode
  /** Default 'pending'. */
  status?: ProposalStatus
  /** What shows once it's decided, in place of the actions: "Approved by you · 11:58". */
  resolution?: ReactNode
  /** The title's heading level. Default 3. */
  headingLevel?: 2 | 3 | 4
}

const INK: Record<ProposalTone, string> = {
  neutral: 'own:text-fg',
  success: 'own:text-success-text',
  warning: 'own:text-warning-text',
  danger: 'own:text-danger-text',
  accent: 'own:text-accent-text',
}

function ProposalCard({
  source,
  title,
  description,
  options,
  facts,
  note,
  actions,
  status = 'pending',
  resolution,
  headingLevel = 3,
  className,
  ...props
}: ProposalCardProps) {
  const k = useYouj()
  const labels = useComponentLabels(proposalCardLabels)
  const titleId = useId()
  const Heading = `h${headingLevel}` as 'h3'
  const decided = status !== 'pending'

  return (
    <article
      data-slot="proposal-card"
      data-status={status}
      data-reduced-motion={k.reduced || undefined}
      aria-labelledby={titleId}
      className={cn('own:flex own:flex-col own:gap-3 own:rounded-xl own:border own:border-line own:bg-surface own:p-4 own:text-fg own:shadow-xs', className)}
      {...props}
    >
      {(source || title || description) && (
        <div className="own:flex flex-col gap-1">
          {source && <div className="own:flex items-center gap-1.5 own:font-mono own:text-ui-xs own:tracking-wide text-accent-text uppercase">{source}</div>}
          <Heading id={titleId} className="own:text-ui own:font-semibold own:tracking-tight own:text-fg">
            {title}
          </Heading>
          {description && <p className="own:text-ui-sm own:text-fg-muted">{description}</p>}
        </div>
      )}

      {options && options.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {options.map((option) => {
            const proposed = option.proposed === true
            // Approved: the proposal is the plan now. Dismissed: the proposal steps back.
            const muted = (status === 'approved' && !proposed) || (status === 'dismissed' && proposed)
            const tone = option.tone ?? (proposed ? 'accent' : 'neutral')
            return (
              <li
                key={option.id}
                data-proposed={proposed || undefined}
                data-muted={muted || undefined}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-lg border px-3 py-2',
                  'transition-[background-color,border-color,opacity] yj-duration-fast ease-standard reduced:transition-none',
                  proposed
                    ? status === 'approved'
                      ? 'border-accent-line bg-accent-subtle'
                      : 'border-dashed border-accent-line bg-accent-subtle'
                    : 'border-transparent bg-transparent',
                  muted && 'opacity-55',
                )}
              >
                <div className="own:flex min-w-0 flex-col">
                  <span className="truncate own:text-ui-sm own:text-fg">
                    {option.label}
                    {proposed && <span className="sr-only">, {labels.proposed}</span>}
                  </span>
                  {option.detail && <span className={cn('own:font-mono own:text-ui-xs own:tabular-nums', INK[tone])}>{option.detail}</span>}
                </div>
                {option.value && (
                  <span className={cn('shrink-0 own:font-mono own:text-ui-lg own:tabular-nums', muted ? 'own:text-fg-muted line-through decoration-1' : INK[tone])}>{option.value}</span>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {facts && facts.length > 0 && (
        <dl className="grid grid-cols-[repeat(auto-fit,minmax(--spacing(24),1fr))] gap-3 rounded-lg bg-transparent px-3 py-2.5">
          {facts.map((fact, i) => (
            <div key={i} className="own:flex min-w-0 flex-col-reverse">
              <dt className="truncate own:text-ui-xs own:text-fg-muted">{fact.label}</dt>
              <dd className={cn('truncate own:font-mono own:text-ui own:tabular-nums', INK[fact.tone ?? 'neutral'])}>{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {(note || actions) && (
        <Collapse open={!decided}>
          <div className="own:flex flex-col gap-2.5">
            {note && <p className="own:text-ui-xs own:text-fg-muted">{note}</p>}
            {actions && <div className="own:flex flex-wrap items-center gap-2">{actions}</div>}
          </div>
        </Collapse>
      )}
      {resolution && (
        <Collapse open={decided} keepMounted>
          <div role="status" className="own:text-ui-sm text-fg-muted">
            {decided && resolution}
          </div>
        </Collapse>
      )}
    </article>
  )
}

export { ProposalCard, type ProposalCardProps, type ProposalFact, type ProposalOption, type ProposalStatus, type ProposalTone }
