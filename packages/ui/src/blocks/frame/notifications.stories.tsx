import type { Meta, StoryObj } from '@storybook/react-vite'
import { DEFAULT_FRAME } from '../../docs/create/config'
import { FramePreview } from '../../docs/create/render'

const meta: Meta<typeof FramePreview> = {
  title: 'Blocks/Frame/Notifications',
  component: FramePreview,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'fragment' },
    docs: {
      description: {
        component:
          'Keep updates close with a notification bell and a list you can filter or mark as read.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FramePreview>

export const Default: Story = {
  name: 'Default',
  args: { config: { ...DEFAULT_FRAME, notifications: true } },
}
