'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type HTMLAttributes } from 'react'
import { FormProvider, useForm, useWatch, type FieldErrors, type FieldPath, type Resolver } from 'react-hook-form'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Collapse } from '@youj/motion'
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { AsyncButton } from '../../components/ui/async-button'
import { FieldError, FieldLegend, FieldSet } from '../../components/ui/field'
import { FileUpload, type UploadContext, type UploadFile } from '../../components/ui/file-upload'
import { Wizard, WizardStep } from '../../components/ui/wizard'
import { cn, dateTimeFormat } from '../../lib/utils'
import {
  APPLICATION_COUNTRIES,
  BUSINESS_TYPES,
  DEFAULT_COPY,
  demo,
  EMPTY_VALUES,
  INDUSTRIES,
  ROLES,
  stepsFor,
  type MultiStepFormCopy,
  type ApplicationOption,
  type ApplicationPerson,
  type ApplicationStepId,
  type ApplicationSubmission,
  type ApplicationValues,
} from './multi-step/data'
import { PeopleStep } from './multi-step/people'
import { Done, Review } from './multi-step/review'
import { nested, problems, type Problem } from './multi-step/rules'
import { BusinessStep, CompanyStep, ErrorSummary, YouStep } from './multi-step/steps'

/* A long application that never asks more than the business needs. The
 * first answer decides the path: a limited company goes on to its register
 * details and the people who control it; a sole trader to their own name
 * and date of birth; and the Stepper shows only the steps on that path.
 * Continue (or Enter) checks the step; anything missing is gathered in a
 * summary at the top that takes focus and links to each field, with the
 * same words under the fields, and the summary shrinks as they're fixed.
 * People are added and removed as cards, the owners' shares counted as
 * they're typed. Save and finish later keeps the answers (`onSaveDraft`;
 * pass them back as `defaultValue` to resume where it stopped). It ends on
 * Check your answers, each step with a Change that comes back once it's
 * answered, and a declaration to tick; then the reference and what happens
 * next. A failed send keeps everything. Reduced motion: steps swap in place.
 *
 * Pass your lists (`types`, `countries`, `industries`, `roles`), keep the
 * answers with `value`/`defaultValue`/`onValueChange`, upload documents with
 * `onUpload` and send through `onSubmit`; every string is in `copy`. */

interface MultiStepFormProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'defaultValue' | 'onSubmit'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** A panel inside another page: an `h2` instead of the page's `h1` (each step an `h3`), and no page around it. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (672px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<MultiStepFormCopy>
  /** Writes the draft's saved time in this locale (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The kinds of business, each with its path. Default: sole trader, limited company, partnership, non-profit. */
  types?: ApplicationOption[]
  /** The countries a business can be registered in. Default: five in Europe. */
  countries?: ApplicationOption[]
  /** What a business can do. Default: six broad industries. */
  industries?: ApplicationOption[]
  /** The roles a person in control can have. Default: director, owner, both. */
  roles?: ApplicationOption[]
  /** The most people in control. Default 4. */
  maxPeople?: number
  /** The youngest age that may apply, checked against the date of birth. Default 18. */
  minAge?: number
  /** The answers, controlled: pair it with `onValueChange`. */
  value?: Partial<ApplicationValues>
  /** The answers to start from (a saved draft): it opens on the first step that still needs something. Default: none. */
  defaultValue?: Partial<ApplicationValues>
  /** Called with the answers as they change. */
  onValueChange?: (values: ApplicationValues) => void
  /** Saves the answers to finish later. Default: a short demo wait. */
  onSaveDraft?: (values: ApplicationValues, step: ApplicationStepId) => Promise<unknown> | unknown
  /** Uploads one document, reporting progress. Default: a demo upload. */
  onUpload?: (file: File, context: UploadContext) => Promise<unknown>
  /** Sends the application; resolve with its reference to show it. Reject to keep everything and say why. Default: a short demo wait. */
  onSubmit?: (application: ApplicationSubmission) => Promise<string | void> | string | void
  /** Today, for the date of birth and the year founded. Default: the moment the block mounts. */
  now?: Date
}

/** The fields each step checks when it's left. */
const FIELDS: Record<ApplicationStepId, FieldPath<ApplicationValues>[]> = {
  business: ['type', 'name', 'country', 'industry'],
  company: ['registration', 'founded', 'website'],
  people: ['people'],
  you: ['you'],
  documents: [],
  review: ['declaration'],
}

async function demoUpload(_file: File, { signal, onProgress }: UploadContext) {
  for (let percent = 0; percent <= 100; percent += 25) {
    if (signal.aborted) throw new Error('Canceled')
    onProgress(percent)
    await demo('Application: onUpload', 160)
  }
}

const fill = (given: Partial<ApplicationValues> | undefined, country: string): ApplicationValues => ({
  ...EMPTY_VALUES,
  country,
  ...given,
  you: { ...EMPTY_VALUES.you, ...given?.you },
  people: given?.people?.length ? given.people.map((p: Partial<ApplicationPerson>) => ({ name: '', role: '', share: '', ...p })) : EMPTY_VALUES.people,
})

function MultiStepForm({
  theme,
  embedded = true,
  fill: wide = false,
  copy: copyProp,
  locale,
  types = BUSINESS_TYPES,
  countries = APPLICATION_COUNTRIES,
  industries = INDUSTRIES,
  roles = ROLES,
  maxPeople = 4,
  minAge = 18,
  value,
  defaultValue,
  onValueChange,
  onSaveDraft,
  onUpload,
  onSubmit,
  now,
  className,
  ...rest
}: MultiStepFormProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const [mountedAt] = useState(() => new Date())
  const today = now ?? mountedAt
  const root = useRef<HTMLElement>(null)
  const summary = useRef<HTMLDivElement>(null)
  const docsZone = useRef<HTMLDivElement>(null)
  const [docs, setDocs] = useState<UploadFile[]>([])
  const documents = { done: docs.filter((d) => d.status === 'done').length, uploading: docs.some((d) => d.status === 'uploading') }
  const context = { copy, now: today, documents, roles, minAge }

  const resolver: Resolver<ApplicationValues> = (values) => {
    const all = stepsFor(values.type).flatMap((step) => problems(values, step, context))
    return all.length ? { values: {}, errors: nested(all) as FieldErrors<ApplicationValues> } : { values, errors: {} }
  }
  const form = useForm<ApplicationValues>({ defaultValues: fill(value ?? defaultValue, countries[0]?.value ?? EMPTY_VALUES.country), values: value ? fill(value, countries[0]?.value ?? EMPTY_VALUES.country) : undefined, resetOptions: { keepDirtyValues: true }, resolver, mode: 'onTouched' })
  const values = useWatch({ control: form.control }) as ApplicationValues
  const steps = stepsFor(values.type)

  // A saved draft opens where it stopped: the first step that still needs something.
  const [step, setStep] = useState<ApplicationStepId>(() => {
    const start = fill(value ?? defaultValue, countries[0]?.value ?? EMPTY_VALUES.country)
    return stepsFor(start.type).find((s) => problems(start, s, { ...context, documents: { done: 0, uploading: false } }).length) ?? 'business'
  })
  const index = Math.max(0, steps.indexOf(step))
  const [returning, setReturning] = useState(false)
  // The step whose Continue found problems: its summary shows (and shrinks) until they're fixed.
  const [summarised, setSummarised] = useState<ApplicationStepId | null>(null)
  const shown: Problem[] = summarised === step ? problems(values, step, context) : []
  const [failure, setFailure] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [done, setDone] = useState<{ id?: string } | null>(null)

  const latest = useRef(onValueChange)
  useLayoutEffect(() => {
    latest.current = onValueChange
  })
  useEffect(() => {
    return form.subscribe({ formState: { values: true }, callback: ({ values }) => latest.current?.(values as ApplicationValues) })
  }, [form])

  /** Checks a step; true when it may be left. Problems are shown inline and summarised at the top. */
  const check = async (id: ApplicationStepId) => {
    if (FIELDS[id].length) await form.trigger(FIELDS[id])
    const found = problems(form.getValues(), id, context)
    setSummarised(found.length ? id : null)
    if (found.length) requestAnimationFrame(() => summary.current?.focus())
    return found.length === 0
  }

  /** Moves to a step, or (editing from the review) back to the review once nothing earlier is missing. */
  const goTo = (target: number) => {
    const forward = target > index
    let id = steps[target] ?? 'review'
    if (returning && forward) {
      const all = form.getValues()
      id = steps.slice(index + 1).find((s) => s !== 'review' && problems(all, s, context).length) ?? 'review'
      if (id === 'review') setReturning(false)
    }
    setStep(id)
    setSummarised(null)
    // Focus the new step's heading, so reading starts there (the Wizard does too for its own buttons).
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>('[data-slot=wizard-step] [tabindex="-1"]')?.focus({ preventScroll: true }))
  }

  const advance = async () => {
    if (step === 'review' || !(await check(step))) return
    goTo(index + 1)
  }

  const pick = (path: string) => {
    if (path === 'documents') return docsZone.current?.querySelector<HTMLElement>('button, [role=button], input')?.focus()
    form.setFocus((path === 'people.root' ? 'people.0.share' : path) as FieldPath<ApplicationValues>)
  }

  const submit = async () => {
    setFailure(null)
    let id: string | void
    try {
      id = await (onSubmit ? onSubmit({ values: form.getValues(), documents: docs.filter((d) => d.status === 'done').map((d) => d.file) }) : demo('Application: onSubmit', 1200).then(() => 'NW-20714'))
    } catch (cause) {
      setFailure(cause instanceof Error && cause.message ? cause.message : copy.failedDescription)
      throw cause
    }
    setDone({ id: id || undefined })
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>('[data-yj-done-heading]')?.focus({ preventScroll: true }))
  }

  const saveDraft = async () => {
    await (onSaveDraft ? onSaveDraft(form.getValues(), step) : demo('Application: onSaveDraft', 700))
    setSavedAt(dateTimeFormat(copy.locale, { hour: 'numeric', minute: '2-digit' }).format(new Date()))
  }

  const body = (id: ApplicationStepId) => {
    if (id === 'business') return <BusinessStep types={types} countries={countries} industries={industries} copy={copy} />
    if (id === 'company') return <CompanyStep copy={copy} />
    if (id === 'people') return <PeopleStep roles={roles} max={maxPeople} copy={copy} />
    if (id === 'you') return <YouStep copy={copy} />
    if (id === 'documents')
      return (
        <FieldSet className="gap-2">
          <FieldLegend variant="label">{copy.document(values.type)}</FieldLegend>
          <div ref={docsZone}>
            <FileUpload title={copy.documentTitle} accept="image/*,.pdf" maxFiles={3} maxSize={10 * 1024 * 1024} onUpload={onUpload ?? demoUpload} onFilesChange={setDocs} />
          </div>
          <FieldError>{shown.find(([path]) => path === 'documents')?.[1]}</FieldError>
        </FieldSet>
      )
    return (
      <Review
        steps={steps}
        values={values}
        documents={docs.filter((d) => d.status === 'done').map((d) => d.file.name)}
        lists={{ types, countries, industries, roles }}
        heading={embedded ? 'h4' : 'h3'}
        copy={copy}
        onChange={(target) => {
          setReturning(true)
          goTo(steps.indexOf(target))
        }}
      />
    )
  }

  const panel = (
    <article
      ref={root}
      aria-labelledby={titleId}
      {...(embedded ? rest : null)}
      className={cn(
        '@container/application w-full rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface text-fg',
        embedded ? 'shadow-sm' : 'shadow-lg',
        !wide && 'max-w-2xl',
        embedded && className,
      )}
    >
      <header className="flex flex-col gap-1 px-(--ui--panel-x) py-(--ui--panel-head-y)">
        <Title id={titleId} className="text-xl leading-tight font-semibold tracking-tight">
          {copy.title}
        </Title>
        <p className="text-ui text-fg-muted">{copy.description}</p>
      </header>
      <Collapse open={!done} className="border-t border-line">
        <FormProvider {...form}>
          {/* Every step holds at least the first one's height (619px at 100%), the buttons at its foot: a shorter step never shrinks the card; revealed fields, errors and a longer step grow it. */}
          <form
            noValidate
            className="flex min-h-154.75 flex-col px-(--ui--panel-x) py-(--ui--panel-y) [&_[data-slot=wizard-footer]]:mt-auto [&_[data-slot=wizard]]:flex-1"
            onSubmit={(event) => {
              event.preventDefault()
              void advance()
            }}
          >
            <Wizard
              step={index}
              onStepChange={goTo}
              headingLevel={embedded ? 3 : 2}
              backLabel={copy.back}
              nextLabel={copy.next}
              finishLabel={copy.submit}
              finishSuccessLabel={copy.submitted}
              onComplete={submit}
              footerStart={
                <div className="flex min-w-0 items-center gap-2">
                  <AsyncButton variant="ghost" className="-ms-2" onAction={saveDraft} successLabel={copy.savedAt(savedAt ?? '')}>
                    {copy.saveDraft}
                  </AsyncButton>
                  {savedAt && <span className="hidden truncate text-ui-sm text-fg-muted @md/application:inline">{copy.savedAt(savedAt)}</span>}
                </div>
              }
            >
              {steps.map((id) => (
                <WizardStep key={id} id={id} title={copy.steps[id]} description={copy.descriptions[id]} validate={() => check(id)}>
                  <div className="flex flex-col gap-5">
                    <ErrorSummary ref={summary} problems={shown} copy={copy} onPick={pick} />
                    {body(id)}
                    {id === 'review' && failure && (
                      <Alert variant="danger">
                        <AlertTitle>{copy.failedTitle}</AlertTitle>
                        <AlertDescription>{failure}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </WizardStep>
              ))}
            </Wizard>
            {/* Enter in a field goes on, as Continue does. */}
            <button type="submit" tabIndex={-1} aria-hidden className="sr-only" />
          </form>
        </FormProvider>
      </Collapse>
      <Collapse open={!!done} className="border-t border-line">
        {/* Sent, the confirmation keeps at least the form's room, so the card doesn't collapse. */}
        {done && (
          <div className="flex min-h-154.75 flex-col justify-center">
            <Done id={done.id} heading={embedded ? 'h3' : 'h2'} copy={copy} />
          </div>
        )}
      </Collapse>
    </article>
  )

  const shell = embedded ? (
    panel
  ) : (
    <main {...rest} className={cn('grid min-h-dvh w-full place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {panel}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{shell}</ThemeScope> : shell
}

export { MultiStepForm, DEFAULT_COPY as MULTI_STEP_FORM_COPY }
export type { MultiStepFormCopy, ApplicationOption, ApplicationPerson, MultiStepFormProps, ApplicationStepId, ApplicationSubmission, ApplicationValues }
