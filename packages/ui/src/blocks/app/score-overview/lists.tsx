'use client'

import type { ReactNode } from 'react'
import { ShieldCheckIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../../../components/ui/empty'
import { Eyebrow } from '../../../components/ui/typography'
import { cn, listFormat, numberFormat } from '../../../lib/utils'
import type { ScoreOverviewAsset, ScoreOverviewCopy, ScoreOverviewFinding, ScoreOverviewSeverity, ScoreOverviewTone } from './data'
import { TONE_INK } from './trend'

/* The two lists behind the tabs: open findings, worst first, each a row
 * with its severity chip, title, asset and age, that opens the finding; and
 * the assets with findings, each with its counts by severity. Both scroll
 * inside the panel, so the card keeps its size. */

/** A tone's chip, as the Badge variants name them. */
const BADGE = {
  danger: 'danger',
  warning: 'warning',
  success: 'success',
  accent: 'default',
  muted: 'secondary',
  subtle: 'outline',
} as const satisfies Record<ScoreOverviewTone, string>
const HOUR = 3_600_000

type ListCopy = Pick<ScoreOverviewCopy, 'openFinding' | 'assetFindings' | 'noFindings' | 'noFindingsHint' | 'noAssets' | 'findings' | 'assetsTab'>

function Nothing({ title, hint }: { title: string; hint?: string }) {
  return (
    <Empty className="h-full border-0 py-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ShieldCheckIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {hint && <EmptyDescription>{hint}</EmptyDescription>}
      </EmptyHeader>
    </Empty>
  )
}

function Rows({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ul aria-label={label} className="-mx-2 flex flex-col">
      {children}
    </ul>
  )
}

interface FindingListProps {
  findings: readonly ScoreOverviewFinding[]
  severities: readonly ScoreOverviewSeverity[]
  now: number
  locale: string
  copy: ListCopy
  onOpen?: (finding: ScoreOverviewFinding) => void
}

function FindingList({ findings, severities, now, locale, copy, onOpen }: FindingListProps) {
  if (!findings.length) return <Nothing title={copy.noFindings} hint={copy.noFindingsHint} />
  // How long it has been open, as short as a unit allows: "5h", "3d".
  const age = (at: string, unitDisplay: 'narrow' | 'long' = 'narrow') => {
    const hours = Math.max(0, (now - Date.parse(at)) / HOUR)
    return hours < 48
      ? numberFormat(locale, { style: 'unit', unit: 'hour', unitDisplay }).format(Math.max(1, Math.round(hours)))
      : numberFormat(locale, { style: 'unit', unit: 'day', unitDisplay }).format(Math.round(hours / 24))
  }
  const rank = (id: string) => severities.findIndex((s) => s.id === id)
  const sorted = [...findings].sort((a, b) => rank(a.severity) - rank(b.severity) || Date.parse(a.openedAt) - Date.parse(b.openedAt))
  return (
    <Rows label={copy.findings}>
      {sorted.map((f) => {
        const severity = severities[rank(f.severity)]
        return (
          <li key={f.id}>
            <button
              type="button"
              onClick={() => onOpen?.(f)}
              // The row as shown (severity tag, title, asset, age), then the sentence.
              aria-label={`${severity?.short ?? severity?.label ?? f.severity} ${f.title} ${f.asset} ${age(f.openedAt)}, ${severity?.label ?? f.severity}: ${copy.openFinding(f.title, f.asset, age(f.openedAt, 'long'))}`}
              className="@container/finding flex h-10 w-full min-w-0 items-center gap-2.5 rounded-md px-2 text-start text-ui outline-none hover:bg-hover focus-ring"
            >
              <Badge variant={BADGE[severity?.tone ?? 'subtle']} size="sm" className="w-12 shrink-0 justify-center">
                {severity?.short ?? severity?.label ?? f.severity}
              </Badge>{' '}
              <span className="min-w-0 flex-1 truncate text-fg">{f.title}</span>{' '}
              {/* youj-allow: fixed size, a container query can't read the scale */}
              <span className="max-w-32 shrink truncate font-mono text-ui-sm text-fg-muted @max-[22rem]/finding:hidden">{f.asset}</span>{' '}
              <span className="w-9 shrink-0 text-end font-mono text-ui-sm text-fg-muted tabular-nums">{age(f.openedAt)}</span>
            </button>
          </li>
        )
      })}
    </Rows>
  )
}

interface AssetListProps {
  assets: readonly ScoreOverviewAsset[]
  severities: readonly ScoreOverviewSeverity[]
  locale: string
  copy: ListCopy
}

function AssetList({ assets, severities, locale, copy }: AssetListProps) {
  if (!assets.length) return <Nothing title={copy.noAssets} />
  const count = numberFormat(locale)
  const list = listFormat(locale, { type: 'unit', style: 'short' })
  const weight = (a: ScoreOverviewAsset) => severities.reduce((sum, s, i) => sum + (a.findings[s.id] ?? 0) * 10 ** (severities.length - 1 - i), 0)
  return (
    <div className="-mx-2 flex h-full min-h-0 flex-col">
      {/* The key: what each count column is. */}
      <div aria-hidden className="flex h-7 shrink-0 items-center gap-3 px-2">
        <Eyebrow className="min-w-0 flex-1 truncate text-ui-xs">{copy.assetsTab}</Eyebrow>
        <span className="flex shrink-0 items-center gap-1">
          {severities.map((s) => (
            <Eyebrow key={s.id} className="w-9 text-end text-ui-xs">
              {s.short ?? s.label}
            </Eyebrow>
          ))}
        </span>
      </div>
      <ul aria-label={copy.assetsTab} className="flex min-h-0 flex-1 flex-col overflow-y-auto yj-scrollbar">
        {[...assets]
          .sort((a, b) => weight(b) - weight(a))
          .map((a) => {
            const spoken = list.format(
              severities.filter((s) => (a.findings[s.id] ?? 0) > 0).map((s) => `${count.format(a.findings[s.id] ?? 0)} ${s.label}`),
            )
            return (
              <li key={a.id} className="flex h-10 min-w-0 items-center gap-3 px-2">
                <span className="sr-only">{copy.assetFindings(a.name, spoken)}</span>
                <span aria-hidden className="flex min-w-0 flex-1 items-baseline gap-2">
                  <span className="truncate font-mono text-ui text-fg">{a.name}</span>
                  <span className="shrink-0 truncate text-ui-sm text-fg-muted">{a.kind}</span>
                </span>
                <span aria-hidden className="flex shrink-0 items-center gap-1">
                  {severities.map((s) => {
                    const n = a.findings[s.id] ?? 0
                    return (
                      <span
                        key={s.id}
                        className={cn(
                          'flex w-9 items-center justify-end gap-1.5 font-mono text-ui-sm tabular-nums',
                          n ? 'text-fg' : 'text-fg-subtle',
                        )}
                      >
                        {n > 0 && <span className="size-1.5 shrink-0 rounded-full" style={{ background: TONE_INK[s.tone] }} />}
                        {n ? count.format(n) : '–'}
                      </span>
                    )
                  })}
                </span>
              </li>
            )
          })}
      </ul>
    </div>
  )
}

export { AssetList, FindingList }
