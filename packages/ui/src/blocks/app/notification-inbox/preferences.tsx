'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card'
import { Field, FieldContent, FieldDescription, FieldLabel } from '../../../components/ui/field'
import { Switch } from '../../../components/ui/switch'
import { cn } from '../../../lib/utils'
import { CHANNELS, type Channel, type Kind, type NotificationsCopy, type Preferences } from './data'

/** Paused by Do not disturb: email and push, except the kinds that always come through. */
const paused = (locked: readonly Channel[] | undefined, channel: Channel, quiet: boolean) => quiet && channel !== 'inApp' && !locked?.length

/**
 * Where each kind of notification reaches you: a table of switches, one row
 * per kind and one column per channel. Do not disturb dims the email and push
 * columns (their settings are kept for when it ends).
 */
export function PreferencesCard({
  copy,
  value,
  locked: lockedChannels,
  onChange,
  quiet,
  onQuietChange,
}: {
  copy: NotificationsCopy
  value: Preferences
  locked: Partial<Record<Kind, readonly Channel[]>>
  onChange: (kind: Kind, channel: Channel, on: boolean) => void
  quiet: boolean
  onQuietChange: (quiet: boolean) => void
}) {
  const kinds = Object.keys(copy.kinds) as Kind[]
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          <h2>{copy.preferences}</h2>
        </CardTitle>
        <CardDescription>{copy.preferencesDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <Field orientation="horizontal" className="rounded-lg border border-line px-3.5 py-3">
          <FieldContent>
            <FieldLabel>{copy.quiet}</FieldLabel>
            <FieldDescription>{copy.quietDescription}</FieldDescription>
          </FieldContent>
          <Switch checked={quiet} onCheckedChange={onQuietChange} />
        </Field>
      </CardContent>
      <CardContent>
        <table className="w-full border-separate border-spacing-0 text-ui">
          <caption className="sr-only">{copy.preferencesDescription}</caption>
          <thead>
            <tr>
              <th scope="col" className="pb-2 text-start text-ui-xs font-medium text-fg-muted">
                {copy.kind}
              </th>
              {CHANNELS.map((channel) => (
                <th
                  key={channel}
                  scope="col"
                  className={cn(
                    'w-14 pb-2 text-center text-ui-xs font-medium text-fg-muted transition-opacity yj-duration-base ease-standard',
                    quiet && channel !== 'inApp' && 'opacity-50',
                  )}
                >
                  {copy.channels[channel]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kinds.map((kind) => {
              const { label, description } = copy.kinds[kind]!
              const locked = lockedChannels[kind] ?? []
              return (
                <tr key={kind}>
                  <th scope="row" className="border-t border-line py-3 pe-3 text-start align-top font-normal">
                    <span className="block font-medium text-fg">{label}</span>
                    <span className="block text-ui-sm text-pretty text-fg-muted">
                      {description}
                      {locked.map((channel) => (
                        <span key={channel} className="block">
                          {copy.required(copy.channels[channel])}
                        </span>
                      ))}
                    </span>
                  </th>
                  {CHANNELS.map((channel) => {
                    const off = paused(locked, channel, quiet)
                    return (
                      <td key={channel} className="border-t border-line py-3 text-center align-top">
                        <span className={cn('inline-flex pt-0.5 transition-opacity yj-duration-base ease-standard', off && 'opacity-40')}>
                          <Switch
                            size="sm"
                            checked={locked.includes(channel) || !!value[kind]?.[channel]}
                            disabled={locked.includes(channel) || off}
                            onCheckedChange={(on) => onChange(kind, channel, on)}
                            aria-label={copy.channelFor(copy.channels[channel], label)}
                          />
                        </span>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </CardContent>
      <CardFooter>
        <p className="text-ui-sm text-fg-muted">{copy.savedHint}</p>
      </CardFooter>
    </Card>
  )
}
