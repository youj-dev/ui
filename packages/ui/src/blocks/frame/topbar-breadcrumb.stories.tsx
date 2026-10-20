import type { Meta, StoryObj } from '@storybook/react-vite'
import { DEFAULT_FRAME } from '../../docs/create/config'
import { FramePreview } from '../../docs/create/render'

const meta: Meta<typeof FramePreview> = {
  title: 'Blocks/Frame/Topbar breadcrumb',
  component: FramePreview,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'fragment' },
    docs: {
      description: {
        component:
          'Show your users where they are with a breadcrumb top bar that keeps search and account controls close.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FramePreview>

export const Default: Story = {
  name: 'Default',
  args: { config: { ...DEFAULT_FRAME, topbar: 'breadcrumb' }, frame: { defaultActive: 'atlas' } },
}

export const AvatarMenu: Story = {
  name: 'With the avatar menu',
  args: { config: { ...DEFAULT_FRAME, topbar: 'breadcrumb', account: 'menu' } },
}
