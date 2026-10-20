'use client'

import { useState } from 'react'
import { WorkspaceSwitcher, type Workspace } from '@youj/react/workspace-switcher'

const SEED: Workspace[] = [
  { id: 'northwind', name: 'Northwind Labs', detail: 'Pro · 12 members' },
  { id: 'acme', name: 'Acme Corp', detail: 'Enterprise · 148 members' },
  { id: 'globex', name: 'Globex', detail: 'Free · 3 members' },
  { id: 'personal', name: 'Personal', detail: 'Hobby' },
]

export default function WorkspaceSwitcherDemo() {
  const [workspaces, setWorkspaces] = useState(SEED)
  const [value, setValue] = useState('northwind')

  return (
    <div className="w-64 rounded-xl border border-line bg-chrome p-2 shadow-xs">
      <WorkspaceSwitcher
        workspaces={workspaces}
        value={value}
        onValueChange={setValue}
        className="w-full"
        // Type a name that isn't there, then press Enter on "Create workspace".
        onCreate={(name) => {
          const id = `ws-${workspaces.length + 1}`
          setWorkspaces((list) => [...list, { id, name: name || 'Untitled workspace', detail: 'Free · 1 member' }])
          setValue(id)
        }}
      />
      <div className="mt-2 flex flex-col gap-1 border-t border-line px-1.5 pt-3 pb-1">
        {['Projects', 'Deployments', 'Members'].map((label) => (
          <span key={label} className="h-7 rounded-md px-1.5 text-ui leading-7 text-fg-muted">
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
