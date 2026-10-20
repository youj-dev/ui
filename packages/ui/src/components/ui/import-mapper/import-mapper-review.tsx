import { useId } from 'react'
import { CheckIcon } from '@youj/icons/components/youj/icons/check'
import { Button } from '../button'
import { Input } from '../input'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '../sheet'
import { check, type ImportField, type IssueKind } from './import-mapper-model'
import type { ImportMapperCopy } from './import-mapper-data'
import type { Importer, ProblemGroup } from './import-mapper-use-importer'

interface ReviewSheetProps {
  m: Importer
  copy: ImportMapperCopy
  fields: ImportField[]
  /** The most cards drawn at once; the counts always cover every row. */
  previewRows: number
  number: Intl.NumberFormat
  open: boolean
  /** The problem being reviewed (kept while the sheet closes). */
  group: ProblemGroup | null
  /** The rows the group had when the sheet opened: they stay listed while they are fixed, so a card never vanishes under the cursor. */
  rows: number[]
  onClose: () => void
}

/** A focused list of only the rows with one problem: each row's name and the one wrong value, editable, with the error under it. */
export function ReviewSheet({ m, copy, fields, previewRows, number, open, group, rows, onClose }: ReviewSheetProps) {
  const id = useId()
  const field = fields.find((f) => f.id === group?.fieldId)
  const shown = rows.slice(0, previewRows)
  const message = (kind: IssueKind) =>
    ({
      required: copy.importMapperErrorRequired,
      email: copy.importMapperErrorEmail,
      number: copy.importMapperErrorNumber,
      date: copy.importMapperErrorDate,
    })[kind]
  // What is left to fix: shown rows that are still wrong and not skipped.
  const left = group ? shown.filter((i) => !m.skippedRows.includes(i) && field && check(field, m.table.rows[i]?.values[field.id] ?? '')).length : 0
  const title =
    group && field ? (group.kind === 'required' ? copy.importMapperIssueMissing : copy.importMapperIssueInvalid)(rows.length, field.label) : ''
  /** What names the row: its first filled field other than the one being fixed. */
  const nameOf = (index: number) => {
    const values = m.table.rows[index]?.values ?? {}
    const other = fields.find((f) => f.id !== field?.id && (values[f.id] ?? '').trim())
    return other ? values[other.id]!.trim() : ''
  }

  return (
    <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
      <SheetContent variant="floating" data-slot="import-mapper-review">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription role="status" aria-live="polite">
            {left > 0 ? copy.importMapperLeft(left) : copy.importMapperAllGood}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          <ul className="flex flex-col gap-3">
            {field &&
              shown.map((index) => {
                const row = m.table.rows[index]!
                const value = row.values[field.id] ?? ''
                const kind = check(field, value)
                const skipped = m.skippedRows.includes(index)
                const name = nameOf(index)
                const inputId = `${id}-${row.row}`
                const errorId = `${inputId}-error`
                return (
                  <li key={row.row} data-yj-skipped={skipped || undefined} className="flex flex-col gap-2 rounded-lg bg-well p-3">
                    <div className="own:flex items-baseline justify-between gap-2 own:text-ui-sm text-fg-muted">
                      <p id={`${inputId}-name`} className="min-w-0 truncate">
                        {name || `${copy.importMapperRow} ${row.row}`}
                      </p>
                      {name && <span className="shrink-0">{`${copy.importMapperRow} ${row.row}`}</span>}
                    </div>
                    {skipped ? (
                      <div className="own:flex items-center justify-between gap-2">
                        <p className="own:text-ui-sm own:text-fg-muted">{copy.importMapperRowSkipped}</p>
                        <Button variant="ghost" size="sm" onClick={() => m.skipRows([index], false)}>
                          {copy.undo}
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="own:flex flex-col gap-1">
                          <label htmlFor={inputId} className="text-ui font-medium text-fg">
                            {field.label}
                          </label>
                          <Input
                            id={inputId}
                            aria-label={copy.importMapperEditCell(String(row.row), field.label)}
                            value={value}
                            aria-invalid={kind ? true : undefined}
                            aria-describedby={kind ? errorId : undefined}
                            onChange={(event) => m.fix(row.row, field.id, event.target.value)}
                          />
                          <p id={errorId} className="min-h-5 own:text-ui-sm own:text-danger-text">
                            {kind ? (
                              message(kind)
                            ) : (
                              <span className="own:inline-flex items-center gap-1 own:text-success-text">
                                <CheckIcon trigger="none" size={14} />
                                {copy.importMapperRowFixed}
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <Button variant="ghost" size="sm" aria-describedby={`${inputId}-name`} onClick={() => m.skipRows([index], true)}>
                            {copy.importMapperSkipThisRow}
                          </Button>
                        </div>
                      </>
                    )}
                  </li>
                )
              })}
          </ul>
          {rows.length > shown.length && (
            <p className="own:text-ui-sm own:text-fg-muted">{copy.importMapperShowing(number.format(shown.length), number.format(rows.length))}</p>
          )}
        </SheetBody>
        <SheetFooter>
          <Button onClick={onClose}>{copy.done}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
