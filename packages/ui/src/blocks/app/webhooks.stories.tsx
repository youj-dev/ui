import type { Meta, StoryObj } from '@storybook/react-vite'
import { Webhooks } from './webhooks'

const meta: Meta<typeof Webhooks> = {
  title: 'Blocks/App/Webhooks',
  component: Webhooks,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component:
          'Manage webhook endpoints with delivery status and subscribed events visible in one table.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Webhooks>

export const Default: Story = {}

/** Its own page, for an app without the frame: the title and endpoints on a centered canvas. */
export const Standalone: Story = { args: { embedded: false } }

export const Empty: Story = { args: { endpoints: [], deliveries: [] } }
