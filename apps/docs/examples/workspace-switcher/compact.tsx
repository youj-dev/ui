'use client'

import { useState } from 'react'
import { FolderIcon, HomeIcon, SettingsIcon, UsersIcon } from '@youj/icons'
import { Button } from '@youj/react'
import { WorkspaceSwitcher, type Workspace } from '@youj/react/workspace-switcher'

const WORKSPACES: Workspace[] = [
  { id: 'northwind', name: 'Northwind Labs', detail: 'Pro · 12 members' },
  { id: 'acme', name: 'Acme Corp', detail: 'Enterprise · 148 members' },
  { id: 'personal', name: 'Personal', detail: 'Hobby' },
]

export default function WorkspaceSwitcherCompact() {
  const [value, setValue] = useState('acme')

  return (
    // A sidebar collapsed to icons: the switcher shrinks to its logo, and the popup opens beside the rail.
    <nav aria-label="Workspace" className="flex h-72 flex-col items-center gap-1 rounded-xl border border-line bg-chrome p-2 shadow-xs">
      <WorkspaceSwitcher compact workspaces={WORKSPACES} value={value} onValueChange={setValue} side="inline-end" />
      <span aria-hidden className="my-1 h-px w-6 bg-line" />
      {[
        { label: 'Home', icon: <HomeIcon size={18} strokeWidth={1.75} /> },
        { label: 'Projects', icon: <FolderIcon size={18} strokeWidth={1.75} /> },
        { label: 'Members', icon: <UsersIcon size={18} strokeWidth={1.75} /> },
      ].map((item) => (
        <Button key={item.label} variant="ghost" size="icon" aria-label={item.label}>
          {item.icon}
        </Button>
      ))}
      <Button variant="ghost" size="icon" aria-label="Settings" className="mt-auto">
        <SettingsIcon size={18} strokeWidth={1.75} />
      </Button>
    </nav>
  )
}
