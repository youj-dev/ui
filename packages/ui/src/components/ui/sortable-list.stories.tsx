import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './badge'
import { SortableList, SortableListHandle, SortableListItem } from './sortable-list'

const meta: Meta<typeof SortableList> = {
  title: 'UI/Data/Sortable List',
  component: SortableList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A vertical list the user puts in order, on the same motion/react layer as Kanban. Drag a row by its grip (its dots fuse into bars while held) and the row follows the pointer while its neighbors glide aside on motion `layout`; letting go settles it into the gap, and Escape mid-drag puts it back. From the keyboard the handles are one Tab stop: ↑/↓ walk them, Space or Enter picks a row up, ↑/↓ (Home/End) move it, Space or Enter drops and Escape cancels, each step announced ("Picked up Ship beta, position 2 of 5."). `onValueChange` fires once per drop. Reduced motion: rows jump into place.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SortableList>

const PRIORITIES = [
  { id: 'auth', title: 'Passkey sign-in', team: 'Identity', size: 'L' },
  { id: 'billing', title: 'Usage-based billing', team: 'Growth', size: 'XL' },
  { id: 'audit', title: 'Audit log export', team: 'Platform', size: 'M' },
  { id: 'search', title: 'Search across workspaces', team: 'Core', size: 'L' },
  { id: 'mobile', title: 'Offline mode on mobile', team: 'Mobile', size: 'M' },
]

/** A quarter's roadmap, ranked: drag by the grip, or Tab to a grip and press Space. */
export const Hero: Story = {
  render: function Render() {
    const [order, setOrder] = useState(PRIORITIES.map((p) => p.id))
    const byId = new Map(PRIORITIES.map((p) => [p.id, p]))
    return (
      <div className="flex w-full max-w-[420px] flex-col gap-3">
        <div className="flex items-baseline justify-between px-1">
          <h2 id="q4-heading" className="text-ui-lg font-semibold text-fg">
            Q4 priorities
          </h2>
          <span className="text-ui-sm text-fg-muted">Drag to rank</span>
        </div>
        <SortableList aria-labelledby="q4-heading" value={order} onValueChange={setOrder} className="[counter-reset:rank]">
          {order.map((id) => {
            const item = byId.get(id)!
            return (
              <SortableListItem key={id} value={id} textValue={item.title} className="[counter-increment:rank]">
                <SortableListHandle />
                {/* A CSS counter, so the rank follows the row while it's lifted. */}
                <span aria-hidden className="w-4 text-end text-ui-sm text-fg-muted tabular-nums before:content-[counter(rank)]" />
                <span className="min-w-0 flex-1 truncate font-medium">{item.title}</span>
                <Badge variant="secondary">{item.team}</Badge>
                <span className="w-6 text-end text-ui-sm text-fg-muted tabular-nums">{item.size}</span>
              </SortableListItem>
            )
          })}
        </SortableList>
      </div>
    )
  },
}

/** No grip: with `asHandle`, the whole row is the handle and the keyboard stop. */
export const WholeRow: Story = {
  render: () => (
    <SortableList aria-label="Playlist" className="w-[320px] gap-1">
      {['Intro', 'Midnight City', 'Kids', 'Wait', 'Outro'].map((song) => (
        <SortableListItem key={song} value={song} asHandle>
          <span className="flex-1 px-1">{song}</span>
        </SortableListItem>
      ))}
    </SortableList>
  ),
}

/** `disabled`: the order is locked and the grips are inert. */
export const Disabled: Story = {
  render: () => (
    <SortableList aria-label="Locked steps" disabled className="w-[320px]">
      {['Build', 'Test', 'Deploy'].map((step) => (
        <SortableListItem key={step} value={step} textValue={step}>
          <SortableListHandle />
          {step}
        </SortableListItem>
      ))}
    </SortableList>
  ),
}
