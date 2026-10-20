import type { Meta, StoryObj } from '@storybook/react-vite'
import { DEFAULT_FRAME } from '../../docs/create/config'
import { FramePreview } from '../../docs/create/render'

const meta: Meta<typeof FramePreview> = {
  title: 'Blocks/Frame/Account card',
  component: FramePreview,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'fragment' },
    docs: {
      description: {
        component:
          'Put account details within reach with a sidebar card that opens your account menu.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FramePreview>

export const Default: Story = {
  name: 'Default',
  args: { config: { ...DEFAULT_FRAME, account: 'card', upgrade: false } },
}

export const Collapsed: Story = {
  name: 'Collapsed',
  args: { config: { ...DEFAULT_FRAME, account: 'card', upgrade: false }, frame: { defaultCollapsed: true } },
}
