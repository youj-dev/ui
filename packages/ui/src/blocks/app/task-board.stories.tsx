import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { fn } from 'storybook/test'
import { TaskBoard } from './task-board'

const meta: Meta<typeof TaskBoard> = {
  title: 'Blocks/App/Task board',
  component: TaskBoard,
  // Default renders on the canvas too.
  render: (args) => (
    <Screen>
      <TaskBoard {...args} />
    </Screen>
  ),
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component: 'Help your team track tasks through their stages with a Kanban board, a sprint summary above it and a card for every task.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof TaskBoard>

/** The page on its own canvas: the screen carries no frame, only its content. */
const Screen = ({ children }: { children: ReactNode }) => <div className="min-h-dvh bg-canvas text-fg">{children}</div>

export const Default: Story = {
  name: 'Default',
}

/** Its own page, for an app without the frame: the same header and board on a canvas with a `main`. */
export const Standalone: Story = { args: { embedded: false } }

export const WithYourData: Story = {
  name: 'With your data',
  render: () => (
    <Screen>
      <TaskBoard
        title="Editorial"
        columns={[
          { id: 'pitch', title: 'Pitched', tone: 'neutral' },
          { id: 'draft', title: 'Drafting', tone: 'warning', limit: 3 },
          { id: 'edit', title: 'Editing', tone: 'accent' },
          { id: 'live', title: 'Published', tone: 'success' },
        ]}
        tasks={[
          {
            id: 'ED-31',
            key: 'ED-31',
            column: 'pitch',
            title: 'The last ferry to Hiddensee',
            project: 'Travel',
            label: 'Feature',
            assignee: 'Maren Holt',
            priority: 'medium',
          },
          {
            id: 'ED-28',
            key: 'ED-28',
            column: 'draft',
            title: 'Interview: the bakery that never closes',
            project: 'Food',
            label: 'Interview',
            labelTone: 'warning',
            assignee: 'Idris Bello',
            priority: 'high',
            due: 'Today',
          },
          {
            id: 'ED-27',
            key: 'ED-27',
            column: 'edit',
            title: 'Night trains, ranked',
            project: 'Travel',
            label: 'Listicle',
            labelTone: 'success',
            assignee: 'Maren Holt',
            priority: 'low',
            due: '3 Oct',
          },
          {
            id: 'ED-22',
            key: 'ED-22',
            column: 'live',
            title: 'A week without a phone',
            project: 'Life',
            label: 'Essay',
            assignee: 'Sofia Reyes',
            priority: 'medium',
          },
        ]}
        copy={{ subtitle: (open) => `${open} stories in progress for the autumn issue.`, newTask: 'New story', doneColumn: 'live' }}
        onMove={fn()}
        onOpen={fn()}
        onCreate={fn()}
      />
    </Screen>
  ),
}
