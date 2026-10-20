'use client'

import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { AsyncButton } from '../../../components/ui/async-button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card'
import { Checkbox } from '../../../components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group'
import { FieldGroup, FieldLegend, FieldSet } from '../../../components/ui/field'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { useControllableState } from '../../../hooks/use-controllable-state'
import { cn } from '../../../lib/utils'
import { demo } from './data'
import {
  PREFERENCES_CHANNELS,
  PREFERENCES_COPY,
  PREFERENCES_REMINDERS,
  PREFERENCES_VALUE,
  PREFERENCES_WHAT,
  type NotificationOption,
  type NotificationPreferencesCopy,
  type NotificationPreferencesValue,
} from './notification-preferences-data'

/* A person's notification preferences as one card: a master Off / On switch,
 * what to be told about (one choice, as cards), reminders and channels (any
 * of them). Turning the master off mutes and disables everything under it.
 * Nothing is sent until Save changes, which stays disabled while the card
 * matches what was last saved; `onSave` may be async, and a rejection's
 * message shows under the footer. Pass your own `what`, `reminders` and
 * `channels`, own the draft with `value` / `onValueChange` and save through
 * `onSave`; every string is in `copy`. */

interface NotificationPreferencesProps extends Omit<ComponentProps<'div'>, 'children' | 'defaultValue' | 'onChange'> {
  /** The draft, controlled. Pair it with `onValueChange`. */
  value?: NotificationPreferencesValue
  /** The draft when the card opens, uncontrolled. It is also what counts as saved at first. Default: the demo's. */
  defaultValue?: NotificationPreferencesValue
  /** Called with the new draft after every change. */
  onValueChange?: (value: NotificationPreferencesValue) => void
  /** Saves the draft; resolve when stored, throw to show why. Default: a short demo wait. */
  onSave?: (value: NotificationPreferencesValue) => Promise<unknown> | unknown
  /** The "what" choices, one of which is picked. Default: the demo's three. */
  what?: NotificationOption[]
  /** The reminders, any of which may be ticked. Default: the demo's three. */
  reminders?: NotificationOption[]
  /** The channels, any of which may be ticked. Default: email, push and in app. */
  channels?: NotificationOption[]
  /** The title's level. Default 2. */
  headingLevel?: 1 | 2 | 3
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<NotificationPreferencesCopy>
}

/** A soft grouped list: one tinted container, hairlines between rows. */
const list = 'flex flex-col divide-y divide-line-subtle overflow-hidden rounded-lg bg-band'

/** One row: the choice's title and line on the left, its control at the end; the whole row is the target. */
function Row({ option, children }: { option: NotificationOption; children: ReactNode }) {
  return (
    <label className="flex min-h-16 cursor-pointer items-center gap-4 px-4 py-3 has-[[data-disabled]]:cursor-default">
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-ui font-medium text-fg">{option.label}</span>
        {option.description && <span className="text-ui-sm text-fg-muted">{option.description}</span>}
      </span>
      {children}
    </label>
  )
}

function NotificationPreferences({
  value: valueProp,
  defaultValue = PREFERENCES_VALUE,
  onValueChange,
  onSave,
  what = PREFERENCES_WHAT,
  reminders = PREFERENCES_REMINDERS,
  channels = PREFERENCES_CHANNELS,
  headingLevel = 2,
  copy: copyProp,
  className,
  ...rest
}: NotificationPreferencesProps) {
  const copy = { ...PREFERENCES_COPY, ...copyProp }
  const titleId = useId()
  const Title = `h${headingLevel}` as const
  const [value, setValue] = useControllableState(valueProp, defaultValue)
  const [saved, setSaved] = useState(defaultValue)
  const [saving, setSaving] = useState<string>('idle')
  const [failure, setFailure] = useState<string>()
  const change = (patch: Partial<NotificationPreferencesValue>) => {
    const next = { ...value, ...patch }
    setValue(next)
    setFailure(undefined)
    onValueChange?.(next)
  }
  const same = (a: string[], b: string[]) => a.length === b.length && a.every((id) => b.includes(id))
  const dirty = value.enabled !== saved.enabled || value.what !== saved.what || !same(value.reminders, saved.reminders) || !same(value.channels, saved.channels)
  const off = !value.enabled
  const tick = (list: string[], id: string, on: boolean) => (on ? [...list, id] : list.filter((x) => x !== id))

  return (
    <Card {...rest} role="region" aria-labelledby={titleId} className={cn('w-full max-w-xl', className)}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
        <CardAction>
          <SegmentedControl variant="pill" size="sm" aria-label={copy.master} value={value.enabled ? 'on' : 'off'} onValueChange={(next) => change({ enabled: next === 'on' })} className="w-32">
            <SegmentedControlItem value="off">{copy.off}</SegmentedControlItem>
            <SegmentedControlItem value="on">{copy.on}</SegmentedControlItem>
          </SegmentedControl>
        </CardAction>
      </CardHeader>
      <CardContent>
        <FieldGroup className="gap-6">
          <FieldSet>
            <FieldLegend variant="label">{copy.what}</FieldLegend>
            <RadioGroup value={value.what} disabled={off} onValueChange={(next) => change({ what: next as string })} aria-label={copy.what} className={list}>
              {what.map((o) => (
                <Row key={o.id} option={o}>
                  <RadioGroupItem value={o.id} disabled={off} />
                </Row>
              ))}
            </RadioGroup>
          </FieldSet>

          <FieldSet>
            <FieldLegend variant="label">{copy.reminders}</FieldLegend>
            <div role="group" aria-label={copy.reminders} className={list}>
              {reminders.map((o) => (
                <Row key={o.id} option={o}>
                  <Checkbox checked={value.reminders.includes(o.id)} disabled={off} onCheckedChange={(on) => change({ reminders: tick(value.reminders, o.id, on) })} />
                </Row>
              ))}
            </div>
          </FieldSet>

          <FieldSet>
            <FieldLegend variant="label">{copy.how}</FieldLegend>
            <div role="group" aria-label={copy.how} className={list}>
              {channels.map((o) => (
                <Row key={o.id} option={o}>
                  <Checkbox checked={value.channels.includes(o.id)} disabled={off} onCheckedChange={(on) => change({ channels: tick(value.channels, o.id, on) })} />
                </Row>
              ))}
            </div>
          </FieldSet>
        </FieldGroup>
      </CardContent>
      <CardFooter className="flex-wrap items-center justify-between gap-3">
        <p className="min-w-48 flex-1 font-sans text-ui normal-case tracking-normal text-fg-muted">{off ? copy.mutedNote : copy.note}</p>
        <AsyncButton
          disabled={!dirty && saving === 'idle'}
          pendingLabel={copy.saving}
          successLabel={copy.saved}
          onActionStateChange={setSaving}
          onAction={async () => {
            setFailure(undefined)
            try {
              await (onSave ? onSave(value) : demo('Settings: onSaveNotifications', 700))
            } catch (failed) {
              setFailure(failed instanceof Error && failed.message ? failed.message : copy.failed)
              throw failed
            }
            setSaved(value)
          }}
        >
          {copy.save}
        </AsyncButton>
        {failure && (
          <p role="alert" className="basis-full text-end text-ui-sm text-danger-text">
            {failure}
          </p>
        )}
      </CardFooter>
    </Card>
  )
}

export { NotificationPreferences, type NotificationPreferencesProps }
