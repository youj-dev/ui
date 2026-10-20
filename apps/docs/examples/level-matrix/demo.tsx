'use client'

import { useState } from 'react'
import { Button, diffPermissions, LevelMatrix, type PermissionResource, type PermissionRole, type PermissionValue } from '@youj/react'

const ROLES: PermissionRole[] = [
  { id: 'owner', name: 'Owner', detail: '1 member', locked: true },
  { id: 'editor', name: 'Editor', detail: '8 members' },
  { id: 'viewer', name: 'Viewer', detail: '23 members' },
]
const RESOURCES: PermissionResource[] = [
  { id: 'docs', name: 'Docs' },
  { id: 'billing', name: 'Billing' },
  { id: 'members', name: 'Members' },
  { id: 'api', name: 'API keys' },
]
const SAVED: PermissionValue = {
  owner: { docs: 'admin', billing: 'admin', members: 'admin', api: 'admin' },
  editor: { docs: 'write', billing: 'read', members: 'read', api: 'none' },
  viewer: { docs: 'read', billing: 'none', members: 'none', api: 'none' },
}

export default function LevelMatrixDemo() {
  const [saved, setSaved] = useState(SAVED)
  const [value, setValue] = useState(SAVED)
  const changes = diffPermissions(saved, value, ROLES, RESOURCES)
  return (
    <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-line bg-surface">
      <LevelMatrix label="Workspace permissions" roles={ROLES} resources={RESOURCES} value={value} baseline={saved} onValueChange={setValue} />
      <div className="flex items-center justify-between gap-3 px-5 py-3">
        <span className="font-mono text-ui-sm text-fg-muted">{changes.length ? `${changes.length} pending` : 'Up to date'}</span>
        <Button size="sm" disabled={!changes.length} onClick={() => setSaved(value)}>
          Apply
        </Button>
      </div>
    </div>
  )
}
