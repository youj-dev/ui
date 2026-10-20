'use client'

import { useId, useRef, type ReactNode } from 'react'
import { useFormContext } from 'react-hook-form'
import { UndoIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { Combobox } from '../../../components/ui/combobox'
import { Field, FieldContent, FieldDescription, FieldLabel, FieldLegend, FieldSet, FieldTitle } from '../../../components/ui/field'
import { FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../../../components/ui/form'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText, InputGroupTextarea } from '../../../components/ui/input-group'
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Switch } from '../../../components/ui/switch'
import { TagInput } from '../../../components/ui/tag-input'
import { cn } from '../../../lib/utils'
import { same, spoken, type SettingsField, type SettingsFormCopy, type SettingsValue, type SettingsValues } from './data'
import { Availability, Counter, type RunCheck } from './status'

/* One setting. Changed from what's saved, it says so twice: a bar in the
 * gutter on its inline start (the way an editor marks a changed line) and a
 * Reset beside its label that puts the saved value back and returns focus to
 * the control. Text fields count their characters against `maxLength` (the
 * count turns amber near the limit and red past it, and a screen reader
 * hears how many are left once that's close). A field with `check` asks
 * about a changed, otherwise valid value once typing pauses: a spinner, then
 * a check or the refusal under the field. */

interface SettingRowProps {
  field: SettingsField
  /** The saved value: what Reset returns to. */
  saved: SettingsValue | undefined
  copy: SettingsFormCopy
  plural: Intl.PluralRules
  runCheck: RunCheck
}

export function SettingRow({ field, saved, copy, plural, runCheck }: SettingRowProps) {
  const form = useFormContext<SettingsValues>()
  const row = useRef<HTMLDivElement>(null)
  const labelId = useId()

  return (
    <FormField<SettingsValues, string>
      name={field.name}
      render={({ field: control, fieldState }) => {
        const value = control.value
        const changed = !same(value, saved)
        const reset = () => {
          form.resetField(field.name)
          // The Reset button fades away under the pointer: focus goes back to the control.
          requestAnimationFrame(() =>
            row.current
              ?.querySelector<HTMLElement>('[data-slot=setting-control] :is(input:not([type=hidden]):not([tabindex="-1"]), textarea, button:not([tabindex="-1"]), [tabindex="0"])')
              ?.focus({ focusVisible: true } as FocusOptions),
          )
        }
        const head = (label: ReactNode) => (
          <div className="flex min-h-5 items-center justify-between gap-3">
            {label}
            <Button
              type="button"
              variant="ghost"
              size="xs"
              data-slot="setting-reset"
              aria-label={copy.resetLabel(field.label, spoken(field, saved, copy))}
              aria-hidden={!changed || undefined}
              tabIndex={changed ? undefined : -1}
              onClick={reset}
              className={cn(
                '-my-1 -me-2 shrink-0 text-fg-muted transition-[opacity,visibility] yj-duration-fast ease-standard',
                !changed && 'invisible opacity-0',
              )}
            >
              <UndoIcon size={13} className="rtl:-scale-x-100" />
              {copy.reset}
            </Button>
          </div>
        )
        const text = typeof value === 'string' ? value : ''
        const foot = (description?: string) => description && <FormDescription>{description}</FormDescription>
        const counter = (max: number | undefined, quiet: boolean) => max !== undefined && <Counter count={text.length} max={max} quiet={quiet} plural={plural} copy={copy} />

        let body: ReactNode
        if (field.type === 'text') {
          body = (
            <FormItem>
              {head(<FormLabel>{field.label}</FormLabel>)}
              <div data-slot="setting-control">
                <InputGroup dir={field.prefix ? 'ltr' : undefined}>
                  {field.prefix && (
                    <InputGroupAddon>
                      <InputGroupText>{field.prefix}</InputGroupText>
                    </InputGroupAddon>
                  )}
                  <InputGroupInput
                    {...control}
                    value={text}
                    placeholder={field.placeholder}
                    autoComplete={field.autoComplete ?? 'off'}
                    spellCheck={field.prefix ? false : undefined}
                    aria-invalid={fieldState.invalid || undefined}
                    // The value runs on from the prefix, as in the address bar.
                    className={field.prefix ? 'ps-0!' : undefined}
                  />
                  {(field.check || field.maxLength !== undefined) && (
                    <InputGroupAddon align="inline-end" className="gap-2">
                      {field.check && <Availability field={field} value={text} saved={saved} copy={copy} runCheck={runCheck} />}
                      {counter(field.maxLength, true)}
                    </InputGroupAddon>
                  )}
                </InputGroup>
              </div>
              {foot(field.description)}
              <FormMessage />
            </FormItem>
          )
        } else if (field.type === 'textarea') {
          body = (
            <FormItem>
              {head(<FormLabel>{field.label}</FormLabel>)}
              <div data-slot="setting-control">
                <InputGroup>
                  <InputGroupTextarea {...control} value={text} rows={3} placeholder={field.placeholder} aria-invalid={fieldState.invalid || undefined} />
                  {field.maxLength !== undefined && (
                    <InputGroupAddon align="block-end" className="justify-end">
                      {counter(field.maxLength, false)}
                    </InputGroupAddon>
                  )}
                </InputGroup>
              </div>
              {foot(field.description)}
              <FormMessage />
            </FormItem>
          )
        } else if (field.type === 'select') {
          body = (
            <FormItem>
              {head(<FormLabel>{field.label}</FormLabel>)}
              <div data-slot="setting-control" className="max-w-xs">
                {field.search ? (
                  <Combobox
                    ref={control.ref}
                    options={field.options}
                    value={text || null}
                    onValueChange={(next) => control.onChange(next ?? '')}
                    onBlur={control.onBlur}
                    searchPlaceholder={copy.search}
                    className="w-full"
                  />
                ) : (
                  <Select items={field.options} value={text} onValueChange={(next) => control.onChange(next ?? '')}>
                    <SelectTrigger ref={control.ref} onBlur={control.onBlur} aria-invalid={fieldState.invalid || undefined} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              {foot(field.description)}
              <FormMessage />
            </FormItem>
          )
        } else if (field.type === 'segmented') {
          body = (
            <FormItem>
              {head(<FieldTitle id={labelId}>{field.label}</FieldTitle>)}
              <div data-slot="setting-control">
                <SegmentedControl variant="pill" aria-labelledby={labelId} value={text} onValueChange={control.onChange} onBlur={control.onBlur} className="max-w-full">
                  {field.options.map((option) => (
                    <SegmentedControlItem key={option.value} value={option.value}>
                      {option.label}
                    </SegmentedControlItem>
                  ))}
                </SegmentedControl>
              </div>
              {foot(field.description)}
              <FormMessage />
            </FormItem>
          )
        } else if (field.type === 'choice') {
          body = (
            <FieldSet className="gap-2.5">
              {head(<FieldLegend variant="label">{field.label}</FieldLegend>)}
              {field.description && <FieldDescription className="-mt-1">{field.description}</FieldDescription>}
              <div data-slot="setting-control">
                <RadioGroup value={text} onValueChange={(next) => control.onChange(next as string)} onBlur={control.onBlur} className="grid gap-2 @xl/fields:grid-cols-3">
                  {field.options.map((option) => (
                    <FieldLabel key={option.value}>
                      <Field orientation="horizontal">
                        <RadioGroupItem value={option.value} />
                        {/* One line each while the column is narrow; tiles side by side once it's wide. */}
                        <FieldContent className="@max-xl/fields:flex-row @max-xl/fields:flex-wrap @max-xl/fields:items-baseline @max-xl/fields:gap-x-2">
                          <FieldTitle>{option.label}</FieldTitle>
                          {option.description && <FieldDescription>{option.description}</FieldDescription>}
                        </FieldContent>
                      </Field>
                    </FieldLabel>
                  ))}
                </RadioGroup>
              </div>
              <FormMessage />
            </FieldSet>
          )
        } else if (field.type === 'switch') {
          body = (
            <FormItem orientation="horizontal" className="items-start gap-6">
              <FieldContent>
                {head(<FormLabel>{field.label}</FormLabel>)}
                {field.description && <FormDescription>{field.description}</FormDescription>}
                <FormMessage />
              </FieldContent>
              <div data-slot="setting-control" className="flex h-5 items-center">
                <Switch ref={control.ref} name={control.name} checked={value === true} onCheckedChange={control.onChange} onBlur={control.onBlur} />
              </div>
            </FormItem>
          )
        } else {
          body = (
            <FormItem>
              {head(<FormLabel>{field.label}</FormLabel>)}
              <div data-slot="setting-control">
                <TagInput
                  ref={control.ref}
                  value={Array.isArray(value) ? value : []}
                  onValueChange={control.onChange}
                  onBlur={control.onBlur}
                  validate={(tag) => field.validateTag?.(tag)}
                  maxTags={field.max}
                  placeholder={field.placeholder}
                />
              </div>
              {foot(field.description)}
              <FormMessage />
            </FormItem>
          )
        }

        return (
          <div ref={row} data-slot="setting" data-yj-changed={changed || undefined} className="relative">
            <span
              aria-hidden
              className={cn(
                'pointer-events-none absolute -start-3 top-0 bottom-0 w-0.5 origin-top rounded-full bg-accent transition-[opacity,scale] yj-duration-base ease-standard @lg/settings:-start-4',
                changed ? 'scale-y-100 opacity-100' : 'scale-y-50 opacity-0',
              )}
            />
            {body}
          </div>
        )
      }}
    />
  )
}
