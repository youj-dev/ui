import type { Meta, StoryObj } from '@storybook/react-vite'
import { DEFAULT_FRAME } from '../../docs/create/config'
import { FramePreview } from '../../docs/create/render'

const meta: Meta<typeof FramePreview> = {
  title: 'Blocks/Frame/Topbar tabs',
  component: FramePreview,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'fragment' },
    docs: {
      description: {
        component:
          'Help your users switch between page views with tabs beneath the page title and actions.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FramePreview>

export const Default: Story = {
  name: 'Default',
  args: { config: { ...DEFAULT_FRAME, topbar: 'tabs' } },
}

export const AvatarMenu: Story = {
  name: 'With the avatar menu',
  args: { config: { ...DEFAULT_FRAME, topbar: 'tabs', account: 'menu' }, frame: { defaultActive: 'atlas' } },
}

export const Status: Story = {
  name: 'With the inline field and your status',
  args: { config: { ...DEFAULT_FRAME, topbar: 'tabs', search: 'field', account: 'status', upgrade: false } },
}

export const TabBar: Story = {
  name: 'With the phone tab bar',
  args: { config: { ...DEFAULT_FRAME, topbar: 'tabs', mobile: 'tabs' } },
}
