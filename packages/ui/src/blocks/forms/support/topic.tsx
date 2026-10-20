'use client'

import { useId } from 'react'
import { Collapse } from '@youj/motion'
import { Field, FieldContent, FieldDescription, FieldLabel, FieldLegend, FieldSet, FieldTitle } from '../../../components/ui/field'
import { FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../../../components/ui/form'
import { Input } from '../../../components/ui/input'
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Textarea } from '../../../components/ui/textarea'
import type { SupportField, SupportRequestCopy, SupportTopic } from './data'

/* The topic, as cards with their icon and a line each, and the fields it
 * brings. A topic's fields grow in between the topic and the subject while
 * the last topic's fold away (the card's height follows), so only what this
 * request needs is asked; what's typed in a topic's fields is kept if you go
 * back to it. */

interface TopicPickerProps {
  topics: SupportTopic[]
  value: string
  onValueChange: (id: string) => void
  onBlur: () => void
  invalid: boolean
  copy: SupportRequestCopy
}

export function TopicPicker({ topics, value, onValueChange, onBlur, invalid, copy }: TopicPickerProps) {
  return (
    <FieldSet className="gap-3">
      <FieldLegend variant="label">{copy.topic}</FieldLegend>
      <RadioGroup value={value} onValueChange={(next) => onValueChange(next as string)} onBlur={onBlur} aria-invalid={invalid || undefined} className="grid gap-2 @md/support:grid-cols-2 @md/support:[&>:last-child:nth-child(odd)]:col-span-2 @3xl/support:grid-cols-3 @3xl/support:[&>:last-child:nth-child(odd)]:col-span-1">
        {topics.map((topic) => {
          const Icon = topic.icon
          return (
            <FieldLabel key={topic.id} className="*:data-[slot=field]:py-2.5">
              <Field orientation="horizontal">
                {Icon && (
                  <span aria-hidden className="mt-px grid size-7 shrink-0 place-items-center rounded-md bg-well text-fg-muted">
                    <Icon size={15} />
                  </span>
                )}
                <FieldContent className="min-w-0">
                  <FieldTitle>{topic.label}</FieldTitle>
                  {topic.description && <FieldDescription>{topic.description}</FieldDescription>}
                </FieldContent>
                <RadioGroupItem value={topic.id} className="mt-1.5" />
              </Field>
            </FieldLabel>
          )
        })}
      </RadioGroup>
    </FieldSet>
  )
}

/** Every topic's fields, the chosen topic's open. */
export function TopicFields({ topics, topic, copy }: { topics: SupportTopic[]; topic: string; copy: SupportRequestCopy }) {
  return (
    <>
      {topics
        .filter((t) => t.fields?.length)
        .map((t) => (
          <Collapse key={t.id} open={t.id === topic}>
            <div className="flex flex-col gap-4 pb-1">
              {t.fields!.map((field) => (
                <TopicField key={field.id} field={field} copy={copy} />
              ))}
            </div>
          </Collapse>
        ))}
    </>
  )
}

function TopicField({ field, copy }: { field: SupportField; copy: SupportRequestCopy }) {
  const labelId = useId()
  return (
    <FormField
      name={`fields.${field.id}`}
      render={({ field: control, fieldState }) => (
        <FormItem>
          {field.type === 'segmented' ? (
            <FieldTitle id={labelId}>{field.label}</FieldTitle>
          ) : (
            <FormLabel>
              {field.label}
              {!field.required && field.type !== 'select' && <span className="font-normal text-fg-subtle"> ({copy.optional})</span>}
            </FormLabel>
          )}
          {field.type === 'select' ? (
            <Select items={field.options ?? []} value={control.value || null} onValueChange={(next) => control.onChange(next ?? '')}>
              <SelectTrigger ref={control.ref} onBlur={control.onBlur} aria-invalid={fieldState.invalid || undefined} className="w-full max-w-sm">
                <SelectValue placeholder={field.placeholder ?? copy.choose} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : field.type === 'segmented' ? (
            <SegmentedControl variant="pill" aria-labelledby={labelId} value={control.value ?? ''} onValueChange={control.onChange} className="max-w-full self-start">
              {field.options?.map((option) => (
                <SegmentedControlItem key={option.value} value={option.value}>
                  {option.label}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          ) : field.type === 'textarea' ? (
            <Textarea {...control} value={control.value ?? ''} placeholder={field.placeholder} aria-invalid={fieldState.invalid || undefined} />
          ) : (
            <Input {...control} value={control.value ?? ''} placeholder={field.placeholder} aria-invalid={fieldState.invalid || undefined} />
          )}
          {field.description && <FormDescription>{field.description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
