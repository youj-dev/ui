'use client'

import { memo, useContext, useEffect, useRef, useState, type CSSProperties } from 'react'
import { CheckIcon } from '@youj/icons/components/youj/icons/check'
import { CopyIcon } from '@youj/icons/components/youj/icons/copy'
import { ExternalLinkIcon } from '@youj/icons/components/youj/icons/external-link'
import { MinusIcon } from '@youj/icons/components/youj/icons/minus'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Switch } from '../../../components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip'
import { safeLink } from '../../../lib/safe-href'
import { cn } from '../../../lib/utils'
import { GridEnvContext, GridNowContext } from './cells'
import { useCopy } from './copy'
import { dateFormat, hueOf, initials, relativeTime } from './format'
import type { DataGridPerson } from './model'

/* ── Dates: relative, with the exact moment on hover ────────────────────── */

export const DateCell = memo(function DateCell({ time }: { time: number | null }) {
  const { locale } = useContext(GridEnvContext)
  const now = useContext(GridNowContext)
  const labels = useCopy()
  if (time === null) return <span className="own:text-fg-muted">—</span>
  const exact = dateFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(time)
  // Until the browser has the time, the short date: the server's clock isn't the reader's.
  const text = now === null ? dateFormat(locale, { month: 'short', day: 'numeric' }).format(time) : relativeTime(time, now, locale, labels.justNow)
  return (
    <Tooltip>
      <TooltipTrigger render={<time dateTime={new Date(time).toISOString()} />} className="truncate whitespace-nowrap">
        <span aria-hidden={now !== null || undefined}>{text}</span>
        {now !== null && <span className="sr-only">{exact}</span>}
      </TooltipTrigger>
      <TooltipContent>{exact}</TooltipContent>
    </Tooltip>
  )
})

/* ── People: overlapping avatars, the rest as "+2" ──────────────────────── */

export const PeopleCell = memo(function PeopleCell({ people, max }: { people: readonly DataGridPerson[]; max: number }) {
  if (people.length === 0) return <span className="own:text-fg-muted">—</span>
  const shown = people.length === max + 1 ? people : people.slice(0, max)
  const rest = people.length - shown.length
  const names = people.map((person) => person.name).join(', ')
  return (
    <Tooltip>
      <TooltipTrigger render={<span />} className="flex w-fit items-center">
        <span aria-hidden className="own:flex items-center -space-x-1 rtl:space-x-reverse">
          {shown.map((person, index) => (
            <Avatar
              key={person.id}
              size="sm"
              className="own:ring-2 ring-(--dg-row-bg,var(--color-surface)) after:hidden"
              style={{ zIndex: shown.length - index, '--dg-hue': `var(--color-chart-${hueOf(person.name)})` } as CSSProperties}
            >
              {person.src && <AvatarImage src={person.src} alt="" />}
              <AvatarFallback className="bg-[color-mix(in_oklab,var(--dg-hue)_20%,var(--color-surface))] own:text-[length:calc(var(--spacing)*2.5)] font-semibold text-[color-mix(in_oklab,var(--dg-hue)_55%,var(--color-fg))] normal-case">
                {initials(person.name)}
              </AvatarFallback>
            </Avatar>
          ))}
          {rest > 0 && (
            <span className="relative own:grid h-6 min-w-6 place-items-center rounded-full px-1 own:text-ui-xs own:font-medium own:text-fg-muted own:tabular-nums ring-2 ring-(--dg-row-bg,var(--color-surface)) [background:linear-gradient(var(--color-band),var(--color-band)),var(--color-surface)]">
              +{rest}
            </span>
          )}
        </span>
        <span className="sr-only">{names}</span>
      </TooltipTrigger>
      <TooltipContent>{names}</TooltipContent>
    </Tooltip>
  )
})

/* ── Boolean: a switch, or a quiet check ────────────────────────────────── */

export const BooleanCell = memo(function BooleanCell({
  value,
  label,
  onChange,
}: {
  value: boolean
  /** The switch's name: "Auto-renew for Northwind". */
  label: string
  onChange?: (value: boolean) => void
}) {
  const labels = useCopy()
  if (onChange)
    return (
      <Switch
        size="sm"
        data-dg-focus=""
        tabIndex={-1}
        aria-label={label}
        checked={value}
        onCheckedChange={(checked) => onChange(checked)}
      />
    )
  return value ? (
    <span className="own:inline-flex own:text-success-text">
      <CheckIcon size={16} strokeWidth={2} trigger="none" />
      <span className="sr-only">{labels.booleanYes}</span>
    </span>
  ) : (
    <span className="own:inline-flex own:text-fg-subtle">
      <MinusIcon size={16} trigger="none" />
      <span className="sr-only">{labels.booleanNo}</span>
    </span>
  )
})

/* ── A copyable id ──────────────────────────────────────────────────────── */

export const IdCell = memo(function IdCell({ value, copy }: { value: string; copy: boolean }) {
  const labels = useCopy()
  const { announce } = useContext(GridEnvContext)
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <span className="own:flex min-w-0 items-center gap-1">
      <span className="truncate own:font-mono own:text-ui-sm own:text-fg-muted">{value}</span>
      {copy && (
        <button
          type="button"
          data-dg-focus=""
          tabIndex={-1}
          aria-label={labels.copyValue(value)}
          data-copied={copied || undefined}
          onClick={() => {
            const done = () => {
              setCopied(true)
              announce(labels.copied)
              clearTimeout(timer.current)
              timer.current = setTimeout(() => setCopied(false), 1600)
            }
            navigator.clipboard?.writeText(value).then(done, () => announce(labels.copyFailed))
          }}
          className={cn(
            'relative grid size-6 shrink-0 place-items-center rounded-sm text-fg-muted focus-ring',
            'opacity-0 transition-[opacity,color,background-color] yj-duration-fast ease-standard',
            'group-hover/row:opacity-100 focus-visible:opacity-100 data-copied:opacity-100 touch:opacity-100',
            'hover:bg-hover hover:text-fg data-copied:text-success-text',
          )}
        >
          <CopyIcon size={14} active={copied} trigger="none" />
        </button>
      )}
    </span>
  )
})

/* ── A link ─────────────────────────────────────────────────────────────── */

export const LinkCell = memo(function LinkCell({ href, label, external }: { href: string; label: string; external: boolean }) {
  // A URL the row supplies that isn't http(s), mailto or relative (javascript:, data:…) draws as plain text.
  const safe = safeLink(href)
  if (!safe) return <span className="truncate">{label}</span>
  return (
    <a
      href={safe}
      data-dg-focus=""
      tabIndex={-1}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className={cn(
        'group/link inline-flex max-w-full min-w-0 items-center gap-1 rounded-sm text-fg focus-ring',
        'underline decoration-line-strong underline-offset-[3px] transition-[text-decoration-color] yj-duration-fast ease-standard hover:decoration-fg-muted',
      )}
    >
      <span className="truncate">{label}</span>
      {external && (
        <ExternalLinkIcon
          size={12}
          className="own:shrink-0 own:text-fg-muted opacity-0 transition-opacity yj-duration-fast ease-standard group-hover/row:opacity-100 group-focus-visible/link:opacity-100"
        />
      )}
    </a>
  )
})
