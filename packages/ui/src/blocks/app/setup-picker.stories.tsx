import type { Meta, StoryObj } from '@storybook/react-vite'
import { SetupPicker } from './setup-picker'

const meta: Meta<typeof SetupPicker> = {
  title: 'Blocks/App/Setup Picker',
  component: SetupPicker,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card', preset: 'basalt', address: 'console.acme.dev/databases/new' },
    docs: {
      description: {
        component:
          'Help your users choose a deployment setup with cards that show how each option is arranged.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof SetupPicker>

export const Default: Story = {}

/** Opened on the smallest shape, for a staging database. */
export const SingleNode: Story = { name: 'Single node', args: { defaultShape: 'single', copy: { subtitle: 'acme-orders-staging' } } }

/** An office network instead of a database: three options that reuse today's drawings (one node, a cluster, one per site) through each option's `shape`. */
export const ChoosePlanLayout: Story = {
  name: 'Choose a plan layout',
  args: {
    defaultShape: 'mesh',
    copy: {
      title: 'New office network',
      subtitle: 'Harbor Street branch',
      step: 'Step 1 of 4',
      question: 'How should the office connect?',
      lead: 'Pick a layout for now. You can add access points or sites later.',
      options: [
        { id: 'router', shape: 'single', title: 'Single router', detail: '1 device · from $249', summary: 'One router covers a small office. Simple to manage, and the one place that can fail.' },
        { id: 'mesh', shape: 'replicated', title: 'Mesh', detail: '3 access points · self-healing', summary: 'Three access points share the load, and traffic reroutes on its own if one drops out.' },
        { id: 'multisite', shape: 'regions', title: 'Multi-site', detail: '3 offices · one VPN', summary: 'Each office gets its own gateway, joined by a private link so staff reach the same files everywhere.' },
      ],
      saving: 'Saving plan',
    },
  },
}
