'use client'

import { ChevronDownIcon } from '@youj/icons'
import { Badge, BadgeDot } from '../../../components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu'
import { cn } from '../../../lib/utils'
import { DateCell, createDataGridColumns, type DataGridOptionTone, type DataGridPerson } from '../data-grid'
import type { RecordsTableActivityKind, RecordsTableRecord, RecordsTableCopy, RecordsTableOwner, RecordsTableStage } from './data'

const col = createDataGridColumns<RecordsTableRecord>()

/* A stage's pill in its own tone: the grid's status colors, or a chart color
 * (a tenth of it behind its ink) for stages that are neither good nor bad. */
const BADGE = { neutral: 'secondary', accent: 'default', success: 'success', warning: 'warning', danger: 'danger' } as const
const isChart = (tone: DataGridOptionTone): tone is Exclude<DataGridOptionTone, keyof typeof BADGE> => tone.startsWith('chart')

function StagePill({ stage, editable }: { stage: RecordsTableStage; editable?: boolean }) {
  const color = isChart(stage.tone) ? `var(--color-${stage.tone})` : undefined
  return (
    <Badge
      variant={color ? 'secondary' : BADGE[stage.tone as keyof typeof BADGE]}
      style={color ? { backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)`, color: `color-mix(in oklab, ${color} 62%, var(--color-fg))` } : undefined}
      className="gap-1.5"
    >
      <BadgeDot style={color ? { backgroundColor: color } : undefined} />
      {stage.label}
      {editable && <ChevronDownIcon aria-hidden size={12} className="-me-0.5 opacity-0 transition-opacity yj-duration-fast ease-standard group-hover/stage:opacity-70 group-focus-visible/stage:opacity-70 group-data-popup-open/stage:opacity-70 touch:opacity-70" />}
    </Badge>
  )
}

/**
 * The stage, changed where it's read: the pill is a menu of the stages, each
 * with its dot. The new stage shows at once; the block saves it and puts the
 * old one back if the save is refused.
 */
function StageCell({
  record,
  stages,
  onChange,
  copy,
}: {
  record: RecordsTableRecord
  stages: RecordsTableStage[]
  onChange?: (record: RecordsTableRecord, stage: string) => void
  copy: RecordsTableCopy
}) {
  const stage = stages.find((s) => s.id === record.stage) ?? { id: record.stage, label: record.stage, tone: 'neutral' as const }
  if (!onChange) return <StagePill stage={stage} />
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            data-dg-focus=""
            tabIndex={-1}
            aria-label={`${copy.changeStage(record.name)}: ${stage.label}`}
            className="group/stage -my-1 inline-flex max-w-full rounded-full py-1 focus-ring"
          />
        }
      >
        <StagePill stage={stage} editable />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        <DropdownMenuLabel>{copy.columns.stage}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={record.stage} onValueChange={(value) => value !== record.stage && onChange(record, String(value))}>
          {stages.map((option) => (
            <DropdownMenuRadioItem key={option.id} value={option.id} closeOnClick>
              <StagePill stage={option} />
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** The last touch: what it was, and when, relative to now with the exact moment on hover. */
function ActivityCell({ record, activities }: { record: RecordsTableRecord; activities: RecordsTableActivityKind[] }) {
  const activity = record.lastActivity
  if (!activity) return <span className="text-fg-muted">—</span>
  const kind = activities.find((k) => k.id === activity.kind)
  const Icon = kind?.icon
  return (
    <span className="flex min-w-0 items-center gap-2 text-fg-muted">
      {Icon && <Icon aria-hidden size={14} className={cn('shrink-0', kind.accent && 'text-accent-text')} />}
      <span className="sr-only">{kind?.label ?? activity.kind}</span>
      <span className="min-w-0 truncate text-fg">
        <DateCell time={new Date(activity.at).getTime()} />
      </span>
    </span>
  )
}

/** The table's columns, for the copy, stages, owners and tags the block was given. */
export function recordColumns({
  copy,
  stages,
  owners,
  tags,
  activities,
  lowIsBetter,
  currency,
  onStageChange,
}: {
  copy: RecordsTableCopy
  stages: RecordsTableStage[]
  owners: RecordsTableOwner[]
  tags: Record<string, { label: string; tone?: DataGridOptionTone }>
  activities: RecordsTableActivityKind[]
  lowIsBetter: boolean
  currency: string
  onStageChange?: (record: RecordsTableRecord, stage: string) => void
}) {
  const h = copy.columns
  const people = (record: RecordsTableRecord): DataGridPerson[] => {
    const owner = owners.find((o) => o.id === record.owner)
    return owner ? [{ id: owner.id, name: owner.name, src: owner.avatar }] : []
  }
  return [
    col.identity('name', { header: h.name, secondary: (c) => c.email, src: (c) => c.avatar, size: 248 }),
    col.identity('org', { header: h.org, shape: 'square', secondary: (c) => c.orgNote, size: 208 }),
    col.status('stage', {
      header: h.stage,
      options: stages.map((s) => ({ value: s.id, label: s.label, tone: s.tone })),
      size: 140,
      render: (_, record) => <StageCell record={record} stages={stages} onChange={onStageChange} copy={copy} />,
    }),
    col.people(people, { id: 'owner', header: h.owner, max: 1, size: 96 }),
    col.meter('score', { header: h.score, max: 100, tone: (ratio) => { const good = lowIsBetter ? 1 - ratio : ratio; return good >= 0.7 ? 'success' : good < 0.3 ? 'warning' : 'neutral' }, format: (n) => String(Math.round(n)), size: 132 }),
    col.currency('value', { header: h.value, currency, compact: true, size: 112 }),
    col.date((c) => c.lastActivity?.at ?? null, { id: 'lastActivity', header: h.lastActivity, render: (_, record) => <ActivityCell record={record} activities={activities} />, size: 150 }),
    col.tags('tags', { header: h.tags, options: tags, size: 196, minSize: 170, meta: { grow: true } }),
    col.text('title', { header: h.title, muted: true, size: 168 }),
    col.text('location', { header: h.location, groupable: true, facet: true, size: 132 }),
  ]
}

/** The columns a first visit shows; the rest wait in the Columns menu. */
/** Hidden at first, so the table fits a laptop's width; each is a View options click away. */
export const HIDDEN = { title: false, location: false, tags: false, score: false }
