'use client'

import { CalendarIcon, MailIcon, MessageIcon, SearchIcon } from '@youj/icons'
import { InputGroup, InputGroupAddon, InputGroupInput, Switch } from '@youj/react'

const CHANNELS = [
  { title: 'Email', detail: 'Deploys, invites and billing', Icon: MailIcon, on: true },
  { title: 'Comments', detail: 'Replies and mentions on previews', Icon: MessageIcon, on: true },
  { title: 'Weekly digest', detail: 'Every Monday at 9:00', Icon: CalendarIcon, on: false },
]

export default function IconsInGroups() {
  return (
    <div className="w-full max-w-md space-y-3">
      {/* A group isn't a control, so data-yj-trigger makes the whole field the trigger. */}
      <InputGroup data-yj-trigger>
        <InputGroupAddon>
          <SearchIcon strokeWidth={1.75} />
        </InputGroupAddon>
        <InputGroupInput placeholder="Search settings" aria-label="Search settings" />
      </InputGroup>
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {CHANNELS.map(({ title, detail, Icon, on }) => (
          // The row is the trigger: hovering anywhere on it, or focusing its switch, plays the icon.
          <li key={title} data-yj-trigger className="flex items-center gap-3 px-4 py-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-band text-fg">
              <Icon size={16} strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-ui font-medium text-fg">{title}</p>
              <p className="text-ui-sm text-fg-muted">{detail}</p>
            </div>
            <Switch defaultChecked={on} aria-label={title} />
          </li>
        ))}
      </ul>
    </div>
  )
}
