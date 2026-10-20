import type { Meta, StoryObj } from '@storybook/react-vite'
import { DEFAULT_FRAME } from '../../docs/create/config'
import { FramePreview } from '../../docs/create/render'

const meta: Meta<typeof FramePreview> = {
  title: 'Blocks/Frame/Topbar search',
  component: FramePreview,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'fragment' },
    docs: {
      description: {
        component:
          'Put search at the center of your app with a top bar that gives it room.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FramePreview>

export const Default: Story = {
  name: 'With the ⌘K palette',
  args: { config: { ...DEFAULT_FRAME, topbar: 'search', account: 'menu' } },
}

export const Field: Story = {
  name: 'With the inline field',
  args: { config: { ...DEFAULT_FRAME, topbar: 'search', search: 'field', account: 'status', upgrade: false } },
}

export const NoSearch: Story = {
  name: 'Without search',
  args: { config: { ...DEFAULT_FRAME, topbar: 'search', search: 'none', account: 'menu' } },
}
