'use client'

import { CheckIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { Checkbox } from '../../../components/ui/checkbox'
import { Field, FieldLabel } from '../../../components/ui/field'
import { FormField, FormMessage } from '../../../components/ui/form'
import type { MultiStepFormCopy, ApplicationOption, ApplicationStepId, ApplicationValues } from './data'

/* Check your answers: each step the application took, as rows of what was
 * given, with a Change that goes back to that step (and returns here once
 * it's answered again). Then the declaration, which has to be ticked to
 * send. And the confirmation once it's sent: the reference and what happens
 * next, in order. */

interface Lists {
  types: ApplicationOption[]
  countries: ApplicationOption[]
  industries: ApplicationOption[]
  roles: ApplicationOption[]
}

/** Each step's rows: what it asked, and what was given. */
function rows(step: ApplicationStepId, values: ApplicationValues, documents: string[], lists: Lists, copy: MultiStepFormCopy): [string, string][] {
  const label = (list: ApplicationOption[], value: string) => list.find((o) => o.value === value)?.label ?? value
  if (step === 'business')
    return [
      [copy.type, label(lists.types, values.type)],
      [copy.name, values.name],
      [copy.country, label(lists.countries, values.country)],
      [copy.industry, label(lists.industries, values.industry)],
    ]
  if (step === 'company')
    return [
      [copy.registration, values.registration],
      [copy.founded, values.founded],
      [copy.website, values.website],
    ]
  if (step === 'people')
    return values.people.map((person, index) => [
      copy.person(index + 1),
      [person.name, label(lists.roles, person.role), lists.roles.find((role) => role.value === person.role)?.share ? `${person.share}%` : ''].filter(Boolean).join(' · '),
    ])
  if (step === 'you') return [[copy.yourName, values.you.name], [copy.birth, [values.you.day, values.you.month, values.you.year].join(' ')]]
  if (step === 'documents') return [[copy.document(values.type), documents.join(', ')]]
  return []
}

interface ReviewProps {
  steps: ApplicationStepId[]
  values: ApplicationValues
  documents: string[]
  lists: Lists
  heading: 'h3' | 'h4'
  copy: MultiStepFormCopy
  onChange: (step: ApplicationStepId) => void
}

export function Review({ steps, values, documents, lists, heading: Heading, copy, onChange }: ReviewProps) {
  return (
    <div className="flex flex-col gap-5">
      {steps
        .filter((step) => step !== 'review')
        .map((step) => (
          <section key={step} aria-label={copy.steps[step]} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-3">
              <Heading className="text-ui font-semibold text-fg">{copy.steps[step]}</Heading>
              <Button type="button" variant="link" size="sm" className="h-auto px-0" aria-label={copy.changeLabel(copy.steps[step])} onClick={() => onChange(step)}>
                {copy.change}
              </Button>
            </div>
            <dl className="flex flex-col divide-y divide-line border-y border-line">
              {rows(step, values, documents, lists, copy).map(([term, detail], index) => (
                <div key={index} className="grid gap-x-4 gap-y-0.5 py-2.5 @md/application:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                  <dt className="text-ui-sm text-fg-muted">{term}</dt>
                  <dd className={detail ? 'text-ui break-words text-fg' : 'text-ui text-fg-subtle'}>{detail || copy.none}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      <FormField
        name="declaration"
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-1.5">
            <Field orientation="horizontal" invalid={fieldState.invalid}>
              <Checkbox ref={field.ref} checked={field.value === true} onCheckedChange={field.onChange} onBlur={field.onBlur} aria-invalid={fieldState.invalid || undefined} />
              <FieldLabel className="font-normal text-pretty">{copy.declaration}</FieldLabel>
            </Field>
            <FormMessage />
          </div>
        )}
      />
    </div>
  )
}

export function Done({ id, heading: Heading, copy }: { id?: string; heading: 'h2' | 'h3'; copy: MultiStepFormCopy }) {
  return (
    <div className="flex flex-col gap-5 px-(--ui--panel-x) py-(--ui--panel-y)">
      <div className="flex flex-col items-start gap-4">
        <span className="grid size-10 place-items-center rounded-full bg-success-subtle text-success-text">
          <CheckIcon size={20} strokeWidth={2.25} trigger="mount" />
        </span>
        <div className="flex flex-col gap-1.5">
          <Heading data-yj-done-heading tabIndex={-1} className="text-xl leading-snug font-semibold tracking-tight text-fg outline-none">
            {copy.doneTitle}
          </Heading>
          {id && <p className="text-ui text-fg-muted">{copy.reference(id)}</p>}
        </div>
      </div>
      <section aria-label={copy.nextTitle} className="flex flex-col gap-2">
        <p className="text-ui font-semibold text-fg">{copy.nextTitle}</p>
        <ol className="flex flex-col gap-2">
          {copy.nextSteps.map((line, index) => (
            <li key={index} className="flex items-start gap-3 text-ui text-fg-muted">
              <span aria-hidden className="grid size-5 shrink-0 place-items-center rounded-full border border-line font-mono text-ui-xs text-fg-muted tabular-nums">
                {index + 1}
              </span>
              {line}
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
