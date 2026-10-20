'use client'

import type { Ref } from 'react'
import { Reveal } from '@youj/motion'
import { Illustration, type IllustrationSlot } from '@youj/illustrations'
import { GitMergeIcon, MessageIcon } from '@youj/icons'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Kbd } from '../../../components/ui/kbd'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { arrOf, daysBetween, initials, type FeatureRequest, type ListDetailCopy, type Status } from './data'

const planTone: Record<string, 'default' | 'secondary' | 'outline'> = { Enterprise: 'default', Business: 'secondary', Team: 'outline' }

function Heading({ children }: { children: string }) {
  return <h3 className="text-ui-xs font-medium tracking-wide text-fg-muted uppercase">{children}</h3>
}

interface RequestDetailProps {
  request: FeatureRequest
  /** The title takes focus when the request is opened from the list. */
  titleRef?: Ref<HTMLHeadingElement>
  titleId?: string
  onStatus: (request: FeatureRequest, status: Status) => void
  onMerge: (request: FeatureRequest) => void
  onReply: (request: FeatureRequest) => void
  copy: ListDetailCopy
  /** "Now" for the request's ages. */
  now: number
  locale: string
  money: (amount: number) => string
}

/** One request, read top to bottom: where it stands, the ask in the customer's words, who's behind it. */
export function RequestDetail({ request, titleRef, titleId, onStatus, onMerge, onReply, copy, now, locale, money }: RequestDetailProps) {
  const ago = (time: number) => copy.ago(daysBetween(time, now))
  const LABELS = copy.statuses
  const figures: [string, string][] = [
    [copy.figureVotes, request.votes.toLocaleString(locale)],
    [copy.figureRevenue, money(arrOf(request))],
    [copy.figureOpened, ago(request.createdAt)],
  ]
  return (
    <Reveal key={request.id} inView={false} variant="rise" distance={4} className="flex flex-col gap-7">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-ui-sm text-fg-muted">
          <Badge variant="outline">{request.area}</Badge>
          <span className="font-mono text-ui-xs">{request.id.toUpperCase()}</span>
          <span aria-hidden>·</span>
          <span>{copy.updated(ago(request.updatedAt))}</span>
        </div>
        <h2 ref={titleRef} id={titleId} tabIndex={-1} className="text-xl font-semibold tracking-tight text-balance text-fg outline-none focus-visible:underline focus-visible:decoration-focus focus-visible:decoration-2 focus-visible:underline-offset-4">
          {request.title}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Select items={LABELS} value={request.status} onValueChange={(value) => value && onStatus(request, value as Status)}>
            <SelectTrigger aria-label={copy.status} size="sm" className="min-w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => onReply(request)}>
            <MessageIcon size={14} /> {copy.replyToAskers}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onMerge(request)}>
            <GitMergeIcon size={14} />
            <span className="max-sm:sr-only">{copy.merge}</span>
          </Button>
        </div>
      </div>

      <dl className="grid grid-cols-3 divide-x divide-line rounded-lg border border-line bg-transparent">
        {figures.map(([label, value]) => (
          <div key={label} className="flex min-w-0 flex-col gap-0.5 px-3 py-2.5">
            <dt className="truncate text-ui-xs text-fg-muted">{label}</dt>
            <dd className="truncate font-mono text-ui text-fg tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="flex flex-col gap-3">
        <Heading>{copy.theAsk}</Heading>
        <figure className="flex flex-col gap-2 border-s-2 border-accent-line ps-4">
          <blockquote className="text-ui leading-relaxed text-pretty text-fg">“{request.quote.text}”</blockquote>
          <figcaption className="text-ui-sm text-fg-muted">
            {request.quote.by}, {request.quote.company}
          </figcaption>
        </figure>
      </section>

      <section className="flex flex-col gap-3">
        <Heading>{copy.whereItStands}</Heading>
        <p className="text-ui leading-relaxed text-pretty text-fg-muted">{request.notes}</p>
        <div className="flex items-center gap-2 text-ui-sm text-fg-muted">
          <Avatar size="sm">
            <AvatarFallback>{initials(request.owner)}</AvatarFallback>
          </Avatar>
          <span>
            {copy.ownedBy} <span className="text-fg">{request.owner}</span>
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-1">
        <Heading>{copy.whosAsking}</Heading>
        <ul className="flex flex-col divide-y divide-line">
          {request.askers.map((asker) => (
            <li key={asker.company} className="flex items-center gap-3 py-2.5">
              <Avatar size="sm" className="rounded-md after:rounded-md [&_[data-slot=avatar-fallback]]:rounded-md">
                <AvatarFallback>{initials(asker.company)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate text-ui text-fg">{asker.company}</span>
              <Badge variant={planTone[asker.plan] ?? 'outline'}>{asker.plan}</Badge>
              <span className="w-16 text-end font-mono text-ui-sm text-fg-muted tabular-nums">{money(asker.arr)}</span>
            </li>
          ))}
        </ul>
      </section>
    </Reveal>
  )
}

/** Nothing open yet: what to do, and the keys that do it. */
export function DetailEmpty({ illustration, copy }: { illustration?: IllustrationSlot; copy: ListDetailCopy }) {
  return (
    <div className="flex h-full min-h-80 flex-col items-center justify-center gap-4 p-8 text-center">
      {illustration !== null && (typeof illustration === 'string' || illustration === undefined ? <Illustration scene={illustration} fallback="idea" unit={18} /> : illustration)}
      <div className="flex flex-col gap-1">
        <p className="font-medium text-fg">{copy.pickTitle}</p>
        <p className="text-ui-sm text-fg-muted">
          {copy.pickMove} <Kbd>↑</Kbd> <Kbd>↓</Kbd> {copy.pickOpen} <Kbd>↵</Kbd>
        </p>
      </div>
    </div>
  )
}
