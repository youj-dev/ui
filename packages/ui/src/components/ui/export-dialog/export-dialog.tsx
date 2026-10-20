'use client'

import { useEffect, useId, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { exportDialogLabels, useComponentLabels } from '@youj/core/labels'
import { useLocale } from '@youj/core'
import { Collapse } from '@youj/motion'
import { useControllableState } from '../../../hooks/use-controllable-state'
import { useNow } from '../../../hooks/use-now'
import { cn, numberFormat } from '../../../lib/utils'
import { AsyncButton } from '../async-button'
import { Button } from '../button'
import { DateRangePicker, type DateRange } from '../date-range-picker'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../dialog'
import { ExportColumns, type ExportColumn } from './export-dialog-columns'
import { EXPORT_PRESET_IDS, formatExportRange, presetRange, type ExportPresetId, type ExportRange } from './export-dialog-range'
import { RadioGroup, RadioGroupItem } from '../radio-group'
import { SegmentedControl, SegmentedControlItem } from '../segmented-control'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select'

/* Choose what leaves and in which shape, then export it. Top to bottom: a
 * summary of what the choice holds (how many, how much, which days: a status
 * region that updates as the range changes), the date ranges as one soft list
 * (each preset shows the days it stands for; Custom opens the Date Range
 * Picker underneath and the dialog grows to fit it), and the options: file
 * format, time zone and columns. Export is an Async Button: it works, then
 * says done or failed, or says the file will arrive by email when the app
 * answers `{ emailed: true }`. The summary comes from the app (`summary`),
 * so the numbers are the app's; the dialog only asks again when the range
 * or the time zone moves, keeps the old figures dimmed meanwhile and drops
 * an answer that was overtaken.
 *
 * Focus starts on the chosen range, so Enter-free keyboard use is arrows to
 * move it and Tab on to the options. While an export runs the choices are
 * locked. After it settles, changing anything clears the outcome. */

interface ExportOption {
  value: string
  label: string
}

/** What the summary shows for a request. */
interface ExportSummary {
  /** How many rows the export holds. */
  count: number
  /** Their total, formatted by the app ("€18,240"). Left out when a total means nothing. */
  total?: string
}

/** What the person chose. `period` is a preset id or `custom`. */
interface ExportDialogValue {
  period: string
  /** The range picked under Custom. */
  customRange: DateRange | null
  format: string
  timeZone: string
  /** The chosen column ids. */
  columns: string[]
}

/** What the app is asked for: the summary and the export itself. */
interface ExportRequest extends ExportRange {
  period: string
  format: string
  timeZone: string
  columns: string[]
}

/** What an export can answer. `emailed` says it was too big to wait for and will arrive by email. */
interface ExportResult {
  emailed?: boolean
  /** The address it will arrive at, named in the message. */
  email?: string
}

const DEFAULT_FORMATS: ExportOption[] = [
  { value: 'csv', label: 'CSV' },
  { value: 'xlsx', label: 'XLSX' },
  { value: 'json', label: 'JSON' },
]

const DEFAULT_PRESETS: ExportPresetId[] = ['last7Days', 'last30Days', 'thisMonth', 'lastMonth']

type Outcome = { kind: 'done' } | { kind: 'queued'; email?: string } | { kind: 'error'; message?: string }

interface ExportDialogProps {
  /** Whether the dialog is open (controlled). */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** The element that opens it, rendered as the trigger: `trigger={<Button>Export</Button>}`. */
  trigger?: ReactElement
  /** Default "Export data". */
  title?: ReactNode
  description?: ReactNode
  /** The date ranges offered, in order. Default last 7 days, last 30 days, this month, last month. */
  presets?: ExportPresetId[]
  /** Offer the Custom range. Default true. */
  custom?: boolean
  /** The file formats. Default CSV, XLSX and JSON. */
  formats?: ExportOption[]
  /** The two time zones the switch offers. Default your local one and UTC. */
  timeZones?: readonly [ExportOption, ExportOption]
  /** Every column the file can hold. */
  columns: ExportColumn[]
  /** The choice (controlled). */
  value?: ExportDialogValue
  /** The choice at first (uncontrolled): the first preset, CSV, the first time zone and every column. */
  defaultValue?: Partial<ExportDialogValue>
  onValueChange?: (value: ExportDialogValue) => void
  /** What the chosen range holds, asked again when the range or the time zone changes. Without it the summary shows the period alone. */
  summary?: (request: ExportRequest) => ExportSummary | Promise<ExportSummary>
  /** The count line: `(n) => `${n} payments``. Default "412 rows", in the provider's language. */
  countLabel?: (count: number) => string
  /** Runs the export. Resolve for done (or `{ emailed: true }` when it will arrive by email), reject or throw for failed. */
  onExport: (request: ExportRequest) => ExportResult | void | Promise<ExportResult | void>
  /** Today, for the presets. Default the moment it mounted in the browser (never read while rendering on the server). */
  now?: Date
  /** Default the provider's locale. */
  locale?: string
  className?: string
}

const listClass = 'own:flex flex-col divide-y divide-line-subtle overflow-hidden own:rounded-lg own:bg-well'
const rowClass = 'own:flex min-h-12 items-center justify-between own:gap-3 own:px-3'
const headingClass = 'own:text-ui-sm own:font-medium own:text-fg-muted'

/** One choice in the date range list: its name, what it covers, and the radio at the end. The radio is named by the label alone and described by the days. */
function PeriodRow({ value, label, detail }: { value: string; label: string; detail: string }) {
  const nameId = useId()
  const detailId = useId()
  return (
    <label className={cn(rowClass, 'cursor-default hover:bg-hover has-disabled:opacity-50')}>
      <span className="own:flex min-w-0 flex-1 items-baseline own:gap-2">
        <span id={nameId} className="shrink-0 own:text-ui own:text-fg">
          {label}
        </span>
        <span id={detailId} className="min-w-0 truncate own:text-ui-sm own:text-fg-muted own:tabular-nums">
          {detail}
        </span>
      </span>
      <RadioGroupItem value={value} aria-labelledby={nameId} aria-describedby={detailId} />
    </label>
  )
}

function ExportDialog({
  open: openProp,
  defaultOpen,
  onOpenChange,
  trigger,
  title,
  description,
  presets = DEFAULT_PRESETS,
  custom = true,
  formats = DEFAULT_FORMATS,
  timeZones,
  columns,
  value: valueProp,
  defaultValue,
  onValueChange,
  summary,
  countLabel,
  onExport,
  now: nowProp,
  locale: localeProp,
  className,
}: ExportDialogProps) {
  const labels = useComponentLabels(exportDialogLabels)
  const locale = useLocale(localeProp)
  const mountedAt = useNow(0)
  const now = useMemo(() => nowProp ?? (mountedAt === null ? null : new Date(mountedAt)), [nowProp, mountedAt])
  const zones = timeZones ?? ([{ value: 'local', label: labels.exportTimeZoneLocal }, { value: 'utc', label: 'UTC' }] as const)
  const [open, setOpen] = useControllableState(openProp, defaultOpen ?? false)
  const [value, setValue] = useControllableState<ExportDialogValue>(valueProp, {
    period: defaultValue?.period ?? presets[0] ?? 'custom',
    customRange: defaultValue?.customRange ?? null,
    format: defaultValue?.format ?? formats[0]?.value ?? '',
    timeZone: defaultValue?.timeZone ?? zones[0].value,
    columns: defaultValue?.columns ?? columns.map((column) => column.id),
  })
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [busy, setBusy] = useState(false)
  const popup = useRef<HTMLDivElement>(null)
  const ids = { period: useId(), options: useId(), format: useId(), zone: useId(), columns: useId() }

  const update = (patch: Partial<ExportDialogValue>) => {
    const next = { ...value, ...patch }
    setValue(next)
    onValueChange?.(next)
    setOutcome(null)
  }

  // On the server and in the hydration render there's no today yet (the popup isn't drawn then either).
  const presetRows = useMemo(() => (now ? presets.map((id) => ({ id, label: labels[id], ...presetRange(id, now, locale) })) : []), [presets, now, locale, labels])
  const customRange: ExportRange | null = value.customRange?.from && value.customRange.to ? { from: value.customRange.from, to: value.customRange.to } : null
  const range: ExportRange | null = value.period === 'custom' ? customRange : (presetRows.find((row) => row.id === value.period) ?? null)
  const periodText = range ? formatExportRange(range, locale, { year: true }) : labels.exportCustomHint

  const request: ExportRequest | null = range ? { from: range.from, to: range.to, period: value.period, format: value.format, timeZone: value.timeZone, columns: value.columns } : null
  const askKey = range ? `${range.from.getTime()}-${range.to.getTime()}-${value.timeZone}` : ''
  const ask = useRef(summary)
  const requestRef = useRef(request)
  useEffect(() => {
    ask.current = summary
    requestRef.current = request
  })
  const [answer, setAnswer] = useState<{ key: string; summary?: ExportSummary }>({ key: '' })
  useEffect(() => {
    if (!open || !askKey || !ask.current || !requestRef.current) return
    let current = true
    const settle = (result?: ExportSummary) => current && setAnswer({ key: askKey, summary: result })
    Promise.resolve()
      .then(() => ask.current!(requestRef.current!))
      .then(settle, () => settle())
    return () => {
      current = false
    }
  }, [open, askKey])
  const pending = !!summary && !!askKey && answer.key !== askKey
  const known = answer.summary

  const countText = !summary
    ? null
    : known
      ? known.count === 0
        ? labels.exportNothing
        : (countLabel?.(known.count) ?? labels.itemCount(numberFormat(locale).format(known.count), known.count, labels.rowsNoun))
      : '–'
  const empty = known?.count === 0
  const canExport = !!request && value.columns.length > 0 && !empty && !busy

  const run = async () => {
    setOutcome(null)
    try {
      const result = await onExport(request!)
      setOutcome(result?.emailed ? { kind: 'queued', email: result.email } : { kind: 'done' })
      return result
    } catch (error) {
      setOutcome({ kind: 'error', message: error instanceof Error ? error.message : undefined })
      throw error
    }
  }

  const note =
    outcome?.kind === 'queued'
      ? outcome.email
        ? labels.exportEmailedTo(outcome.email)
        : labels.exportEmailed
      : outcome?.kind === 'error'
        ? (outcome.message ?? labels.exportFailedNote)
        : outcome?.kind === 'done'
          ? labels.done
          : ''
  // Only a queued export and a failure need saying beyond the button; a finished one is its Done.
  const shown = outcome?.kind === 'done' ? '' : note
  const lastShown = useRef('')
  if (shown) lastShown.current = shown

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // The dialog holds while the export runs, so its outcome isn't hidden.
        if (busy && !next) return
        // Reopened, it asks again: the figures may have moved while it was away.
        if (!next) setAnswer({ key: '' })
        setOpen(next)
        onOpenChange?.(next)
      }}
    >
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent
        ref={popup}
        showCloseButton={false}
        data-slot="export-dialog"
        className={className}
        // Focus starts on the chosen range (the radio group's tab stop); on touch on the dialog, so the keyboard stays down.
        initialFocus={(type) => (type === 'touch' ? (popup.current ?? true) : (popup.current?.querySelector<HTMLElement>('[role=radio][aria-checked=true]') ?? true))}
      >
        <DialogHeader>
          <DialogTitle>{title ?? labels.exportDialogTitle}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div
          role="status"
          aria-busy={pending}
          data-slot="export-dialog-summary"
          data-yj-pending={pending || undefined}
          className="own:flex flex-col own:gap-0.5 own:rounded-lg own:bg-well own:px-3 own:py-3 transition-opacity yj-duration-fast ease-standard data-yj-pending:opacity-60"
        >
          {countText !== null && <span className="own:text-ui-lg own:font-semibold own:text-fg own:tabular-nums">{countText}</span>}
          <span className="own:text-ui-sm own:text-fg-muted own:tabular-nums">
            {!empty && known?.total ? `${known.total} · ` : ''}
            {periodText}
          </span>
        </div>

        <div className="own:flex flex-col own:gap-2">
          <h3 id={ids.period} className={headingClass}>
            {labels.exportPeriod}
          </h3>
          <div className={listClass}>
            <RadioGroup
              aria-labelledby={ids.period}
              value={value.period}
              onValueChange={(next) => update({ period: String(next) })}
              disabled={busy}
              className="own:gap-0 divide-y divide-line-subtle"
            >
              {presetRows.map((row) => (
                <PeriodRow key={row.id} value={row.id} label={row.label} detail={row.text} />
              ))}
              {custom && <PeriodRow value="custom" label={labels.exportCustom} detail={customRange ? formatExportRange(customRange, locale, { year: true }) : labels.exportCustomHint} />}
            </RadioGroup>
            {custom && (
              <Collapse open={value.period === 'custom'}>
                <div className="own:px-3 own:py-3">
                  <DateRangePicker
                    presets={false}
                    value={value.customRange}
                    onValueChange={(next) => update({ customRange: next })}
                    disabled={busy}
                    className="w-full"
                  />
                </div>
              </Collapse>
            )}
          </div>
        </div>

        <div className="own:flex flex-col own:gap-2">
          <h3 id={ids.options} className={headingClass}>
            {labels.exportOptions}
          </h3>
          <div className={listClass}>
            <div className={rowClass}>
              <span id={ids.format} className="own:text-ui own:text-fg">
                {labels.exportFormat}
              </span>
              <Select items={formats} value={value.format} onValueChange={(next) => update({ format: String(next) })} disabled={busy}>
                <SelectTrigger aria-labelledby={ids.format} className="min-w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className={rowClass}>
              <span id={ids.zone} className="own:text-ui own:text-fg">
                {labels.exportTimeZone}
              </span>
              <SegmentedControl
                variant="pill"
                aria-labelledby={ids.zone}
                value={value.timeZone}
                onValueChange={(next) => update({ timeZone: next })}
                disabled={busy}
              >
                {zones.map((zone) => (
                  <SegmentedControlItem key={zone.value} value={zone.value}>
                    {zone.label}
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>
            </div>
            <div className={rowClass}>
              <span id={ids.columns} className="own:text-ui own:text-fg">
                {labels.columns}
              </span>
              <ExportColumns
                columns={columns}
                value={value.columns}
                onValueChange={(next) => update({ columns: next })}
                disabled={busy}
                labelledBy={ids.columns}
              />
            </div>
          </div>
        </div>

        <Collapse open={!!shown}>
          <p aria-hidden className={cn('own:text-ui', outcome?.kind === 'error' ? 'own:text-danger-text' : 'own:text-fg-muted')}>
            {shown || lastShown.current}
          </p>
        </Collapse>
        <span className="sr-only" role="status" data-slot="export-dialog-status">
          {outcome?.kind === 'error' ? '' : note}
        </span>
        <span className="sr-only" role="alert" data-slot="export-dialog-alert">
          {outcome?.kind === 'error' ? note : ''}
        </span>

        <DialogFooter>
          <DialogClose render={<Button variant="secondary" disabled={busy} />}>{outcome && outcome.kind !== 'error' ? labels.close : labels.cancel}</DialogClose>
          <AsyncButton
            disabled={!canExport}
            onAction={run}
            onActionStateChange={(state) => setBusy(state === 'pending')}
            pendingLabel={labels.working}
            successLabel={(result) => ((result as ExportResult | undefined)?.emailed ? labels.exportQueued : labels.done)}
            errorLabel={labels.failed}
          >
            {labels.exportAs(formats.find((format) => format.value === value.format)?.label ?? value.format)}
          </AsyncButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export {
  EXPORT_PRESET_IDS,
  ExportDialog,
  formatExportRange,
  presetRange,
  type ExportColumn,
  type ExportDialogProps,
  type ExportDialogValue,
  type ExportOption,
  type ExportPresetId,
  type ExportRange,
  type ExportRequest,
  type ExportResult,
  type ExportSummary,
}
