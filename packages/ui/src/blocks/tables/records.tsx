'use client'

import { useId, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { DownloadIcon, MailIcon, PhoneIcon, PlusIcon, TagIcon, TrashIcon, UploadIcon, UserPlusIcon, UsersIcon } from '@youj/icons'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { AsyncButton } from '../../components/ui/async-button'
import { Button } from '../../components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn } from '../../lib/utils'
import { DataGrid, type DataGridOptionTone, type DataGridRowAction, type DataGridSelection, type DataGridView } from './data-grid'
import { HIDDEN, recordColumns } from './records/columns'
import {
  ACTIVITIES,
  DEFAULT_COPY,
  DEMO_NOW,
  OWNERS,
  STAGES,
  TAGS,
  VIEWS,
  demo,
  makeRecords,
  type RecordsTableRecord,
  type RecordsTableActivityKind,
  type RecordsTableCopy,
  type RecordsTableOwner,
  type RecordsTableStage,
  type RecordsTableView,
} from './records/data'
import { RecordDetail } from './records/detail'

/* People you work through (the demo: a sales team's contacts), in a table you work in: faces and organizations, a
 * stage you change in its cell (the pill is a menu; the new stage shows at
 * once and goes back if the save is refused), an owner, a lead score as a
 * meter, an amount, the last touch with its kind, and tags. Views are tabs
 * with their counts, each the records matching what it names, filters are chips,
 * rows open a panel with how to reach the person, and a selection raises a
 * bar to assign, tag, export or delete. Email and Copy phone wait on each
 * row's end. Built on the Data grid block. Pass your `records`, `owners`
 * and `stages`, handle each `on…` (a rejection's message shows above the
 * table); every string is in `copy`. Reduced motion: rows and panels change
 * in place. */

type Many = (records: RecordsTableRecord[]) => Promise<unknown> | unknown

interface RecordsTableProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** The people, one row each. A new array replaces the rows. Default: 36 demo records. */
  records?: RecordsTableRecord[]
  /** The funnel's stages, in order: the Stage menu, its filter and its sort. Default: Lead, Contacted, Qualified, Customer, Churned. */
  stages?: RecordsTableStage[]
  /** The teammates who own records: the Owner column and Assign. Default: four demo teammates. */
  owners?: RecordsTableOwner[]
  /** The tags a record can carry, by key. Default: Hot, Champion, Decision maker, On trial, Met at event. */
  tags?: Record<string, { label: string; tone?: DataGridOptionTone }>
  /** The kinds of last touch, with the icon beside the date. Default: email, call, meeting, note. */
  activities?: RecordsTableActivityKind[]
  /** The tabs, each the records that match what it names. Default: all, mine, hot leads, customers. */
  views?: RecordsTableView[]
  /** Reads the score as a risk: a low one is the good one. Default false. */
  scoreLowIsBetter?: boolean
  /** The signed-in teammate's id: the `owner: 'me'` view. Default: the first owner. */
  me?: string
  /** The open view's id (controlled). */
  view?: string
  /** The view open at first. Default `all`. */
  defaultView?: string
  onViewChange?: (view: string) => void
  /** The currency of open deals. Default 'USD'. */
  currency?: string
  /** The moment relative dates count from. Default: the demo's fixed moment, so server and browser agree. */
  now?: number | Date
  /** A record's stage changed in its cell. It shows at once; a rejection puts the old stage back and shows its message. Default: a demo save. */
  onStageChange?: (record: RecordsTableRecord, stage: string) => Promise<unknown> | unknown
  /** Enter on a row, or a click on its name. Default: its detail panel opens. */
  onRecordOpen?: (record: RecordsTableRecord) => void
  /** Email, from a row or its panel. Default: a demo wait. */
  onEmail?: (record: RecordsTableRecord) => Promise<unknown> | unknown
  /** Assign, from a row or the selection. Default: assigned here only. */
  onAssign?: (records: RecordsTableRecord[], owner: string) => Promise<unknown> | unknown
  /** Tag, from the selection. Default: tagged here only. */
  onTag?: (records: RecordsTableRecord[], tag: string) => Promise<unknown> | unknown
  /** Export the selection. Default: a demo wait. */
  onExport?: Many
  /** Delete: the rows leave at once and come back if it rejects. Default: deleted here only. */
  onDelete?: Many
  /** The header's Add record. Default: a demo wait. */
  onCreate?: () => Promise<unknown> | unknown
  /** The header's Import. Default: a demo wait. */
  onImport?: () => Promise<unknown> | unknown
  /** Header buttons in place of Import and Add record. */
  actions?: ReactNode
  loading?: boolean
  error?: ReactNode
  onRetry?: () => void
  /** Shown when there are no records. Default: the table's empty state from `copy.empty…`, with Import. */
  empty?: ReactNode
  /** The title's level when embedded. Default 2. */
  headingLevel?: 2 | 3 | 4
  /** Wraps the table in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another page: the card alone, a `section` named by its title. Default true; `false` draws a page around it. */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at 72rem. Default false. */
  fill?: boolean
  /** Any of the table's strings, to rewrite or translate. */
  copy?: Partial<RecordsTableCopy>
  /** Formats its counts, money and dates (BCP 47). Default: the app's locale (YoujProvider). */
  locale?: string
}

const reason = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback)

function RecordsTable({
  records: recordsProp,
  stages = STAGES,
  owners = OWNERS,
  tags = TAGS,
  activities = ACTIVITIES,
  views: viewsProp = VIEWS,
  scoreLowIsBetter = false,
  me = owners[0]?.id,
  view,
  defaultView = 'all',
  onViewChange,
  currency = 'USD',
  now = DEMO_NOW,
  onStageChange,
  onRecordOpen,
  onEmail,
  onAssign,
  onTag,
  onExport,
  onDelete,
  onCreate,
  onImport,
  actions,
  loading,
  error,
  onRetry,
  empty,
  headingLevel = 2,
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale: localeProp,
  className,
  ...rest
}: RecordsTableProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Title = embedded ? (`h${headingLevel}` as const) : 'h1'
  const { announce, announcer } = useAnnouncer()
  const source = useMemo(() => recordsProp ?? makeRecords(), [recordsProp])
  const [records, setRecords] = useState(source)
  // New records from the app replace the rows, and any change made here.
  const [shown, setShown] = useState(source)
  if (source !== shown) {
    setShown(source)
    setRecords(source)
  }
  const [failure, setFailure] = useState<string | null>(null)

  /** Changes rows here at once, runs the app's callback (or the demo's wait), and undoes the change with its reason if it rejects. */
  const commit = async (change: (list: RecordsTableRecord[]) => RecordsTableRecord[], run: () => unknown, failed = copy.failed) => {
    let before: RecordsTableRecord[] = []
    setRecords((list) => {
      before = list
      return change(list)
    })
    setFailure(null)
    try {
      await run()
      return true
    } catch (thrown) {
      setRecords(before)
      setFailure(reason(thrown, failed))
      return false
    }
  }
  const changeStage = async (record: RecordsTableRecord, stage: string) => {
    const label = stages.find((s) => s.id === stage)?.label ?? stage
    const ok = await commit(
      (list) => list.map((c) => (c.id === record.id ? { ...c, stage } : c)),
      () => (onStageChange ? onStageChange(record, stage) : demo('RecordsTable: onStageChange', 500)),
      copy.stageFailed(record.name),
    )
    if (ok) announce(copy.stageChanged(record.name, label))
  }
  const assign = (rows: RecordsTableRecord[], owner: string) =>
    commit((list) => list.map((c) => (rows.some((r) => r.id === c.id) ? { ...c, owner } : c)), () => (onAssign ? onAssign(rows, owner) : demo('RecordsTable: onAssign', 400)))
  const tag = (rows: RecordsTableRecord[], key: string) =>
    commit(
      (list) => list.map((c) => (rows.some((r) => r.id === c.id) && !c.tags.includes(key) ? { ...c, tags: [...c.tags, key] } : c)),
      () => (onTag ? onTag(rows, key) : demo('RecordsTable: onTag', 400)),
    )
  const remove = async (rows: RecordsTableRecord[]) => {
    const ids = rows.map((r) => r.id)
    if (await commit((list) => list.filter((c) => !ids.includes(c.id)), () => (onDelete ? onDelete(rows) : demo('RecordsTable: onDelete', 400))))
      announce(copy.deleted(copy.people(rows.length.toLocaleString(locale), rows.length)))
  }
  const email = (record: RecordsTableRecord) => commit((list) => list, () => (onEmail ? onEmail(record) : demo('RecordsTable: onEmail', 300)))

  // Columns and actions are built once per input, so the grid keeps its state; they call the latest handlers.
  const latest = useRef({ changeStage, email, assign, remove })
  useLayoutEffect(() => {
    latest.current = { changeStage, email, assign, remove }
  })
  const [call] = useState(() => ({
    changeStage: (c: RecordsTableRecord, s: string) => latest.current.changeStage(c, s),
    email: (c: RecordsTableRecord) => latest.current.email(c),
    assign: (c: RecordsTableRecord, owner: string) => latest.current.assign([c], owner),
    remove: (c: RecordsTableRecord) => latest.current.remove([c]),
  }))
  const copyKey = JSON.stringify(copyProp ?? null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: copyKey is copyProp's JSON, so a copy written inline doesn't rebuild the columns on every render; copy is read from the same value
  const columns = useMemo(
    () => recordColumns({ copy, stages, owners, tags, activities, lowIsBetter: scoreLowIsBetter, currency, onStageChange: call.changeStage }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- copyKey is copyProp's JSON, so a copy written inline doesn't rebuild the columns on every render; copy is read from the same value
    [copyKey, stages, owners, tags, activities, scoreLowIsBetter, currency],
  )
  const rowActions = (record: RecordsTableRecord): DataGridRowAction<RecordsTableRecord>[] => [
    { label: copy.actions.email, icon: MailIcon, inline: true, onSelect: call.email },
    ...(record.phone ? [{ label: copy.actions.call, icon: PhoneIcon, inline: true, onSelect: (c: RecordsTableRecord) => void navigator.clipboard?.writeText(c.phone ?? '').catch(() => {}) }] : []),
    ...(me ? [{ label: `${copy.actions.assign} ${owners.find((o) => o.id === me)?.name ?? me}`, icon: UserPlusIcon, onSelect: (c: RecordsTableRecord) => call.assign(c, me) }] : []),
    { label: copy.actions.delete, icon: TrashIcon, destructive: true, separated: true, onSelect: call.remove },
  ]
  const views = useMemo<DataGridView[]>(
    () =>
      viewsProp
        .filter((v) => v.owner !== 'me' || me)
        .map((v) => {
          const owner = v.owner === 'me' ? me : v.owner
          const matches = (r: RecordsTableRecord) => (!owner || r.owner === owner) && (!v.tag || r.tags.includes(v.tag)) && (!v.stage || r.stage === v.stage)
          const filters = [
            ...(owner ? [{ id: 'owner', value: [owner] }] : []),
            ...(v.tag ? [{ id: 'tags', value: [v.tag] }] : []),
            ...(v.stage ? [{ id: 'stage', value: [v.stage] }] : []),
          ]
          return { id: v.id, label: v.label, state: { ...(filters.length ? { columnFilters: filters } : {}), ...(v.byScore ? { sorting: [{ id: 'score', desc: true }] } : {}) }, count: records.filter(matches).length }
        }),
    [viewsProp, records, me],
  )
  const startView = views.find((v) => v.id === (view ?? defaultView))?.state
  const companies = new Set(records.map((c) => c.org)).size

  const bulk = (selection: DataGridSelection<RecordsTableRecord>) => (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
          <UserPlusIcon />
          {copy.bulk.assign}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-44">
          <DropdownMenuLabel>{copy.actions.assign}</DropdownMenuLabel>
          {owners.map((owner) => (
            <DropdownMenuItem key={owner.id} onClick={() => assign(selection.rows, owner.id)}>
              {owner.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
          <TagIcon />
          {copy.bulk.tag}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-44">
          <DropdownMenuLabel>{copy.actions.tag}</DropdownMenuLabel>
          {Object.entries(tags).map(([key, t]) => (
            <DropdownMenuItem key={key} onClick={() => tag(selection.rows, key)}>
              {t.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <AsyncButton variant="ghost" size="sm" onAction={() => (onExport ? onExport(selection.rows) : demo('RecordsTable: onExport', 600))}>
        <DownloadIcon />
        {copy.bulk.export}
      </AsyncButton>
      <Button
        variant="ghost"
        size="sm"
        className="text-danger-text hover:bg-danger-subtle hover:text-danger-text"
        onClick={() => {
          void remove(selection.rows)
          selection.clear()
        }}
      >
        <TrashIcon />
        {copy.bulk.delete}
      </Button>
    </>
  )

  const header = (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <Title id={titleId} className="text-ui-lg font-semibold tracking-tight text-balance text-fg">
          {copy.title}
        </Title>
        <p className="text-ui-sm text-fg-muted tabular-nums">{copy.description(records.length.toLocaleString(locale), companies.toLocaleString(locale))}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions ?? (
          <>
            <AsyncButton variant="outline" size="sm" onAction={() => (onImport ? onImport() : demo('RecordsTable: onImport', 700))}>
              <UploadIcon />
              {copy.import}
            </AsyncButton>
            <AsyncButton size="sm" onAction={() => (onCreate ? onCreate() : demo('RecordsTable: onCreate', 500))}>
              <PlusIcon />
              {copy.add}
            </AsyncButton>
          </>
        )}
      </div>
    </header>
  )

  const card = (
    // People and companies stay neutral discs: the colour in the table is kept for the stage.
    <div className="flex flex-col gap-4 text-fg [&_[data-slot=avatar-fallback]]:bg-band [&_[data-slot=avatar-fallback]]:text-fg-muted">
      {header}
      {failure && (
        <Alert variant="danger" onOpenChange={() => setFailure(null)} dismissLabel={copy.dismiss}>
          <AlertDescription>{failure}</AlertDescription>
        </Alert>
      )}
      {empty !== undefined && !loading && !error && records.length === 0 ? (
        empty
      ) : (
        <DataGrid<RecordsTableRecord>
          fill
          key={view}
          aria-labelledby={titleId}
          rows={records}
          columns={columns}
          getRowId={(c) => c.id}
          getRowLabel={(c) => c.name}
          copy={{ noun: copy.noun }}
          locale={locale}
          now={now}
          loading={loading}
          error={error}
          onRetry={onRetry}
          views={views}
          activeView={view}
          defaultActiveView={defaultView}
          onActiveViewChange={onViewChange}
          search={{ placeholder: copy.search }}
          selectable
          rowActions={rowActions}
          onRowOpen={onRecordOpen}
          renderDetail={(c) => <RecordDetail record={c} owners={owners} copy={copy} onEmail={(x) => latest.current.email(x)} />}
          bulkActions={bulk}
          pageSize={12}
          initialState={{ columnVisibility: HIDDEN, ...startView }}
          empty={{
            title: copy.emptyTitle,
            description: copy.emptyDescription,
            illustration: (
              <span className="grid size-12 place-items-center rounded-2xl border border-line bg-band text-fg-muted">
                <UsersIcon />
              </span>
            ),
          }}
        />
      )}
      {announcer}
    </div>
  )

  const view_ = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-6xl', className)}>
      {card}
    </section>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('min-h-dvh w-full bg-canvas px-4 py-10 text-fg sm:px-8', className)}>
      <div className={cn('mx-auto w-full', !fill && 'max-w-6xl')}>{card}</div>
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view_}</ThemeScope> : view_
}

export { RecordsTable, type RecordsTableProps }
export type { RecordsTableRecord, RecordsTableCopy, RecordsTableOwner, RecordsTableStage, RecordsTableActivityKind, RecordsTableView } from './records/data'
