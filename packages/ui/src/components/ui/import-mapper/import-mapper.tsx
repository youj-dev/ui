'use client'

import { useEffect, useId, useRef, type ComponentProps } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { MotionFeatures, ThemeScope, useLocale, useYouj, type ThemeInput } from '@youj/core'
import { importMapperLabels, useComponentLabels } from '@youj/core/labels'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../card'
import { useLiveRegion } from '../../../hooks/use-announcer'
import { cn } from '../../../lib/utils'
import { DEFAULT_FIELDS, DEMO_EXISTING, type ImportMapperCopy } from './import-mapper-data'
import { MapStep } from './import-mapper-map'
import type { DuplicatePolicy, ImportField, ImportFieldType, ImportRow } from './import-mapper-model'
import { ResultStep } from './import-mapper-run'
import { ChooseFile, FilePicker } from './import-mapper-upload'
import { useImporter, type ImportContext, type ImportResult } from './import-mapper-use-importer'

/* Bring a CSV into an app in two screens and a result, for ops and CRM
 * admins loading contacts or orders. Choose a file: drop one or pick it (or
 * try the sample); it has a size limit, the delimiter (comma, semicolon or
 * tab) is found for you, and the moment it is read you land on the mapping.
 * Map and import: the file on top, then each column of it with a sample value
 * and the field it goes to; confident matches are quiet, a guess is marked
 * "Check", and a required field with no column is called out with a picker for
 * it. Above the button, what needs attention in plain words, each with a way
 * out: Review opens a sheet with only those rows, each one wrong value
 * editable with its error under it, or Skip them; duplicates are a question
 * (update, skip or add as new) with the key field under More options. The
 * button says what will happen ("Import 44 contacts") and stays off only
 * while a required field is unmatched, saying why. Result: what was imported
 * and skipped, the skipped rows as a CSV, import another file.
 * Counts and the button follow every fix; changes are announced. A screen
 * change crossfades and moves focus into the new screen (reduced motion: it
 * swaps at once). The card keeps its size, and fits a dialog-wide card.
 * `variant="dialog"` is the compact version for a ~520px dialog: the same
 * parts on two steps with one footer. The columns step is the file and the
 * column → field list with Start over / Continue; Continue leads to what
 * needs attention (the same review, skip and duplicate choices) with Back and
 * the import button. Everything after it is unchanged.
 * The data stays in the browser until `onImport` gets the rows.
 *
 * Pass your `fields` and the `existing` values of the key field, and receive
 * the rows in `onImport`; every string is the dictionary's (`copy` rewrites
 * any of them, including the noun in "Import 44 contacts"). Demo content —
 * edit after adding. */

interface ImportMapperProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** A panel inside another page: an `h2` instead of the page's `h1`, and no page around it. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** `page` (default): one working screen, up to 1024px wide. `dialog`: the compact version for a ~520px dialog: the file and the column list with a footer of Start over / Continue, and a second step for what needs attention before the import. */
  variant?: 'page' | 'dialog'
  /** Take the whole width it's given instead of stopping at its natural width (1024px at 100% scale; 512px in the dialog variant). Default false. */
  fill?: boolean
  /** The title's level. Default: 2 when embedded, else 1. */
  headingLevel?: 1 | 2 | 3
  /** Any of the block's strings, to rewrite or translate. Default: the dictionary's (YoujProvider's `labels`). */
  copy?: Partial<ImportMapperCopy>
  /** Writes counts and sizes in this locale (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The fields a CSV column can be imported as. Default: the demo's six contact fields. */
  fields?: ImportField[]
  /** The field that tells whether a contact already exists. Default: the first email field, else the first required field. */
  keyField?: string
  /** Values of the key field that already exist in your app; a row with one of them is a duplicate. Default: the demo's three, else none. */
  existing?: readonly string[]
  /** The largest file, in bytes. Default 5 MB. */
  maxSize?: number
  /** The most cards a review lists at once; the counts and the import always cover every row. Default 100. */
  previewRows?: number
  /** Offers a built-in sample file ("Use sample"). Default: true with the demo's fields, else false. */
  sample?: boolean
  /** The skipped rows file's name. Default "import-errors.csv". */
  reportName?: string
  /** Shows a Done button on the result; called when it is pressed. */
  onDone?: () => void
  /** Receives the rows to create or update. Resolve (optionally with the counts) when they're in; reject to stop with the message shown. Default: a short demo wait. */
  onImport?: (rows: ImportRow[], context: ImportContext) => Promise<ImportResult | void> | ImportResult | void
}

function ImportMapper({
  theme,
  embedded = true,
  variant = 'page',
  fill = false,
  headingLevel,
  copy: copyProp,
  locale: localeProp,
  fields: fieldsProp,
  keyField,
  existing: existingProp,
  maxSize = 5 * 1024 * 1024,
  previewRows = 100,
  sample: sampleProp,
  reportName = 'import-errors.csv',
  onImport,
  onDone,
  className,
  ...rest
}: ImportMapperProps) {
  const k = useYouj()
  const copy: ImportMapperCopy = { ...useComponentLabels(importMapperLabels), ...copyProp }
  const locale = useLocale(localeProp)
  const demo = fieldsProp === undefined
  const fields = fieldsProp ?? DEFAULT_FIELDS
  const sample = sampleProp ?? demo
  const dialog = variant === 'dialog'
  const width = dialog ? 'own:max-w-lg' : 'own:max-w-5xl'
  const titleId = useId()
  const Title = `h${headingLevel ?? (embedded ? 2 : 1)}` as 'h1' | 'h2' | 'h3'
  const { politeRef, announce } = useLiveRegion()
  const m_ = useImporter({
    fields,
    keyField,
    existing: existingProp ?? (demo ? DEMO_EXISTING : undefined),
    maxSize,
    copy,
    locale,
    onImport,
    announce,
  })
  const input = useRef<HTMLInputElement>(null)
  const region = useRef<HTMLDivElement>(null)
  const shown = useRef<string | null>(null)

  const running = m_.run.status === 'running'
  const screen = m_.run.status !== 'idle' ? 'result' : m_.file ? 'map' : 'choose'
  const pick = () => input.current?.click()

  // A new screen takes focus on its first thing, so a screen reader starts reading it.
  const finished = m_.run.status === 'done'
  useEffect(() => {
    const key = `${screen}:${finished}`
    const before = shown.current
    shown.current = key
    if (before === null || before === key) return
    region.current?.querySelector<HTMLElement>(`[data-yj-screen="${screen}"] [data-yj-focus]`)?.focus()
  }, [screen, finished])

  const body =
    screen === 'choose' ? (
      <ChooseFile m={m_} copy={copy} locale={locale} maxSize={maxSize} sample={sample} onPick={pick} />
    ) : screen === 'map' ? (
      <MapStep m={m_} copy={copy} fields={fields} locale={locale} previewRows={previewRows} variant={variant} onPick={pick} />
    ) : (
      <ResultStep m={m_} copy={copy} locale={locale} reportName={reportName} onDone={onDone} />
    )

  const enter = k.reduced ? { type: false as const } : k.tween('base', 'enter')
  const card = (
    <Card className={cn('own:w-full own:gap-4 own:text-fg', !embedded && !fill && width)}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.importMapperTitle}</Title>
        </CardTitle>
        <CardDescription>{copy.importMapperDescription}</CardDescription>
      </CardHeader>
      <CardContent className="@container/import-mapper">
        <MotionFeatures>
          <div
            ref={region}
            data-slot="import-mapper-stage"
            aria-busy={running || undefined}
            className={cn(
              'relative',
              dialog
                ? 'own:h-[clamp(--spacing(104),calc(100dvh_-_--spacing(44)),--spacing(116))]'
                : 'own:h-[clamp(--spacing(120),calc(100dvh_-_--spacing(44)),--spacing(160))]',
            )}
          >
            <AnimatePresence initial={false}>
              {/* The new screen fades in over the old one, which stays solid until it is covered: never a blank between. */}
              <m.div
                key={screen}
                data-yj-screen={screen}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: enter }}
                exit={{ opacity: 1, transition: enter }}
                className="absolute inset-0 overflow-y-auto own:bg-surface px-px py-px yj-scrollbar"
              >
                {body}
              </m.div>
            </AnimatePresence>
          </div>
        </MotionFeatures>
        <FilePicker inputRef={input} onFile={(picked) => void m_.loadFile(picked)} />
      </CardContent>
      <div ref={politeRef} role="status" className="sr-only" />
    </Card>
  )

  const root = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('own:w-full', !fill && width, className)}>
      {card}
    </section>
  ) : (
    <main
      aria-labelledby={titleId}
      {...rest}
      className={cn('own:grid own:min-h-dvh own:w-full own:grid-cols-[minmax(0,1fr)] own:place-items-center own:bg-canvas own:px-4 own:py-10 own:text-fg', className)}
    >
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{root}</ThemeScope> : root
}

export {
  ImportMapper,
  type ImportMapperProps,
  type ImportMapperCopy,
  type ImportField,
  type ImportFieldType,
  type ImportRow,
  type ImportContext,
  type ImportResult,
  type DuplicatePolicy,
}
