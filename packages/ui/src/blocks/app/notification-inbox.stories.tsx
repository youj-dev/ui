import type { Meta, StoryObj } from '@storybook/react-vite'
import { NotificationInbox } from './notification-inbox'

const meta: Meta<typeof NotificationInbox> = {
  title: 'Blocks/App/Notification inbox',
  component: NotificationInbox,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component: 'An inbox for mentions, replies and alerts, with filters, read states and the channels each kind reaches you on.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof NotificationInbox>

export const Default: Story = {}

/** Its own page, for an app without the frame: a top bar with the notification bell over the inbox and its channel switches. */
export const Standalone: Story = { args: { embedded: false } }

/** Nothing left: the inbox's illustration and a quiet line. */
export const Empty: Story = {
  name: 'Empty inbox',
  args: { notifications: [], incoming: [] },
}
