import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { CapsuleSearch } from './capsule-search'

const meta: Meta<typeof CapsuleSearch> = {
  title: 'UI/Capsules/Capsule Search',
  component: CapsuleSearch,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A search that waits as a small capsule with its shortcut on it and opens when it’s wanted. Press the shortcut anywhere (`/`, or `mod+k` for ⌘K on Apple and Ctrl K elsewhere) or click it and the capsule widens; the key hint gives way to a clear button once there’s text. It stays open while it holds text; Escape clears it, then leaves it. The widening is a layout morph (transform only, ends kept round) on the snappy spring, and a quick focus and blur reverses mid-flight. Reduced motion: it snaps open.',
      },
    },
  },
  args: { shortcut: '/', placeholder: 'Search samples' },
}
export default meta
type Story = StoryObj<typeof CapsuleSearch>

/** Press `/` from anywhere on the page to open it; Escape clears, then leaves. */
export const Hero: Story = {}

function Submitting() {
  const [last, setLast] = useState('')
  return (
    <div className="flex flex-col items-start gap-3">
      <CapsuleSearch shortcut="mod+k" placeholder="Jump to…" width={{ rest: '10rem', open: '22rem' }} onSubmit={setLast} />
      <p className="font-mono text-ui-sm text-fg-muted">{last ? `submitted “${last}”` : 'Enter submits'}</p>
    </div>
  )
}

/** `mod+k`: ⌘K on Apple, Ctrl K elsewhere, with a wider open width. */
export const ModK: Story = { render: () => <Submitting /> }

/** A small one, holding a query: it stays open and offers to clear. */
export const WithQuery: Story = { args: { size: 'sm', defaultValue: 'kick 808', shortcut: undefined } }
