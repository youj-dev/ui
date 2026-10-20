'use client'

import { useRef } from 'react'
import { useFieldArray, useFormContext, useFormState, useWatch } from 'react-hook-form'
import { PlusIcon, TrashIcon } from '@youj/icons'
import { PresenceItem, PresenceList } from '@youj/motion'
import { Button } from '../../../components/ui/button'
import { FieldError } from '../../../components/ui/field'
import { FormField, FormItem, FormLabel, FormMessage } from '../../../components/ui/form'
import { Input } from '../../../components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '../../../components/ui/input-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { cn } from '../../../lib/utils'
import { EMPTY_PERSON, type MultiStepFormCopy, type ApplicationOption, type ApplicationValues } from './data'

/* The people who run or own the business, one card each: a name, a role and,
 * for an owner, their share. A new person fades down into place while the
 * cards below make room, and the new card's name takes focus; a removed one
 * fades and the rest close up, with focus on the next card (or Add). The
 * owners' total is counted under the list as it's typed, and more than 100%
 * is refused there. */

export function PeopleStep({ roles, max, copy }: { roles: ApplicationOption[]; max: number; copy: MultiStepFormCopy }) {
  const { control, setFocus } = useFormContext<ApplicationValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'people' })
  const people = useWatch({ control, name: 'people' })
  const { errors } = useFormState({ control, name: 'people' })
  const add = useRef<HTMLButtonElement>(null)
  const shares = roles.some((r) => r.share)
  const owns = (role: string) => !!roles.find((r) => r.value === role)?.share
  const total = (people ?? []).reduce((sum, p) => sum + (owns(p.role) ? Number(p.share) || 0 : 0), 0)

  return (
    <div className="flex flex-col gap-3">
      <PresenceList className="flex flex-col gap-3">
        {fields.map((item, index) => {
          const owner = owns(people?.[index]?.role ?? '')
          const name = people?.[index]?.name.trim()
          return (
            <PresenceItem key={item.id} className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-3.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-ui-sm font-medium text-fg-muted">{copy.person(index + 1)}</span>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="-my-1 -me-1.5"
                    aria-label={copy.removePerson(name || copy.person(index + 1))}
                    onClick={() => {
                      remove(index)
                      const next = Math.min(index, fields.length - 2)
                      requestAnimationFrame(() => (next >= 0 ? setFocus(`people.${next}.name`) : add.current?.focus()))
                    }}
                  >
                    <TrashIcon size={15} />
                  </Button>
                )}
              </div>
              <div className={cn('grid gap-3', shares ? '@md/application:grid-cols-[minmax(0,1fr)_minmax(0,--spacing(44))_minmax(0,--spacing(26))]' : '@md/application:grid-cols-[minmax(0,1fr)_minmax(0,--spacing(44))]')}>
                <FormField
                  name={`people.${index}.name`}
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>{copy.personName}</FormLabel>
                      <Input {...field} autoComplete="off" aria-invalid={fieldState.invalid || undefined} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name={`people.${index}.role`}
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>{copy.role}</FormLabel>
                      <Select items={roles} value={field.value || null} onValueChange={(value) => field.onChange(value ?? '')}>
                        <SelectTrigger ref={field.ref} onBlur={field.onBlur} aria-invalid={fieldState.invalid || undefined} className="w-full">
                          <SelectValue placeholder={copy.choose} />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {shares && (
                  <FormField
                    name={`people.${index}.share`}
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className={cn(!owner && 'opacity-50')}>{copy.share}</FormLabel>
                        <InputGroup>
                          <InputGroupInput
                            {...field}
                            value={owner ? field.value : ''}
                            disabled={!owner}
                            inputMode="numeric"
                            maxLength={3}
                            aria-invalid={fieldState.invalid || undefined}
                            className="font-mono tabular-nums"
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupText>%</InputGroupText>
                          </InputGroupAddon>
                        </InputGroup>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </PresenceItem>
          )
        })}
      </PresenceList>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button ref={add} type="button" variant="secondary" disabled={fields.length >= max} onClick={() => append({ ...EMPTY_PERSON }, { focusName: `people.${fields.length}.name` })}>
          <PlusIcon size={15} />
          {copy.addPerson}
        </Button>
        {shares && <span className={cn('font-mono text-ui-sm tabular-nums', total > 100 ? 'text-danger-text' : 'text-fg-muted')}>{copy.shares(total)}</span>}
      </div>
      <FieldError>{errors.people?.root?.message}</FieldError>
    </div>
  )
}
