import type { Meta, StoryObj } from '@storybook/react-vite'
import { DEFAULT_FRAME } from '../../docs/create/config'
import { FramePreview } from '../../docs/create/render'

const meta: Meta<typeof FramePreview> = {
  title: 'Blocks/Frame/Search field',
  component: FramePreview,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'fragment' },
    docs: {
      description: {
        component:
          'Help your users find a page with a top-bar search field that suggests matches as they type.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FramePreview>

export const Default: Story = {
  name: 'In the centered-search bar',
  args: { config: { ...DEFAULT_FRAME, topbar: 'search', search: 'field', account: 'menu', upgrade: false } },
}

export const Breadcrumb: Story = {
  name: 'In the breadcrumb bar',
  args: { config: { ...DEFAULT_FRAME, search: 'field' } },
}

export const Tabs: Story = {
  name: 'In the tabs bar',
  args: { config: { ...DEFAULT_FRAME, topbar: 'tabs', search: 'field', account: 'status', upgrade: false } },
}
