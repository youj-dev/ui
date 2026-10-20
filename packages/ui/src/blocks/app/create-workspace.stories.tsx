import type { Meta, StoryObj } from '@storybook/react-vite'
import { CreateWorkspace } from './create-workspace'

const meta: Meta<typeof CreateWorkspace> = {
  title: 'Blocks/App/Create Workspace',
  component: CreateWorkspace,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component:
          'Walk your users through creating a workspace, choosing its address and inviting their team.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof CreateWorkspace>

export const Default: Story = {}
