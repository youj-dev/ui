import type { Meta, StoryObj } from '@storybook/react-vite'
import { ScoreRing, type ScoreGrade } from './score-ring'

/** Letter grades from F to A. */
const GRADES: ScoreGrade[] = [
  { from: 0, label: 'F', tone: 'danger' },
  { from: 40, label: 'D', tone: 'warning' },
  { from: 60, label: 'C', tone: 'warning' },
  { from: 75, label: 'B', tone: 'success' },
  { from: 90, label: 'A', tone: 'success' },
]

const meta: Meta<typeof ScoreRing> = {
  title: 'UI/Data/Score Ring',
  component: ScoreRing,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A score out of a range as a full ring of fine ticks, lit clockwise from the top up to the score, the tick at the score reaching past the rest. Grades split the range into bands: the ring takes the band’s tone and shows its letter in the middle (without grades, the score). `busy` circles a soft sweep inside it while a scan runs. A meter whose value text is the score and its grade. The ticks light in turn as it scrolls into view; reduced motion draws it at its value with no sweep.',
      },
    },
  },
  args: { value: 77, grades: GRADES, label: 'Security score' },
  argTypes: { grades: { control: false } },
}
export default meta
type Story = StoryObj<typeof ScoreRing>

export const Default: Story = {}

/** No grades: the score in the middle, in the accent. */
export const Score: Story = { args: { grades: undefined, value: 64 } }

/** A low score takes its band's tone. */
export const Failing: Story = { args: { value: 31 } }

/** A scan running: the sweep circles inside the ring. */
export const Busy: Story = { args: { busy: true } }

/** The three sizes. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-6">
      <ScoreRing {...args} size="sm" />
      <ScoreRing {...args} />
      <ScoreRing {...args} size="lg" />
    </div>
  ),
}
