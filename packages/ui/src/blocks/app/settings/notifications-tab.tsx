'use client'

import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '../../../components/ui/field'
import { Switch } from '../../../components/ui/switch'
import { DEFAULT_COPY, NOTIFY, type SettingsCopy, type SettingsNotification, type SettingsNotificationGroup } from './data'
import { Section } from './section'
import { Eyebrow } from '../../../components/ui/typography'

export interface NotificationsTabProps {
  /** Default: the demo's strings. */
  copy?: SettingsCopy
  /** Default: the demo's notification groups. */
  notifications?: SettingsNotificationGroup[]
  onNotificationChange?: (notification: SettingsNotification, on: boolean) => void
}

export function NotificationsTab({ copy = DEFAULT_COPY, notifications = NOTIFY, onNotificationChange }: NotificationsTabProps) {
  return (
    <Section title={copy.notificationsTitle} description={copy.notificationsDescription}>
      <FieldGroup>
        {notifications.map((g) => (
          <FieldSet key={g.group}>
            <FieldLegend variant="label">
              <Eyebrow className="text-ui text-fg">{g.group}</Eyebrow>
            </FieldLegend>
            <div className="flex flex-col divide-y divide-line rounded-lg border border-line">
              {g.items.map((item) => (
                <Field key={item.id} orientation="horizontal" className="px-4 py-3">
                  <FieldContent>
                    <FieldLabel>{item.label}</FieldLabel>
                    <FieldDescription>{item.description}</FieldDescription>
                  </FieldContent>
                  <Switch defaultChecked={item.on} onCheckedChange={(on) => onNotificationChange?.(item, on)} />
                </Field>
              ))}
            </div>
          </FieldSet>
        ))}
      </FieldGroup>
    </Section>
  )
}
