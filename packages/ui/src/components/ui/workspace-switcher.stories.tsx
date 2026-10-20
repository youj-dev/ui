import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { WorkspaceSwitcher, type Workspace } from './workspace-switcher'

const meta: Meta<typeof WorkspaceSwitcher> = {
  title: 'UI/Navigation/WorkspaceSwitcher',
  component: WorkspaceSwitcher,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Switch between workspaces: a trigger with the current one\'s logo or initials, and a Popover with a searchable Command list. The current workspace wears a check that draws in; the active row is Command\'s sliding highlight and the list eases between heights as the search filters it. "Create workspace" carries the search text, so typing a new name and pressing Enter on it starts creating that one. Keyboard: Enter / ↓ opens with focus in the search, ↑ ↓ move, Enter chooses, Escape closes and returns focus. `compact` shows only the logo, for a sidebar collapsed to icons.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof WorkspaceSwitcher>

const seed: Workspace[] = [
  { id: 'northwind', name: 'Northwind Labs', detail: 'Pro · 12 members' },
  { id: 'acme', name: 'Acme Corp', detail: 'Enterprise · 148 members' },
  { id: 'globex', name: 'Globex', detail: 'Free · 3 members' },
  { id: 'personal', name: 'Personal', detail: 'Hobby' },
]

function Demo({ compact }: { compact?: boolean }) {
  const [workspaces, setWorkspaces] = useState(seed)
  const [value, setValue] = useState('northwind')
  return (
    <div className="w-60">
      <WorkspaceSwitcher
        workspaces={workspaces}
        value={value}
        onValueChange={setValue}
        compact={compact}
        className="w-full"
        onCreate={(name) => {
          const id = `ws-${workspaces.length + 1}`
          setWorkspaces((list) => [...list, { id, name: name || 'Untitled workspace', detail: 'Free · 1 member' }])
          setValue(id)
        }}
      />
    </div>
  )
}

export const Default: Story = { render: () => <Demo /> }

export const Compact: Story = { render: () => <Demo compact /> }
