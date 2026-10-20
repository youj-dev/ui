import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button } from './button'
import { ProgressPath, type ProgressPathProps, type ProgressPathSection } from './progress-path'

const SECTIONS: ProgressPathSection[] = [
  {
    id: 'basics',
    eyebrow: 'Unit 1',
    title: 'Foundations',
    lessons: [
      { id: 'a', title: 'Warm-up', detail: '5 min', mastery: 4 },
      { id: 'b', title: 'Posture', detail: '7 min', mastery: 3 },
      { id: 'c', title: 'Breathing', detail: '6 min', mastery: 2 },
      { id: 'd', title: 'Unit review', detail: '+50 XP', milestone: true },
    ],
  },
  {
    id: 'flow',
    eyebrow: 'Unit 2',
    title: 'Flow',
    lessons: [
      { id: 'e', title: 'Sun salutation', detail: '12 min' },
      { id: 'f', title: 'Balance', detail: '10 min' },
      { id: 'g', title: 'Unit review', detail: '+50 XP', milestone: true },
    ],
  },
]

const meta: Meta<ProgressPathProps> = {
  title: 'UI/Data/Progress Path',
  component: ProgressPath,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A course as a winding trail of lesson nodes, grouped into sections that each take a chart color and close on a trophy milestone. Every node wears a segmented ring, one segment per level of mastery. Lessons before `current` are done (a tinted disc with a check, a crown at full mastery), the current one is an ink disc that glows in its section’s color under a Start callout, and the rest are locked. The trail is solid where you’ve walked and dotted ahead. The nodes are one tab stop: arrows walk the path (left and right mirrored in RTL), Home and End jump to its ends, Enter opens a lesson through `onSelect`, and a locked one shakes its head. On first view the walked trail draws itself; moving `current` on draws the next segment and glides the callout after it. Reduced motion: drawn in place, no ping.',
      },
    },
  },
  args: { sections: SECTIONS, current: 'c' },
}
export default meta
type Story = StoryObj<ProgressPathProps>

export const Default: Story = {
  name: 'Course',
  render: (args) => (
    <div className="w-[36rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface px-6 py-2">
      <ProgressPath {...args} />
    </div>
  ),
}

/** Step `current` along: the next segment draws and the callout glides after it. */
export const Advancing: Story = {
  render: function Render(args) {
    const ids = args.sections.flatMap((s) => s.lessons.map((l) => l.id))
    const [at, setAt] = useState(2)
    return (
      <div className="flex w-[36rem] max-w-[calc(100vw-2rem)] flex-col gap-4">
        <div className="rounded-2xl border border-line bg-surface px-6 py-2">
          <ProgressPath {...args} current={ids[at] ?? null} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setAt((i) => Math.max(0, i - 1))}>
            Back
          </Button>
          <Button onClick={() => setAt((i) => Math.min(ids.length, i + 1))}>Finish lesson</Button>
        </div>
      </div>
    )
  },
}

/** A narrow column: the titles fold away and the nodes carry the path alone. */
export const Narrow: Story = {
  render: (args) => (
    <div className="w-80 rounded-2xl border border-line bg-surface px-4 py-2">
      <ProgressPath {...args} />
    </div>
  ),
}
