import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { CauseRings } from './cause-rings'

const meta: Meta<typeof CauseRings> = {
  title: 'Blocks/App/Cause Rings',
  component: CauseRings,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'See why something was lost: the total and its change, a two-ring donut (the causes inside, where they came from hatched outside), a legend with each figure and one line on how few causes make up most of it.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof CauseRings>

/** 1,236 minutes, down 14%: tooling leads, and three causes make up 77%. */
export const Default: Story = { name: 'Line stops' }

/** A cause picked in the legend: the others recede and its contributors are listed. */
export const Picked: Story = { args: { defaultActive: 'maintenance' } }

/** Other data: another plant's causes with the total up, German words and numbers, and the picks in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    locale: 'de-DE',
    change: 0.06,
    copy: { title: 'Warum Linien stehen', subtitle: 'Minuten · letzte 28 Tage', versus: 'Sept.', insight: (n: number, p: string) => `${n} Ursachen machen ${p} der Ausfallminuten aus` },
    causes: [
      { id: 'a', label: 'Rüsten', value: 640, tone: 'chart-2', contributors: [{ label: 'Linie 1', value: 400 }, { label: 'Linie 2', value: 240 }] },
      { id: 'b', label: 'Störung', value: 410, tone: 'chart-1', contributors: [{ label: 'Linie 2', value: 300 }, { label: 'Linie 1', value: 110 }] },
      { id: 'c', label: 'Material', value: 150, tone: 'chart-5' },
    ],
    onActiveChange: fn(),
  },
}

/** Marketing: why customers cancelled, by plan. The unit is customers, so figures are plain counts. */
export const ChurnReasons: Story = {
  name: 'Churn reasons',
  args: {
    format: (n: number) => String(n),
    change: 0.04,
    copy: {
      title: 'Why customers leave',
      subtitle: 'customers · last quarter',
      total: (v: string) => `${v} customers`,
      versus: 'Q2',
      chartLabel: (total: string, parts: string) => `Cancellations by reason, ${total} in all: ${parts}`,
      share: (label: string, v: string, p: string) => `${label} ${v} customers, ${p}`,
      legendLabel: 'Reasons',
      legendHint: 'Select a reason to see which plans it came from.',
      contributors: (list: string) => `Most from ${list}`,
      patternTop: 'Biggest plan',
      insight: (n: number, p: string) => `${n} reasons account for ${p} of cancellations`,
    },
    causes: [
      { id: 'price', label: 'Price', value: 148, tone: 'chart-4', contributors: [{ label: 'Starter', value: 82 }, { label: 'Pro', value: 51 }, { label: 'Team', value: 15 }] },
      { id: 'feature', label: 'Missing feature', value: 96, tone: 'chart-2', contributors: [{ label: 'Pro', value: 44 }, { label: 'Team', value: 33 }, { label: 'Starter', value: 19 }] },
      { id: 'switched', label: 'Switched', value: 71, tone: 'chart-5', contributors: [{ label: 'Starter', value: 40 }, { label: 'Pro', value: 31 }] },
      { id: 'support', label: 'Support', value: 38, tone: 'chart-1', contributors: [{ label: 'Team', value: 22 }, { label: 'Pro', value: 16 }] },
    ],
  },
}

/** Support: tickets by product area, split by the channel they came in on. The insight sums the top two. */
export const TicketReasons: Story = {
  name: 'Ticket reasons',
  args: {
    change: -0.08,
    insightCount: 2,
    copy: {
      title: 'Where tickets come from',
      subtitle: 'tickets · last 30 days',
      total: (v: string) => `${v} tickets`,
      versus: 'last month',
      chartLabel: (total: string, parts: string) => `Tickets by product area, ${total} in all: ${parts}`,
      share: (label: string, v: string, p: string) => `${label} ${v} tickets, ${p}`,
      legendLabel: 'Product areas',
      legendHint: 'Select an area to see which channels it came through.',
      contributors: (list: string) => `Most through ${list}`,
      patternTop: 'Top channel',
      insight: (n: number, p: string) => `${n} areas account for ${p} of tickets`,
    },
    causes: [
      { id: 'billing', label: 'Billing', value: 310, tone: 'chart-3', contributors: [{ label: 'Email', value: 168 }, { label: 'Chat', value: 97 }, { label: 'Phone', value: 45 }] },
      { id: 'mobile', label: 'Mobile app', value: 244, tone: 'chart-2', contributors: [{ label: 'Chat', value: 131 }, { label: 'Email', value: 83 }, { label: 'Phone', value: 30 }] },
      { id: 'integrations', label: 'Integrations', value: 188, tone: 'chart-5', contributors: [{ label: 'Email', value: 120 }, { label: 'Chat', value: 68 }] },
      { id: 'reports', label: 'Reports', value: 96, tone: 'chart-4', contributors: [{ label: 'Email', value: 61 }, { label: 'Chat', value: 35 }] },
      { id: 'other', label: 'Other', value: 52, tone: 'neutral' },
    ],
  },
}

/** Ring guides, figures and the insight held as skeletons while the data loads. */
export const Loading: Story = { args: { loading: true } }

/** No causes in the period: a message in the chart's room. */
export const Empty: Story = { args: { causes: [] } }

/** The load failed: the message and Retry take the chart's room, and the figures show a dash. */
export const Error: Story = { args: { error: 'Couldn’t load the causes.', onRetry: fn() } }

/** Drawn as its own page, with the card's title as the page's `h1`. */
export const Standalone: Story = { args: { embedded: false } }
