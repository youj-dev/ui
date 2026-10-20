import type { Meta, StoryObj } from '@storybook/react-vite'
import { BoldIcon, ItalicIcon, PinIcon, UnderlineIcon } from '@youj/icons'
import { StarIcon } from '@youj/icons/components/youj/icons/star'
import { Specimen } from '../../stories/kit'
import { Toggle } from './toggle'

const meta: Meta<typeof Toggle> = {
  title: 'UI/Primitives/Toggle',
  component: Toggle,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Base UI toggle: a two-state button with aria-pressed. Pressed reads as a filled neutral key with full-strength text; the accent stays reserved for actions. Same precise press as Button (3% in on instant, out on fast; none under reduced motion). Space and Enter toggle.',
      },
    },
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['default', 'outline'] },
    size: { control: 'inline-radio', options: ['sm', 'default', 'lg'] },
  },
  args: { variant: 'default', size: 'default' },
}
export default meta
type Story = StoryObj<typeof Toggle>

export const Hero: Story = {
  render: () => (
    <div className="flex w-full max-w-[420px] items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
      <div>
        <p className="text-ui font-medium text-fg">Q3 roadmap</p>
        <p className="text-ui-sm text-fg-muted">Edited 2 hours ago</p>
      </div>
      <div className="flex gap-1">
        <Toggle aria-label="Pin to sidebar" defaultPressed>
          <PinIcon />
        </Toggle>
        <Toggle aria-label="Favorite">
          <StarIcon />
        </Toggle>
      </div>
    </div>
  ),
}

export const Playground: Story = {
  render: (args) => (
    <Toggle {...args} aria-label="Bold">
      <BoldIcon />
    </Toggle>
  ),
}

export const States: Story = {
  render: () => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-6">
      <Specimen label="off">
        <Toggle aria-label="Italic">
          <ItalicIcon />
        </Toggle>
      </Specimen>
      <Specimen label="on">
        <Toggle aria-label="Italic" defaultPressed>
          <ItalicIcon />
        </Toggle>
      </Specimen>
      <Specimen label="outline on">
        <Toggle aria-label="Underline" variant="outline" defaultPressed>
          <UnderlineIcon />
        </Toggle>
      </Specimen>
      <Specimen label="disabled">
        <Toggle aria-label="Bold" disabled>
          <BoldIcon />
        </Toggle>
      </Specimen>
      <Specimen label="sm / default / lg">
        <div className="flex items-center gap-1">
          <Toggle aria-label="Bold small" size="sm" defaultPressed>
            <BoldIcon />
          </Toggle>
          <Toggle aria-label="Bold" defaultPressed>
            <BoldIcon />
          </Toggle>
          <Toggle aria-label="Bold large" size="lg" defaultPressed>
            <BoldIcon />
          </Toggle>
        </div>
      </Specimen>
      <Specimen label="with text">
        <Toggle variant="outline">
          <PinIcon />
          Pinned only
        </Toggle>
      </Specimen>
    </div>
  ),
}
