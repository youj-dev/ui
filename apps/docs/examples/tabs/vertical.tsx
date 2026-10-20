'use client'

import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@youj/react'
import { CreditCardIcon, KeyIcon, PlugIcon, SettingsIcon, ShieldCheckIcon, UsersIcon } from '@youj/icons'

const SECTIONS = [
  { value: 'general', label: 'General', Icon: SettingsIcon, body: 'Workspace name, URL and default region.' },
  { value: 'members', label: 'Members', Icon: UsersIcon, body: '8 members and 1 pending invite. Roles decide who can deploy.' },
  { value: 'billing', label: 'Billing', Icon: CreditCardIcon, body: 'Pro plan, renews on the 1st. Usage alerts at 80%.' },
  { value: 'security', label: 'Security', Icon: ShieldCheckIcon, body: 'SAML SSO, enforced two-factor sign-in and the audit log.' },
  { value: 'integrations', label: 'Integrations', Icon: PlugIcon, body: 'GitHub, Slack and Linear are connected.' },
  { value: 'tokens', label: 'API tokens', Icon: KeyIcon, body: '3 active tokens. The oldest expires in 12 days.' },
]

export default function TabsVertical() {
  return (
    <div className="@container w-full max-w-2xl">
      {/* Vertical tabs use ↑ ↓. Below the container's lg width the list stacks above the panel. */}
      <Tabs defaultValue="members" orientation="vertical" className="flex-col gap-4 @lg:flex-row @lg:gap-6">
        <TabsList aria-label="Settings" className="w-full @lg:w-44">
          {SECTIONS.map(({ value, label, Icon }) => (
            <TabsTrigger key={value} value={value}>
              <Icon size={16} />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        {SECTIONS.map(({ value, label, body }) => (
          <TabsContent key={value} value={value} className="rounded-xl border border-line bg-surface p-5">
            <p className="text-ui-lg font-semibold text-fg">{label}</p>
            <p className="mt-1.5 text-fg-muted">{body}</p>
            <Button variant="outline" size="sm" className="mt-4">
              Manage {label.toLowerCase()}
            </Button>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
