import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { SpendOverview } from './spend-overview'

const meta: Meta<typeof SpendOverview> = {
  title: 'Blocks/App/Spend Overview',
  component: SpendOverview,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component:
          'Show where a workspace’s money is going and whether it lasts the month: the spend so far with its change and one plain status, the running total carried to the period’s end against the limit, the latest requests with their failures, the audit trail, and cards for your usage, the top spenders and billing.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof SpendOverview>

/** Thirteen days in, at about $560 a day: the forecast crosses the $12,000 limit on 23 October, and the status says so. */
export const Default: Story = { args: { onOpen: fn() } }

/** Its own page, for an app without the frame: a centered canvas under the title. */
export const Standalone: Story = { args: { embedded: false } }

/** A calmer month: the same total carried to the end stays under the limit, so the status is On track. */
export const OnTrack: Story = {
  name: 'On track',
  args: { daily: [301.4, 288.2, 310.9, 276.5, 295.1, 270.8, 289.6, 301.2, 284.7, 292.3, 280.9, 297.4, 285.0], previous: 3612.4 },
}

/** The limit is already behind it: the status names the day it was passed. */
export const OverLimit: Story = { name: 'Over limit', args: { limit: 5200 } }

/** Skeleton figures, chart and lists, in the same room. */
export const Loading: Story = { args: { loading: true } }

/** A failed load, with a way to try again. */
export const Failed: Story = { args: { error: 'Couldn’t load your spend.', onRetry: fn() } }

/** Nothing logged yet: quiet lists in the same cards. */
export const Empty: Story = { args: { requests: [], audit: [], members: [] } }

/** Other data: euros, German formats and words, a shorter period and your own numbers. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    locale: 'de-DE',
    currency: 'EUR',
    now: '2026-10-13T12:00:00Z',
    start: '2026-10-01',
    periodDays: 31,
    daily: [120, 95, 130, 110, 140, 90, 100, 125, 135, 115, 105, 150, 145],
    limit: 4000,
    previous: 1300,
    copy: {
      title: 'Ausgaben',
      subtitle: 'Workspace · Oktober 2026',
      workspaceSpend: 'Ausgaben im Workspace',
      onTrack: 'Im Plan',
      willExceed: (date: string) => `Überschreitet das Limit bis ${date}`,
      requests: 'Anfragen',
      audit: 'Änderungen',
      personal: 'Ihre Nutzung',
      leaderboard: 'Größte Ausgaben',
      billing: 'Abrechnung',
    },
    members: [{ id: 'lena', name: 'Lena Fischer', spend: 612.4 }],
    averageSpend: 306.2,
    billing: { credit: 820.5, resetsAt: '2026-11-01' },
    onOpen: fn(),
  },
}

/** Hosted in another page: a section named by an h2, with no page around it. */
export const Embedded: Story = { args: { embedded: true } }
