import type { Meta, StoryObj } from '@storybook/react-vite'
import { DEFAULT_FRAME } from '../../docs/create/config'
import { FramePreview } from '../../docs/create/render'

const meta: Meta<typeof FramePreview> = {
  title: 'Blocks/Frame/Account status',
  component: FramePreview,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'fragment' },
    docs: {
      description: {
        component:
          'Let your users set their availability from an account menu in the top bar.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FramePreview>

export const Default: Story = {
  name: 'In the breadcrumb bar',
  args: { config: { ...DEFAULT_FRAME, account: 'status', upgrade: false } },
}

export const Minimal: Story = {
  name: 'In the minimal bar',
  args: { config: { ...DEFAULT_FRAME, topbar: 'minimal', search: 'none', account: 'status', upgrade: false } },
}
