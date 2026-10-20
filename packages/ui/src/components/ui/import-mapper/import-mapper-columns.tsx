import { useCallback, useEffect, useRef, useState } from 'react'
import { FileTextIcon } from '@youj/icons/components/youj/icons/file-text'
import { Alert, AlertDescription } from '../alert'
import { Badge } from '../badge'
import { Button } from '../button'
import { NativeSelect, NativeSelectOption } from '../native-select'
import { cn, numberFormat } from '../../../lib/utils'
import { formatBytes, type ImportMapperCopy } from './import-mapper-data'
import type { ImportField } from './import-mapper-model'
import type { Importer } from './import-mapper-use-importer'

/** A column's first filled value, to show what it holds. */
const sampleOf = (values: string[]) => values.map((v) => v.trim()).find(Boolean)

interface PartProps {
  m: Importer
  copy: ImportMapperCopy
  /** One control height for everything in the part. The page keeps its small controls; the dialog uses the default. */
  size: 'sm' | 'default'
}

/** The chosen file: its name and shape, and a way to swap it (and, on the page, to drop it). */
export function FileRow({ m, copy, size, locale, onPick, remove }: PartProps & { locale: string; onPick: () => void; remove: boolean }) {
  const file = m.file!
  const headers = file.parsed.headers
  const meta = copy.importMapperFileMeta(file.parsed.rows.length, headers.length, formatBytes(file.size, locale))
  return (
    <div
      data-slot="import-mapper-file"
      data-yj-focus=""
      role="group"
      tabIndex={-1}
      aria-label={`${file.name}: ${meta}`}
      className={cn(
        'own:flex own:shrink-0 items-center gap-3 own:bg-well own:px-3 own:py-2 outline-none focus-visible:outline-2 focus-visible:outline-focus',
        size === 'sm' ? 'own:rounded-lg' : 'own:rounded-md',
      )}
    >
      <span aria-hidden className="own:text-fg-muted">
        <FileTextIcon size={20} trigger="none" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate own:text-ui own:font-medium own:text-fg">{file.name}</p>
        <p className="own:text-ui-sm own:text-fg-muted">{meta}</p>
      </div>
      <Button variant="ghost" size={size} onClick={onPick}>
        {copy.importMapperReplace}
      </Button>
      {remove && (
        <Button variant="ghost" size={size} onClick={m.reset}>
          {copy.importMapperRemove}
        </Button>
      )}
    </div>
  )
}

/** What the file could not be read as, in plain words. */
export function ParseNotice({ m, copy, number }: { m: Importer; copy: ImportMapperCopy; number: Intl.NumberFormat }) {
  if (!m.uploadError && m.parseProblems.length === 0) return null
  return (
    <Alert variant={m.uploadError ? 'danger' : 'warning'} className="own:shrink-0">
      <AlertDescription>
        {m.uploadError ??
          m.parseProblems.slice(0, 2).map((p, i) => (
            <span key={i} className="own:block">
              {p.kind === 'unclosed-quote'
                ? copy.importMapperUnclosedQuote(String(p.line))
                : copy.importMapperRaggedRow(String(p.line), String(p.found), String(p.expected))}
            </span>
          ))}
        {!m.uploadError && m.parseProblems.length > 2 && (
          <span className="own:block">{copy.importMapperProblemsMore(number.format(m.parseProblems.length - 2))}</span>
        )}
      </AlertDescription>
    </Alert>
  )
}

/** A required field with no column yet: the way to pick one. `plain` drops the alert's box for a bare line. */
export function MissingFields({ m, copy, size, plain }: PartProps & { plain: boolean }) {
  const headers = m.file!.parsed.headers
  return m.missing.map((field) => {
    const picker = (
      <>
        <span className={cn('own:font-medium', plain && 'own:text-warning-text')}>{copy.importMapperNotMatched(field.label)}</span>
        <NativeSelect
          size={size}
          aria-label={copy.importMapperPickColumnFor(field.label)}
          value=""
          onChange={(event) => event.target.value && m.setColumn(Number(event.target.value), field.id)}
          className="min-w-44"
        >
          <NativeSelectOption value="">{copy.importMapperPickColumn}</NativeSelectOption>
          {headers.map((header, column) => (
            <NativeSelectOption key={column} value={column}>
              {header || `#${column + 1}`}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </>
    )
    return plain ? (
      <div key={field.id} role="status" data-slot="import-mapper-missing" className="own:flex own:shrink-0 flex-wrap items-center gap-x-3 gap-y-2 own:text-ui">
        {picker}
      </div>
    ) : (
      <Alert key={field.id} variant="warning" role="status" data-slot="import-mapper-missing" className="own:shrink-0">
        <AlertDescription className="own:flex flex-wrap items-center gap-x-3 gap-y-2">{picker}</AlertDescription>
      </Alert>
    )
  })
}

/** Each column of the file with a sample value and the field it goes to. */
export function ColumnList({ m, copy, size, id, fields, locale }: PartProps & { id: string; fields: ImportField[]; locale: string }) {
  const headers = m.file!.parsed.headers
  const number = numberFormat(locale)
  const scroller = useRef<HTMLDivElement>(null)
  const [more, setMore] = useState(false)
  const measure = useCallback(() => {
    const el = scroller.current
    if (el) setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 4)
  }, [])
  // The list's room changes with the summary under it, so measure whenever either resizes.
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    if (el.firstElementChild) observer.observe(el.firstElementChild)
    return () => observer.disconnect()
  }, [measure])

  return (
    <div className="relative own:flex min-h-0 flex-1 flex-col">
      <div aria-hidden className="own:hidden shrink-0 grid-cols-2 gap-3 pb-1 own:text-ui-sm own:font-medium text-fg-muted own:@md/import-mapper:grid">
        <span>
          {copy.importMapperColumn} · {number.format(headers.length)}
        </span>
        <span>{copy.importMapperTarget}</span>
      </div>
      <div ref={scroller} onScroll={measure} data-slot="import-mapper-columns" className="own:min-h-0 own:flex-1 overflow-y-auto yj-scrollbar">
        <ul className="flex flex-col gap-0.5">
          {headers.map((header, column) => {
            const match = m.matches[column]
            const sample = sampleOf(m.columns[column] ?? [])
            const unsure = match?.fieldId != null && match.confidence !== null && match.confidence < 0.9
            return (
              <li key={column} className="grid grid-cols-1 items-center gap-x-3 gap-y-1 py-0.5 @md/import-mapper:grid-cols-2">
                <div className="min-w-0 own:leading-tight">
                  <p id={`${id}-h${column}`} className="truncate own:text-ui own:font-medium own:text-fg">
                    {header || `#${column + 1}`}
                  </p>
                  <p className="truncate own:text-ui-sm own:text-fg-muted">{sample ?? copy.importMapperBlank}</p>
                </div>
                <div className="own:flex items-center gap-2">
                  <NativeSelect
                    size={size}
                    aria-labelledby={`${id}-h${column}`}
                    aria-describedby={unsure ? `${id}-c${column}` : undefined}
                    value={match?.fieldId ?? ''}
                    data-yj-column={column}
                    onChange={(event) => m.setColumn(column, event.target.value || null)}
                    className="min-w-0 flex-1"
                  >
                    <NativeSelectOption value="">{copy.importMapperSkipColumn}</NativeSelectOption>
                    {fields.map((field) => (
                      <NativeSelectOption key={field.id} value={field.id}>
                        {field.required ? `${field.label} (${copy.importMapperRequired})` : field.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  {unsure && (
                    <Badge variant="warning" title={copy.importMapperCheckWhy}>
                      <span id={`${id}-c${column}`}>{copy.importMapperCheck}</span>
                      <span className="sr-only">: {copy.importMapperCheckWhy}</span>
                    </Badge>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
      {/* More columns below: the edge fades instead of cutting a row. */}
      <div
        aria-hidden
        data-yj-more={more || undefined}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-surface to-transparent opacity-0 transition-opacity own:yj-duration-fast data-yj-more:opacity-100"
      />
    </div>
  )
}
