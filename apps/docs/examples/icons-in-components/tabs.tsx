'use client'

import { GitBranchIcon, LayoutGridIcon, LineChartIcon, SettingsIcon } from '@youj/icons'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@youj/react'

const TABS = [
  { value: 'overview', label: 'Overview', Icon: LayoutGridIcon, body: 'Production is healthy. The last deploy went out 12 minutes ago.' },
  { value: 'deployments', label: 'Deployments', Icon: GitBranchIcon, body: '3 preview deployments are waiting for review.' },
  { value: 'analytics', label: 'Analytics', Icon: LineChartIcon, body: 'Visitors are up 18% on last week.' },
  { value: 'settings', label: 'Settings', Icon: SettingsIcon, body: 'Domains, environment variables and access.' },
]

export default function IconsInTabs() {
  return (
    <Tabs defaultValue="overview" className="w-full max-w-lg">
      <TabsList>
        {/* Each tab is the trigger for its own icon: hover or arrow to it and it plays. */}
        {TABS.map(({ value, label, Icon }) => (
          <TabsTrigger key={value} value={value}>
            <Icon strokeWidth={1.75} />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {TABS.map(({ value, body }) => (
        <TabsContent key={value} value={value} className="px-1 py-2 text-fg-muted">
          {body}
        </TabsContent>
      ))}
    </Tabs>
  )
}
