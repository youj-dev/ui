import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { ItemPager } from './item-pager'

const meta: Meta<typeof ItemPager> = {
  title: 'UI/Navigation/ItemPager',
  component: ItemPager,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Steps through the records of a list from a detail panel: ↓ opens the next row, ↑ the previous one, and "5 of 48" says where you are. J and K (or the arrow keys) step while focus is in it; `shortcuts="global"` listens on the whole page, skipping fields. The ends disable their button but keep it focusable, and the position is announced politely.',
      },
    },
  },
  args: { total: 48, shortcuts: 'focus' },
  argTypes: { shortcuts: { control: 'inline-radio', options: ['focus', 'global', 'none'] } },
}
export default meta
type Story = StoryObj<typeof ItemPager>

const companies = ['Lumen Freight', 'Orrery Labs', 'Fernhill Bank', 'Quayside Foods', 'Brightwater Health', 'Cinder & Pike', 'Tessellate']

/** A detail panel's header: the stepper, the record it opened, and the panel's own actions. */
export const Hero: Story = {
  name: 'Company records',
  args: { total: companies.length },
  render: function Render(args) {
    const [index, setIndex] = useState(1)
    return (
      <div className="flex w-96 flex-col overflow-hidden rounded-xl border border-line bg-overlay shadow-md">
        <div className="flex h-12 items-center gap-2 border-b border-line px-3">
          <ItemPager {...args} index={index} onIndexChange={setIndex} />
          <div className="ms-auto flex gap-1.5">
            <Button variant="outline" size="xs">
              Edit
            </Button>
            <Button variant="secondary" size="xs">
              Open
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-0.5 p-4">
          <span className="text-base font-semibold">{companies[index]}</span>
          <span className="text-ui-sm text-fg-muted">Press J or K with focus on the stepper, or use its buttons.</span>
        </div>
      </div>
    )
  },
}

/** At either end the button disables but stays focusable, so stepping onto the last record keeps focus where it was. */
export const Ends: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <ItemPager {...args} index={0} onIndexChange={() => {}} />
      <ItemPager {...args} index={47} onIndexChange={() => {}} />
    </div>
  ),
}

/** `shortcuts="global"`: J and K step from anywhere on the page, except while typing in a field. */
export const GlobalShortcuts: Story = {
  args: { shortcuts: 'global' },
  render: function Render(args) {
    const [index, setIndex] = useState(4)
    return (
      <div className="flex flex-col items-start gap-3">
        <ItemPager {...args} index={index} onIndexChange={setIndex} />
        <input aria-label="A field: J and K type here" placeholder="J and K type here" className="h-control w-64 rounded-md border border-line-control bg-transparent px-2.5 text-ui focus-field" />
      </div>
    )
  },
}

/** A German page: the position follows the locale, the labels the provider's. */
export const Localized: Story = {
  render: function Render(args) {
    const [index, setIndex] = useState(1233)
    return <ItemPager {...args} total={4812} locale="de-DE" index={index} onIndexChange={setIndex} />
  },
}
