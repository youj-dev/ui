import type { Meta, StoryObj } from '@storybook/react-vite'
import { DEFAULT_FRAME } from '../../docs/create/config'
import { FramePreview } from '../../docs/create/render'

const meta: Meta<typeof FramePreview> = {
  title: 'Blocks/Frame/Account menu',
  component: FramePreview,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'overlay' },
    docs: {
      description: {
        component:
          'Give your top bar an avatar menu for profile settings, help and signing out.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FramePreview>

export const Default: Story = {
  name: 'In the breadcrumb bar',
  args: { config: { ...DEFAULT_FRAME, account: 'menu', upgrade: false } },
}

export const Tabs: Story = {
  name: 'In the tabs bar',
  args: { config: { ...DEFAULT_FRAME, topbar: 'tabs', account: 'menu', upgrade: false } },
}
