import type { Meta, StoryObj } from '@storybook/react-vite'
import { AiWorkspace } from './ai-workspace'

const meta: Meta<typeof AiWorkspace> = {
  title: 'Blocks/App/AI Workspace',
  component: AiWorkspace,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', preset: 'basalt', address: 'app.orbit.dev/atlas' },
    docs: {
      description: {
        component: 'Ask an AI analyst about your team’s data, with streamed answers that show their reasoning, tool calls and sources. Demo content — edit after adding.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof AiWorkspace>

export const Default: Story = {}

/** Its own page, for an app without the frame: the chat list beside a conversation with its own title bar, filling the viewport. */
export const Standalone: Story = { args: { embedded: false } }

/** Opened with the answer already there: nothing plays until you ask. */
export const Answered: Story = { args: { autoplay: false } }

/** Atlas Fast skips the thinking and goes straight to its tools. */
export const Fast: Story = { args: { defaultModel: 'fast' } }
