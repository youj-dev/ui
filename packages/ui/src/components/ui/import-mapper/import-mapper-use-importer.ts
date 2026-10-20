import { useEffect, useMemo, useRef, useState } from 'react'
import { demo, formatBytes, type ImportMapperCopy } from './import-mapper-data'
import { parseCsv, type ParsedCsv } from './import-mapper-csv'
import {
  autoMatch,
  errorReport,
  findDuplicates,
  plan as planImport,
  rowIssues,
  rowValues,
  type ColumnMatch,
  type DuplicatePolicy,
  type ImportField,
  type ImportIssue,
  type IssueKind,
  type ImportRow,
} from './import-mapper-model'

/** What the app's `onImport` may hand back; anything left out is counted from the plan. */
export interface ImportResult {
  created?: number
  updated?: number
  skipped?: number
}

export interface ImportContext {
  /** The field the duplicates were found by, and what to do with them. */
  keyField: string
  policy: DuplicatePolicy
  /** Aborted if the component unmounts mid-import. */
  signal: AbortSignal
  /** Report how many rows are done, for the progress bar. */
  onProgress: (done: number) => void
}

export interface Loaded {
  name: string
  size: number
  parsed: ParsedCsv
}

type Run =
  | { status: 'idle' }
  | { status: 'running'; done: number; total: number }
  | { status: 'done'; created: number; updated: number; skipped: number }
  | { status: 'failed'; message: string }

interface Options {
  fields: ImportField[]
  keyField?: string
  existing?: readonly string[]
  maxSize: number
  copy: ImportMapperCopy
  locale: string
  onImport?: (rows: ImportRow[], context: ImportContext) => Promise<ImportResult | void> | ImportResult | void
  announce: (message: string, options?: { delay?: number }) => void
}

/** The rows (by index) with one kind of problem in one field: what a summary line counts and its review lists. */
export interface ProblemGroup {
  key: string
  fieldId: string
  kind: IssueKind
  rows: number[]
}

/** Everything the screens share: the file, the mapping, the fixes, the skipped rows and what to do with duplicates. */
export function useImporter({ fields, keyField, existing, maxSize, copy, locale, onImport, announce }: Options) {
  const [file, setFile] = useState<Loaded | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [matches, setMatches] = useState<ColumnMatch[]>([])
  const [fixes, setFixes] = useState<Record<string, string>>({})
  const [skipped, setSkipped] = useState<ReadonlySet<number>>(new Set())
  const [keyId, setKeyId] = useState(
    keyField ?? fields.find((f) => f.type === 'email')?.id ?? fields.find((f) => f.required)?.id ?? fields[0]?.id ?? '',
  )
  const [policy, setPolicy] = useState<DuplicatePolicy>('update')
  const [run, setRun] = useState<Run>({ status: 'idle' })
  const controller = useRef<AbortController | null>(null)
  useEffect(() => () => controller.current?.abort(), [])

  const columns = useMemo(() => file?.parsed.headers.map((_, c) => file.parsed.rows.map((r) => r[c] ?? '')) ?? [], [file])
  const mapping = useMemo(() => matches.map((m) => m.fieldId), [matches])
  const mappedIds = useMemo(() => mapping.filter((id): id is string => id !== null), [mapping])
  const missing = fields.filter((f) => f.required && !mappedIds.includes(f.id))
  const labelOf = (id: string) => fields.find((f) => f.id === id)?.label ?? id
  // The key can only be a mapped field; until it is, the first mapped one stands in.
  const activeKey = mappedIds.includes(keyId) ? keyId : (mappedIds[0] ?? '')

  // The table as it stands: values with the fixes applied, each row's problems, and which rows repeat the key.
  const table = useMemo(() => {
    const rows = (file?.parsed.rows ?? []).map((cells, i) => ({ row: i + 1, values: rowValues(cells, mapping, fixes, i + 1) }))
    const issues = rows.map((r) => rowIssues(r.values, fields, r.row))
    const duplicates = activeKey
      ? findDuplicates(
          rows.map((r) => r.values[activeKey] ?? ''),
          existing,
        )
      : new Set<number>()
    return { rows, issues, duplicates }
  }, [file, mapping, fixes, fields, activeKey, existing])

  // A row that is wrong and not skipped is left out of the import until it is fixed.
  const problems = useMemo(() => {
    const groups = new Map<string, ProblemGroup>()
    table.issues.forEach((list, index) => {
      if (skipped.has(index)) return
      for (const issue of list) {
        const key = `${issue.fieldId}:${issue.kind}`
        const group = groups.get(key) ?? { key, fieldId: issue.fieldId, kind: issue.kind, rows: [] }
        group.rows.push(index)
        groups.set(key, group)
      }
    })
    const order = (g: ProblemGroup) => fields.findIndex((f) => f.id === g.fieldId) * 2 + (g.kind === 'required' ? 0 : 1)
    return [...groups.values()].sort((a, b) => order(a) - order(b))
  }, [table, skipped, fields])
  const skippedRows = [...skipped].filter((i) => i < table.rows.length)
  const outcome = () =>
    planImport(
      table.rows.map((r, i) => (skipped.has(i) || table.issues[i]!.length ? null : r)),
      table.duplicates,
      policy,
    )
  const planned = outcome()
  const duplicateCount = table.rows.filter((_, i) => table.duplicates.has(i) && !skipped.has(i) && !table.issues[i]!.length).length

  const parseProblems = file?.parsed.problems ?? []
  const noun = (count: number) => copy.importMapperItems(count)

  // Counts change as people fix rows; say so once they settle.
  const summary = file ? `${planned.rows.length}:${table.rows.length - planned.rows.length}` : ''
  const lastSummary = useRef('')
  const latest = useRef({ message: '' })
  latest.current.message = copy.importMapperCountsAnnounce(noun(planned.rows.length), table.rows.length - planned.rows.length)
  const idle = run.status === 'idle'
  useEffect(() => {
    if (summary && lastSummary.current && summary !== lastSummary.current && idle) announce(latest.current.message, { delay: 600 })
    lastSummary.current = summary
  }, [summary, idle, announce])

  const load = (text: string, name: string, size: number) => {
    const parsed = parseCsv(text)
    if (!parsed.headers.length || !parsed.rows.length) {
      setFile(null)
      return setUploadError(copy.importMapperEmptyFile)
    }
    const unclosed = parsed.problems.find((p) => p.kind === 'unclosed-quote')
    if (unclosed) {
      setFile(null)
      return setUploadError(copy.importMapperUnclosedQuote(String(unclosed.line)))
    }
    const cols = parsed.headers.map((_, c) => parsed.rows.map((r) => r[c] ?? ''))
    setUploadError(null)
    setFile({ name, size, parsed })
    setMatches(autoMatch(parsed.headers, cols, fields))
    setFixes({})
    setSkipped(new Set())
    setRun({ status: 'idle' })
    lastSummary.current = ''
    announce(`${name}: ${copy.importMapperFileMeta(parsed.rows.length, parsed.headers.length, formatBytes(size, locale))}`)
  }

  const loadFile = async (picked: File) => {
    if (picked.size > maxSize) return setUploadError(copy.importMapperTooLarge(formatBytes(picked.size, locale), formatBytes(maxSize, locale)))
    if (!/\.(csv|tsv|txt)$/i.test(picked.name) && !/csv|text\/plain/.test(picked.type)) return setUploadError(copy.importMapperNotCsv)
    load(await picked.text(), picked.name, picked.size)
  }

  const setColumn = (column: number, fieldId: string | null) => {
    setMatches((current) =>
      current.map((m, c) =>
        c === column ? { fieldId, confidence: null } : fieldId && m.fieldId === fieldId ? { fieldId: null, confidence: null } : m,
      ),
    )
    const header = file?.parsed.headers[column] ?? ''
    announce(fieldId ? copy.importMapperMapped(header, labelOf(fieldId)) : copy.importMapperNotImported(header))
  }

  const fix = (row: number, fieldId: string, value: string) => setFixes((current) => ({ ...current, [`${row}:${fieldId}`]: value }))
  const skipRows = (indexes: number[], on: boolean) =>
    setSkipped((current) => {
      const next = new Set(current)
      for (const index of indexes) {
        if (on) next.add(index)
        else next.delete(index)
      }
      return next
    })

  /** The problems of every wrong row, for the report of what was left out. */
  const leftOut: ImportIssue[] = table.issues.flat()
  const messageOf = (kind: IssueKind) =>
    ({
      required: copy.importMapperErrorRequired,
      email: copy.importMapperErrorEmail,
      number: copy.importMapperErrorNumber,
      date: copy.importMapperErrorDate,
    })[kind]
  const report = () =>
    errorReport(
      leftOut,
      [copy.importMapperRow, copy.importMapperReportField, copy.importMapperReportValue, copy.importMapperReportProblem],
      labelOf,
      messageOf,
    )

  const start = async () => {
    const result = outcome()
    const total = result.rows.length
    controller.current?.abort()
    const abort = (controller.current = new AbortController())
    setRun({ status: 'running', done: 0, total })
    const onProgress = (done: number) => !abort.signal.aborted && setRun({ status: 'running', done: Math.min(done, total), total })
    try {
      let given: ImportResult | void = undefined
      if (onImport) given = await onImport(result.rows, { keyField: activeKey, policy, signal: abort.signal, onProgress })
      else {
        for (let done = 0; done < total; done += Math.max(1, Math.ceil(total / 8))) {
          await demo('ImportMapper: onImport', 220)
          onProgress(done)
        }
        await demo('ImportMapper: onImport', 220)
      }
      if (abort.signal.aborted) return
      const done = {
        status: 'done' as const,
        created: given?.created ?? result.created,
        updated: given?.updated ?? result.updated,
        skipped: given?.skipped ?? result.skipped,
      }
      setRun(done)
      announce(copy.importMapperDoneAnnounce(noun(done.created + done.updated), done.skipped))
    } catch (error) {
      if (abort.signal.aborted) return
      const message = error instanceof Error ? error.message : String(error)
      setRun({ status: 'failed', message })
      announce(copy.importMapperFailed(message))
    }
  }

  /** Back to the mapping after a failed import, with everything kept. */
  const back = () => setRun({ status: 'idle' })

  const reset = () => {
    controller.current?.abort()
    setFile(null)
    setMatches([])
    setFixes({})
    setSkipped(new Set())
    setUploadError(null)
    setRun({ status: 'idle' })
  }

  return {
    file,
    uploadError,
    setUploadError,
    load,
    loadFile,
    columns,
    matches,
    setColumn,
    missing,
    mappedIds,
    labelOf,
    table,
    problems,
    skippedRows,
    fix,
    skipRows,
    keyId: activeKey,
    setKeyId,
    policy,
    setPolicy,
    duplicateCount,
    run,
    start,
    back,
    reset,
    report,
    leftOut,
    parseProblems,
    importCount: planned.rows.length,
    noun,
  }
}

export type Importer = ReturnType<typeof useImporter>
