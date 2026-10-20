'use client'

import { useId, type ReactNode, type Ref } from 'react'
import { useFormContext, useFormState, type FieldPath } from 'react-hook-form'
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet, FieldTitle } from '../../../components/ui/field'
import { FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../../../components/ui/form'
import { Input } from '../../../components/ui/input'
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import type { MultiStepFormCopy, ApplicationOption, ApplicationValues } from './data'
import type { Problem } from './rules'

/* The steps' fields, and the summary of a step's problems. The summary sits
 * at the top of the step once Continue finds something, takes focus, lists
 * each problem in the order of the fields (each a link that focuses its
 * field) and shrinks as they're fixed; the same words sit under each field.
 * The date of birth is three short fields under one legend (day, month,
 * year: typing is quicker than a calendar for a date decades ago). */

type Paths = FieldPath<ApplicationValues>

export function ErrorSummary({ problems, copy, onPick, ref }: { problems: Problem[]; copy: MultiStepFormCopy; onPick: (path: string) => void; ref?: Ref<HTMLDivElement> }) {
  const id = useId()
  if (!problems.length) return null
  return (
    <div ref={ref} tabIndex={-1} aria-labelledby={id} data-slot="error-summary" className="flex flex-col gap-2 rounded-lg border border-danger-line bg-danger-subtle px-4 py-3 focus-ring">
      <p id={id} className="text-ui font-semibold text-danger-text">
        {copy.problemTitle}
      </p>
      <ul className="flex flex-col gap-1">
        {problems.map(([path, message]) => (
          <li key={path}>
            <a
              href={`#${path}`}
              onClick={(event) => {
                event.preventDefault()
                onPick(path)
              }}
              className="rounded-sm text-ui text-danger-text underline underline-offset-4 hover:no-underline focus-ring"
            >
              {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Choose({ name, label, options, hint, copy }: { name: Paths; label: string; options: ApplicationOption[]; hint?: string; copy: MultiStepFormCopy }) {
  return (
    <FormField
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select items={options} value={(field.value as string) || null} onValueChange={(value) => field.onChange(value ?? '')}>
            <SelectTrigger ref={field.ref} onBlur={field.onBlur} aria-invalid={fieldState.invalid || undefined} className="w-full max-w-sm">
              <SelectValue placeholder={copy.choose} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hint && <FormDescription>{hint}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function Text({ name, label, hint, optional, copy, className, ...input }: { name: Paths; label: string; hint?: string; optional?: boolean; copy: MultiStepFormCopy; className?: string } & Omit<Parameters<typeof Input>[0], 'name'>) {
  return (
    <FormField
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          <FormLabel>
            {label}
            {optional && <span className="font-normal text-fg-subtle"> ({copy.optional})</span>}
          </FormLabel>
          <Input {...input} {...field} value={(field.value as string) ?? ''} aria-invalid={fieldState.invalid || undefined} />
          {hint && <FormDescription>{hint}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function BusinessStep({ types, countries, industries, copy }: { types: ApplicationOption[]; countries: ApplicationOption[]; industries: ApplicationOption[]; copy: MultiStepFormCopy }) {
  return (
    <div className="flex flex-col gap-5">
      <FormField
        name="type"
        render={({ field, fieldState }) => (
          <FieldSet className="gap-2.5">
            <FieldLegend variant="label">{copy.type}</FieldLegend>
            <RadioGroup value={field.value as string} onValueChange={(value) => field.onChange(value)} onBlur={field.onBlur} aria-invalid={fieldState.invalid || undefined} className="grid gap-2 @md/application:grid-cols-2">
              {types.map((type, index) => (
                <FieldLabel key={type.value}>
                  <Field orientation="horizontal">
                    <RadioGroupItem value={type.value} ref={index === 0 ? field.ref : undefined} />
                    <FieldContent>
                      <FieldTitle>{type.label}</FieldTitle>
                      {type.description && <FieldDescription>{type.description}</FieldDescription>}
                    </FieldContent>
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>
            <FieldError>{fieldState.error?.message}</FieldError>
          </FieldSet>
        )}
      />
      <Text name="name" label={copy.name} hint={copy.nameHint} autoComplete="organization" copy={copy} />
      <div className="grid gap-5 @md/application:grid-cols-2">
        <Choose name="country" label={copy.country} options={countries} copy={copy} />
        <Choose name="industry" label={copy.industry} options={industries} copy={copy} />
      </div>
    </div>
  )
}

export function CompanyStep({ copy }: { copy: MultiStepFormCopy }) {
  const { getValues } = useFormContext<ApplicationValues>()
  return (
    <div className="grid gap-5 @md/application:grid-cols-2">
      <Text
        name="registration"
        label={copy.registration}
        hint={copy.registrationHint}
        optional={getValues('type') === 'partnership'}
        className="@md/application:col-span-2"
        spellCheck={false}
        copy={copy}
      />
      <Text name="founded" label={copy.founded} optional inputMode="numeric" maxLength={4} copy={copy} className="max-w-40" />
      <Text name="website" label={copy.website} optional type="url" inputMode="url" autoComplete="url" placeholder={copy.websitePlaceholder} copy={copy} />
    </div>
  )
}

export function YouStep({ copy }: { copy: MultiStepFormCopy }) {
  const { errors } = useFormState<ApplicationValues>({ name: ['you.day', 'you.month', 'you.year'] })
  const hintId = useId()
  const date = errors.you?.day ?? errors.you?.month ?? errors.you?.year
  const part = (name: 'day' | 'month' | 'year', width: string, max: number): ReactNode => (
    <FormField
      name={`you.${name}`}
      render={({ field }) => (
        <FormItem className={width}>
          <FormLabel className="font-normal text-fg-muted">{copy[name]}</FormLabel>
          <Input
            {...field}
            inputMode="numeric"
            maxLength={max}
            autoComplete={name === 'day' ? 'bday-day' : name === 'month' ? 'bday-month' : 'bday-year'}
            aria-describedby={hintId}
            aria-invalid={!!date || undefined}
            className="font-mono tabular-nums"
          />
        </FormItem>
      )}
    />
  )
  return (
    <div className="flex flex-col gap-5">
      <Text name="you.name" label={copy.yourName} autoComplete="name" copy={copy} />
      <FieldSet className="gap-2">
        <FieldLegend variant="label">{copy.birth}</FieldLegend>
        <FieldDescription id={hintId} className="-mt-1">
          {copy.birthHint}
        </FieldDescription>
        <div className="flex gap-3">
          {part('day', 'w-16', 2)}
          {part('month', 'w-16', 2)}
          {part('year', 'w-24', 4)}
        </div>
        <FieldError>{date?.message}</FieldError>
      </FieldSet>
    </div>
  )
}
