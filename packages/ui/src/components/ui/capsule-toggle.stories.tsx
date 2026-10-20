import type { Meta, StoryObj } from '@storybook/react-vite'
import { LayoutGridIcon, LayoutListIcon, MoonIcon, SunIcon } from '@youj/icons'
import { Specimen } from '../../stories/kit'
import { CapsuleToggle } from './capsule-toggle'

const meta: Meta<typeof CapsuleToggle> = {
  title: 'UI/Capsules/Capsule Toggle',
  component: CapsuleToggle,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Two or three options in a capsule: a SegmentedControl whose track is the capsule itself, so the lit key glides inside the floating pill (motion’s SlidingIndicator on the smooth spring, retargeting mid-glide; it jumps under reduced motion). One tab stop, arrows rove, a choice is always made, and a new choice sounds with sound on. A short `label` can lead it as an eyebrow; `iconOnly` keeps the icons, each named by its label. Past three options, use a SegmentedControl or Tabs.',
      },
    },
  },
  args: {
    label: 'Monitor',
    defaultValue: 'mix',
    options: [
      { value: 'source', label: 'Source' },
      { value: 'mix', label: 'Mix' },
      { value: 'master', label: 'Master' },
    ],
  },
}
export default meta
type Story = StoryObj<typeof CapsuleToggle>

/** Three options behind an eyebrow. Click, or tab in and use the arrows: the key glides. */
export const Hero: Story = {}

export const Variants: Story = {
  render: () => (
    <div className="grid gap-6">
      <Specimen label="two options with icons">
        <CapsuleToggle
          aria-label="Layout"
          defaultValue="grid"
          options={[
            { value: 'grid', label: 'Grid', icon: <LayoutGridIcon size={16} /> },
            { value: 'list', label: 'List', icon: <LayoutListIcon size={16} /> },
          ]}
        />
      </Specimen>
      <Specimen label="iconOnly, size sm">
        <CapsuleToggle
          aria-label="Appearance"
          size="sm"
          iconOnly
          defaultValue="dark"
          options={[
            { value: 'light', label: 'Light', icon: <SunIcon size={14} /> },
            { value: 'dark', label: 'Dark', icon: <MoonIcon size={14} /> },
          ]}
        />
      </Specimen>
    </div>
  ),
}
