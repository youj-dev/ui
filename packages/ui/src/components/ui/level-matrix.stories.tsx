import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { diffPermissions, LevelMatrix, type LevelMatrixProps, type PermissionResource, type PermissionRole, type PermissionValue } from './level-matrix'

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

const meta: Meta<LevelMatrixProps> = {
  title: 'UI/Inputs/Level Matrix',
  component: LevelMatrix,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Roles by resources, each cell an access level (none, read, write, admin) drawn as three segments lit to it. Against `baseline`, pending changes show in the cell: gains light in the success tone, losses stay as a hollow danger outline; `diffPermissions` lists them. A row header’s box selects the role, a column header’s the resource for every role, the corner everything, and the bar that opens sets them all to one level; locked roles sit out. One tab stop, then the ARIA grid pattern: arrow keys, Home and End, Ctrl+Home and Ctrl+End; Space or Enter steps a cell up a level, with Shift down. Every change is announced. Reduced motion: levels change in place.',
      },
    },
  },
  args: { roles: ROLES, resources: RESOURCES, defaultValue: SAVED, label: 'Workspace permissions' },
}
export default meta
type Story = StoryObj<LevelMatrixProps>

const frame = 'w-[min(44rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-surface'

export const Playground: Story = {
  name: 'Permissions by role',
  render: (args) => (
    <div className={frame}>
      <LevelMatrix {...args} />
    </div>
  ),
}

/** Controlled against a saved baseline, with the pending diff listed under it. */
export const PendingChanges: Story = {
  name: 'Pending changes',
  render: function Render(args) {
    const [value, setValue] = useState<PermissionValue>({ ...SAVED, editor: { ...SAVED.editor, api: 'write' }, viewer: { ...SAVED.viewer, docs: 'none' } })
    const changes = diffPermissions(SAVED, value, ROLES, RESOURCES)
    return (
      <div className="flex flex-col gap-3">
        <div className={frame}>
          <LevelMatrix {...args} value={value} baseline={SAVED} onValueChange={setValue} />
        </div>
        <ul className="font-mono text-ui-sm text-fg-muted">
          {changes.map((c) => (
            <li key={`${c.role.id}-${c.resource.id}`}>
              {c.role.name} · {c.resource.name}: {c.from} → {c.to}
            </li>
          ))}
        </ul>
      </div>
    )
  },
}
