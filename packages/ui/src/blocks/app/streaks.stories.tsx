import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { BookOpenIcon, CalculatorIcon, CreditCardIcon, HeadphonesIcon, PencilIcon, RocketIcon, WrenchIcon } from '@youj/icons'
import { Streaks } from './streaks'
import { ITEMS, history } from './streaks/data'

const meta: Meta<typeof Streaks> = {
  title: 'Blocks/App/Streaks',
  component: Streaks,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Keep a run of days on anything: the picked item’s streak with its milestones, its last 26 weeks as dots where today’s dot is the toggle, and today’s list. When yesterday broke a run, a freeze can save it. Each item brings its own icon and scale. The demo is four daily habits; stories show a support team’s response target and a student’s study days.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof Streaks>

/** Four daily habits, each counting something: kilometres, pages, glasses, minutes. */
export const Default: Story = { name: 'Daily habits' }

/** Yesterday broke an 18-day run: the flame is out, and a freeze can bring it back. */
export const AtRisk: Story = { name: 'At risk', args: { items: [ITEMS[1]!, ...ITEMS.filter((h) => h.id !== 'read')] } }

/** Every freeze spent this month: the rescue says so instead of offering one. */
export const NoFreezes: Story = { name: 'No freezes', args: { items: [ITEMS[1]!, ...ITEMS.filter((h) => h.id !== 'read')], freezes: { left: 0, total: 3 } } }

/** Ops: the days each support team replied to every first message inside 15 minutes. Done or not, so each day is one dot; an excused day takes the place of a freeze. */
export const SupportSla: Story = {
  name: 'Support SLA',
  args: {
    items: [
      { id: 'billing', name: 'Billing', detail: 'First reply within 15 minutes', icon: <CreditCardIcon />, tone: 'chart-5', max: 1, days: history({ rate: 0.8, run: 31, gap: 1, older: 9, frozen: [40], today: true, seed: 21 }) },
      { id: 'onboarding', name: 'Onboarding', detail: 'First reply within 15 minutes', icon: <RocketIcon />, tone: 'chart-1', max: 1, days: history({ rate: 0.7, run: 6, gap: 2, older: 14, seed: 22 }) },
      { id: 'technical', name: 'Technical', detail: 'First reply within 30 minutes', icon: <WrenchIcon />, tone: 'chart-4', max: 1, days: history({ rate: 0.55, run: 18, gap: 1, older: 5, seed: 23 }) },
      { id: 'enterprise', name: 'Enterprise', detail: 'First reply within 5 minutes', icon: <HeadphonesIcon />, tone: 'chart-3', max: 1, days: history({ rate: 0.9, run: 54, gap: 1, older: 20, frozen: [12], today: true, seed: 24 }) },
    ],
    freezes: { left: 1, total: 2 },
    copy: {
      title: 'Support SLA',
      subtitle: (done, total) => `${done} of ${total} teams on target today`,
      more: 'Team options',
      list: 'Support teams',
      doneToday: 'On target',
      markDone: (name) => `Mark ${name} on target`,
      show: (name) => `Show ${name}`,
      rescue: (days) => `Yesterday missed the target. Excuse it to keep the ${days}-day run going.`,
      useFreeze: 'Excuse yesterday',
      freezing: 'Excusing…',
      frozen: (name) => `Yesterday is excused. ${name} is back on track.`,
      noFreezes: 'No excused days left this quarter',
      held: (days) => `Missed yesterday · ${days}-day run on hold`,
      resets: 'Resets at midnight UTC',
      newItem: 'Add team',
    },
  },
}

/** Education: a student’s days of study, counted by subjects (up to four a day), one student per item. */
export const StudyDays: Story = {
  name: 'Study days',
  args: {
    items: [
      { id: 'maya', name: 'Maya', detail: 'Up to 4 subjects a day', icon: <BookOpenIcon />, tone: 'chart-3', max: 4, days: history({ rate: 0.7, run: 11, gap: 1, older: 20, max: 4, today: true, seed: 31 }) },
      { id: 'leo', name: 'Leo', detail: 'Up to 4 subjects a day', icon: <CalculatorIcon />, tone: 'chart-1', max: 4, days: history({ rate: 0.5, run: 4, gap: 2, older: 8, max: 4, seed: 32 }) },
      { id: 'ana', name: 'Ana', detail: 'Up to 4 subjects a day', icon: <PencilIcon />, tone: 'chart-5', max: 4, days: history({ rate: 0.6, run: 0, gap: 1, older: 15, max: 4, seed: 33 }) },
    ],
    freezes: { left: 3, total: 3 },
    copy: {
      title: 'Study days',
      subtitle: (done, total) => `${done} of ${total} studied today`,
      more: 'Class options',
      list: 'Students',
      doneToday: 'Studied',
      markDone: (name) => `Mark ${name} as studied today`,
      rescue: (days) => `Yesterday was missed. Use a rest day to keep the ${days}-day run going.`,
      useFreeze: 'Use a rest day',
      freezing: 'Saving…',
      frozen: (name) => `Yesterday counts as a rest day. ${name} is back on track.`,
      noFreezes: 'No rest days left this term',
      resets: 'Resets at midnight',
      newItem: 'Add student',
    },
  },
}

/** Skeletons in the card’s body while your items load. */
export const Loading: Story = { args: { loading: true } }

/** No items yet: the message takes the body’s room. */
export const Empty: Story = { args: { items: [] } }

/** The items failed to load: the message and Retry take the body’s room. */
export const Error: Story = { args: { error: 'Couldn’t load your habits.', onRetry: fn() } }
