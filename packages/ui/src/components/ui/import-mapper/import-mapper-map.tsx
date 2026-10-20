import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '../button'
import type { ImportMapperCopy } from './import-mapper-data'
import { ColumnList, FileRow, MissingFields, ParseNotice } from './import-mapper-columns'
import { Issues } from './import-mapper-issues'
import type { ImportField } from './import-mapper-model'
import { ReviewSheet } from './import-mapper-review'
import type { Importer, ProblemGroup } from './import-mapper-use-importer'
import { numberFormat } from '../../../lib/utils'

interface MapStepProps {
  m: Importer
  copy: ImportMapperCopy
  fields: ImportField[]
  locale: string
  /** The most problem rows a review lists at once. */
  previewRows: number
  /** `page` (default): everything on one screen. `dialog`: columns first, then a second step for what needs attention. */
  variant?: 'page' | 'dialog'
  onPick: () => void
}

/** The one working screen: the file, each of its columns and the field it goes to, what needs attention, and the button that says what will happen.
 * In the dialog variant the same parts are split over two steps with one footer: the columns with Start over / Continue, then what needs attention with Back / the import button. */
export function MapStep({ m, copy, fields, locale, previewRows, variant = 'page', onPick }: MapStepProps) {
  const id = useId()
  const dialog = variant === 'dialog'
  const size = dialog ? 'default' : 'sm'
  const number = numberFormat(locale)
  const [review, setReview] = useState<{ group: ProblemGroup; rows: number[] } | null>(null)
  const [reviewing, setReviewing] = useState(false)
  const [step, setStep] = useState<'columns' | 'confirm'>('columns')
  const summary = useRef<HTMLDivElement>(null)
  const importButton = useRef<HTMLButtonElement>(null)
  const continueButton = useRef<HTMLButtonElement>(null)
  const shown = useRef(step)

  // A step change takes focus to the thing that replaced the one pressed.
  useEffect(() => {
    if (shown.current === step) return
    shown.current = step
    ;(step === 'confirm' ? importButton : continueButton).current?.focus()
  }, [step])

  // A resolved line leaves the summary, and focus with it: move on to the next one, else to the button.
  const settle = () => setTimeout(() => (summary.current?.querySelector<HTMLElement>('[data-yj-review]') ?? importButton.current)?.focus(), 0)
  const blocked =
    m.missing.length > 0 ? copy.importMapperBlocked(m.missing.map((f) => f.label).join(', ')) : m.importCount === 0 ? copy.importMapperNothing : null
  const reasonId = `${id}-reason`
  const showColumns = !dialog || step === 'columns'
  const showIssues = !dialog || step === 'confirm'

  const importBar = (
    <>
      <p id={reasonId} role="status" className="min-w-0 flex-1 own:text-ui-sm own:text-fg-muted">
        {blocked}
      </p>
      <Button
        ref={importButton}
        data-slot="import-mapper-import"
        disabled={blocked !== null}
        aria-describedby={blocked ? reasonId : undefined}
        onClick={m.start}
      >
        {copy.importMapperImport(m.noun(m.importCount))}
      </Button>
    </>
  )

  return (
    <div className="own:flex h-full flex-col gap-3">
      <FileRow m={m} copy={copy} size={size} locale={locale} onPick={onPick} remove={!dialog} />
      <ParseNotice m={m} copy={copy} number={number} />
      {showColumns && <MissingFields m={m} copy={copy} size={size} plain={dialog} />}
      {showColumns && <ColumnList m={m} copy={copy} size={size} id={id} fields={fields} locale={locale} />}

      {showIssues && (
        <div
          ref={summary}
          data-slot="import-mapper-summary"
          className={dialog ? 'own:flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto yj-scrollbar' : 'own:flex shrink-0 flex-col gap-2 own:pt-1'}
        >
          <Issues
            m={m}
            copy={copy}
            id={id}
            size={size}
            onReview={(group) => {
              setReview({ group, rows: group.rows })
              setReviewing(true)
            }}
            settle={settle}
          />
          {!dialog && <div className="own:flex flex-wrap items-center justify-between gap-x-4 gap-y-2">{importBar}</div>}
        </div>
      )}

      {dialog && (
        <div data-slot="import-mapper-footer" className="own:flex shrink-0 items-center justify-between gap-3 own:pt-1">
          {step === 'columns' ? (
            <>
              <Button variant="ghost" onClick={m.reset}>
                {copy.importMapperStartOver}
              </Button>
              <Button ref={continueButton} disabled={m.missing.length > 0} onClick={() => setStep('confirm')}>
                {copy.continue}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep('columns')}>
                {copy.back}
              </Button>
              {importBar}
            </>
          )}
        </div>
      )}

      <ReviewSheet
        m={m}
        copy={copy}
        fields={fields}
        previewRows={previewRows}
        number={number}
        open={reviewing}
        group={review?.group ?? null}
        rows={review?.rows ?? []}
        onClose={() => {
          setReviewing(false)
          settle()
        }}
      />
    </div>
  )
}
