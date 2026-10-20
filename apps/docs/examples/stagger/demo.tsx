'use client'

import { Stagger } from '@youj/motion'
import {
  CloudIcon,
  DatabaseIcon,
  GitMergeIcon,
  KeyIcon,
  LineChartIcon,
  MailIcon,
  MessagesIcon,
  ShieldCheckIcon,
} from '@youj/icons'

const INTEGRATIONS = [
  { name: 'GitHub', detail: 'Deploy on push', Icon: GitMergeIcon, connected: true },
  { name: 'Postgres', detail: 'A branch per preview', Icon: DatabaseIcon, connected: true },
  { name: 'Slack', detail: 'Deploy notifications', Icon: MessagesIcon, connected: true },
  { name: 'Edge Config', detail: 'Read at the edge', Icon: CloudIcon },
  { name: 'Analytics', detail: 'Core Web Vitals', Icon: LineChartIcon },
  { name: 'Secrets', detail: 'Encrypted variables', Icon: KeyIcon, connected: true },
  { name: 'Firewall', detail: 'Managed rules', Icon: ShieldCheckIcon },
  { name: 'Resend', detail: 'Transactional email', Icon: MailIcon },
]

export default function StaggerDemo() {
  return (
    <div className="@container w-full max-w-2xl">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-lg font-semibold tracking-tight text-fg">Integrations</p>
          <p className="mt-0.5 text-sm text-fg-muted">Connect the services your project already uses.</p>
        </div>
        <span className="shrink-0 text-xs text-fg-muted">4 connected</span>
      </div>
      {/* `center` ripples out from the middle of the sequence, so the grid arrives as one gesture. */}
      <Stagger as="ul" itemAs="li" order="center" inView={false} className="grid grid-cols-2 gap-2.5 @lg:grid-cols-4">
        {INTEGRATIONS.map(({ name, detail, Icon, connected }) => (
          <div key={name} className="flex h-full flex-col gap-3.5 rounded-xl border border-line bg-surface p-3.5">
            <div className="flex items-center justify-between">
              <span className="grid size-8 place-items-center rounded-lg border border-line bg-raised text-fg">
                <Icon size={16} strokeWidth={1.75} />
              </span>
              {connected && <span className="rounded-full bg-accent-subtle px-2 py-0.5 text-[11px] font-medium text-accent">Connected</span>}
            </div>
            <div>
              <p className="text-sm font-medium text-fg">{name}</p>
              <p className="text-xs text-fg-muted">{detail}</p>
            </div>
          </div>
        ))}
      </Stagger>
    </div>
  )
}
