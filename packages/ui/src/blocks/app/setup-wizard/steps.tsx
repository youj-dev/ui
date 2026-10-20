'use client'

import type { ReactNode } from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import { DatePicker } from '../../../components/ui/date-picker'
import { FieldContent, FieldDescription, FieldLabel, FieldLegend, FieldSet } from '../../../components/ui/field'
import { Form, FormField } from '../../../components/ui/form'
import { Input } from '../../../components/ui/input'
import { PhoneInput } from '../../../components/ui/phone-input'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Switch } from '../../../components/ui/switch'
import { Textarea } from '../../../components/ui/textarea'
import { typesFor, type NewHireAccount, type Personal, type Role, type Setup, type WizardCopy } from './data'

/** A step's own form: Enter in a field moves on, as Continue does. */
function StepForm<T extends FieldValues>({ form, label, onNext, children }: { form: UseFormReturn<T>; label: string; onNext: () => void; children: ReactNode }) {
  return (
    <Form form={form} onSubmit={onNext} aria-label={label} className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
      {children}
      {/* Enter submits a form only when it has a submit button; the visible Continue lives in the Wizard's footer. */}
      <button type="submit" tabIndex={-1} aria-hidden className="sr-only" />
    </Form>
  )
}

function Choice({ items, value, placeholder, field: { ref, onBlur, onChange } }: { items: Record<string, string>; value: string; placeholder: string; field: { ref: React.Ref<HTMLButtonElement>; onBlur: () => void; onChange: (v: string) => void } }) {
  return (
    <Select items={items} value={value || null} onValueChange={(next) => onChange((next as string | null) ?? '')}>
      <SelectTrigger ref={ref} onBlur={onBlur} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(items).map(([id, label]) => (
          <SelectItem key={id} value={id}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function PersonalStep({ form, onNext, copy }: { form: UseFormReturn<Personal>; onNext: () => void; copy: WizardCopy }) {
  return (
    <StepForm form={form} label={copy.personalTitle} onNext={onNext}>
      <FormField name="firstName" label={copy.firstName} required>
        {(field) => <Input {...field} autoComplete="off" placeholder={copy.firstNamePlaceholder} />}
      </FormField>
      <FormField name="lastName" label={copy.lastName} required>
        {(field) => <Input {...field} autoComplete="off" placeholder={copy.lastNamePlaceholder} />}
      </FormField>
      <FormField name="email" label={copy.email} required description={copy.emailDescription} className="sm:col-span-2">
        {(field) => <Input {...field} type="email" autoComplete="off" placeholder={copy.emailPlaceholder} />}
      </FormField>
      <FormField name="phone" label={copy.phone} required description={copy.phoneDescription} className="sm:col-span-2">
        {(field) => <PhoneInput value={field.value} onValueChange={(value) => field.onChange(value)} name={field.name} />}
      </FormField>
    </StepForm>
  )
}

export function RoleStep({ form, onNext, today, copy, teams }: { form: UseFormReturn<Role>; onNext: () => void; today?: Date; copy: WizardCopy; teams: Record<string, string> }) {
  return (
    <StepForm form={form} label={copy.roleTitle} onNext={onNext}>
      <FormField name="title" label={copy.jobTitle} required className="sm:col-span-2">
        {(field) => <Input {...field} autoComplete="off" placeholder={copy.jobTitlePlaceholder} />}
      </FormField>
      <FormField name="team" label={copy.team} required>
        {(field) => <Choice items={teams} value={field.value} placeholder={copy.teamPlaceholder} field={field} />}
      </FormField>
      <FormField name="startDate" label={copy.startDate} required description={copy.startDateDescription}>
        {(field) => (
          <DatePicker ref={field.ref} value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} minDate={today} disabledDates={{ dayOfWeek: [0, 6] }} />
        )}
      </FormField>
      <FormField name="type" label={copy.employment} className="sm:col-span-2">
        {(field) => (
          <SegmentedControl aria-label={copy.employment} value={field.value} onValueChange={field.onChange} className="w-full *:flex-1 sm:w-auto">
            {Object.entries(typesFor(copy)).map(([id, label]) => (
              <SegmentedControlItem key={id} value={id}>
                {label}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        )}
      </FormField>
    </StepForm>
  )
}

export function SetupStep({
  form,
  onNext,
  copy,
  laptops,
  accounts,
}: {
  form: UseFormReturn<Setup>
  onNext: () => void
  copy: WizardCopy
  laptops: Record<string, string>
  accounts: NewHireAccount[]
}) {
  const note = form.watch('note')
  return (
    <StepForm form={form} label={copy.setupTitle} onNext={onNext}>
      <FormField name="laptop" label={copy.laptop} required description={copy.laptopDescription} className="sm:col-span-2">
        {(field) => <Choice items={laptops} value={field.value} placeholder={copy.laptopPlaceholder} field={field} />}
      </FormField>
      <FieldSet className="sm:col-span-2">
        <FieldLegend variant="label">{copy.accounts}</FieldLegend>
        <FieldDescription>{copy.accountsDescription}</FieldDescription>
        <div className="flex flex-col divide-y divide-line rounded-lg border border-line">
          {accounts.map((account) => (
            <FormField key={account.id} name={account.id} orientation="horizontal" className="px-3.5 py-3">
              {(field) => (
                <>
                  <FieldContent>
                    <FieldLabel>{account.label}</FieldLabel>
                    <FieldDescription>{account.description}</FieldDescription>
                  </FieldContent>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </>
              )}
            </FormField>
          ))}
        </div>
      </FieldSet>
      <FormField name="note" label={copy.note} description={copy.noteDescription(280 - note.length)} className="sm:col-span-2">
        {(field) => <Textarea {...field} rows={3} placeholder={copy.notePlaceholder} />}
      </FormField>
    </StepForm>
  )
}

