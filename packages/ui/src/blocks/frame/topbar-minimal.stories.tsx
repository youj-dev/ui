import type { Meta, StoryObj } from '@storybook/react-vite'
import { DEFAULT_FRAME } from '../../docs/create/config'
import { FramePreview } from '../../docs/create/render'

const meta: Meta<typeof FramePreview> = {
  title: 'Blocks/Frame/Topbar minimal',
  component: FramePreview,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'fragment' },
    docs: {
      description: {
        component:
          'Keep the focus on your page with a top bar for its title, notifications and main action.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FramePreview>

export const Default: Story = {
  name: 'Default',
  args: { config: { ...DEFAULT_FRAME, topbar: 'minimal', search: 'none' } },
}

export const AvatarMenu: Story = {
  name: 'With the avatar menu',
  args: { config: { ...DEFAULT_FRAME, topbar: 'minimal', search: 'none', account: 'menu', upgrade: false }, frame: { defaultActive: 'inbox' } },
}

export const Search: Story = {
  name: 'With the ⌘K palette and your status',
  args: { config: { ...DEFAULT_FRAME, topbar: 'minimal', account: 'status', upgrade: false } },
}
