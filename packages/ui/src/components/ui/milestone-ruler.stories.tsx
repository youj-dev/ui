import type { Meta, StoryObj } from '@storybook/react-vite'
import { MilestoneRuler, type Milestone } from './milestone-ruler'

/** A made-up app's year: two releases, a few features, one at risk and two a day apart. */
const MILESTONES: Milestone[] = [
  { id: 'offline', date: '2026-02-09', title: 'Offline mode', description: 'Edits sync when you reconnect' },
  { id: 'folders', date: '2026-04-01', title: 'Shared folders', description: 'Invite a team to a folder' },
  { id: 'v1-5', date: '2026-06-04', title: 'Version 1.5', description: 'New editor, faster search', major: true },
  { id: 'mobile', date: '2026-08-31', title: 'Mobile beta' },
  { id: 'api', date: '2026-09-02', title: 'Public API' },
  { id: 'sso', date: '2026-10-28', title: 'SSO and audit log', description: 'Waiting on the security review', status: 'at-risk' },
  { id: 'v2', date: '2026-11-26', title: 'Version 2', description: 'Rebuilt sync engine', major: true },
]

const meta: Meta<typeof MilestoneRuler> = {
  title: 'UI/Data/Milestone Ruler',
  component: MilestoneRuler,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A year (or any span of days) as a ruler of fine ticks, each milestone a pin standing on it: taller when major, solid when done, hollow when upcoming, in the warning tone when at risk. Today is a bright tick; milestones too close to tell apart share a pin with their count. Hovering anywhere snaps to the nearest pin and shows its callout (date, status, title, description) while the ticks near the pointer stretch. One tab stop, a horizontal listbox: arrows walk the pins and selection follows focus. Reduced motion: drawn in place.',
      },
    },
  },
  args: { milestones: MILESTONES, today: '2026-10-13', label: 'Milestones in 2026' },
  argTypes: { milestones: { control: false } },
  decorators: [
    (Story) => (
      <div className="w-112 max-w-full">
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof MilestoneRuler>

export const Default: Story = {}

/** One picked: its callout stays when the pointer leaves. */
export const Picked: Story = { args: { defaultValue: 'v2' } }

/** A quarter instead of a year, on the success tone. */
export const Quarter: Story = {
  args: {
    start: '2026-10-01',
    end: '2026-12-31',
    tone: 'success',
    milestones: [
      { id: 'design', date: '2026-10-09', title: 'Design review' },
      { id: 'build', date: '2026-11-02', title: 'Feature complete', major: true },
      { id: 'qa', date: '2026-11-20', title: 'QA sign-off' },
      { id: 'ship', date: '2026-12-08', title: 'Ship', major: true },
    ],
  },
}

/** Nothing planned yet: the ruler is still drawn. */
export const Empty: Story = { args: { milestones: [] } }
