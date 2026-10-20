'use client'

import { useId } from 'react'
import { Button } from '../../../components/ui/button'
import { Checkbox } from '../../../components/ui/checkbox'
import { FieldDescription, FieldError, FieldLegend, FieldSet } from '../../../components/ui/field'
import { ALL_EVENTS, EVENT_GROUPS, type WebhooksCopy } from './data'
import { Eyebrow } from '../../../components/ui/typography'

/** Events by group: a group's box checks or clears all of it, and shows mixed when it's partly on. */
export function EventPicker({ value, onChange, error, copy }: { value: string[]; onChange: (next: string[]) => void; error?: string; copy: WebhooksCopy }) {
  const id = useId()
  const has = new Set(value)
  const set = (events: string[], on: boolean) => onChange(ALL_EVENTS.filter((e) => (events.includes(e) ? on : has.has(e))))
  return (
    <FieldSet data-invalid={error ? true : undefined}>
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <FieldLegend variant="label" className="mb-0">
            <Eyebrow className="text-ui text-fg">{copy.events}</Eyebrow>
          </FieldLegend>
          <FieldDescription aria-live="polite" className="tabular-nums">
            {copy.selected(value.length, ALL_EVENTS.length)}
          </FieldDescription>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => onChange(ALL_EVENTS)}>
            {copy.selectAll}
          </Button>
          <Button variant="ghost" size="sm" disabled={!value.length} onClick={() => onChange([])}>
            {copy.clear}
          </Button>
        </div>
      </div>
      <div className="divide-y divide-line rounded-md border border-line">
        {EVENT_GROUPS.map((group) => {
          const count = group.events.filter((e) => has.has(e)).length
          const groupId = `${id}-${group.label}`
          return (
            <div key={group.label} role="group" aria-labelledby={groupId} className="flex flex-col gap-1 px-3 py-2.5">
              <label className="flex min-h-7 items-center gap-2.5 text-ui font-medium text-fg">
                <Checkbox checked={count === group.events.length} indeterminate={count > 0 && count < group.events.length} onCheckedChange={(on) => set(group.events, on)} />
                <span id={groupId}>{group.label}</span>
                <span className="ms-auto text-ui-xs font-normal text-fg-muted tabular-nums">
                  {count}/{group.events.length}
                </span>
              </label>
              <div className="grid gap-x-4 ps-6.5 sm:grid-cols-2">
                {group.events.map((event) => (
                  <label key={event} className="flex min-h-7 min-w-0 items-center gap-2.5 text-ui-sm text-fg-muted has-data-checked:text-fg">
                    <Checkbox checked={has.has(event)} onCheckedChange={(on) => set([event], on)} />
                    <span dir="ltr" className="truncate font-mono">
                      {event}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <FieldError>{error}</FieldError>
    </FieldSet>
  )
}
