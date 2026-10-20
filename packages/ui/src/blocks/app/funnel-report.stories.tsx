import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { FunnelReport, type FunnelReportData } from './funnel-report'

const meta: Meta<typeof FunnelReport> = {
  title: 'Blocks/App/Funnel Report',
  component: FunnelReport,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component: 'Follow trial teams to paid: a conversion funnel, step changes against the previous period, cohort retention, time to paid and daily upgrades.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FunnelReport>

export const Default: Story = {}

/** Its own page, for an app without the frame: the product header over a centered canvas. */
export const Standalone: Story = { args: { embedded: false } }

/* A language-learning app's checkout funnel, as an analytics API would return it. */
const steps = [
  { id: 'lesson', short: 'Lesson', name: 'Finished a first lesson', count: 18_400, previous: 17_100 },
  { id: 'trial', short: 'Trial', name: 'Started Plus trial', count: 4_120, previous: 3_610 },
  { id: 'streak', short: 'Streak', name: 'Kept a 3-day streak', count: 2_390, previous: 2_020 },
  { id: 'plus', short: 'Plus', name: 'Subscribed to Plus', count: 1_150, previous: 910 },
].map((s, i, all) => ({ ...s, rate: i ? s.count / all[i - 1]!.count : 1, previousRate: i ? s.previous / all[i - 1]!.previous : 1 }))

const report: FunnelReportData = {
  steps,
  conversion: 1_150 / 18_400,
  previousConversion: 910 / 17_100,
  cohorts: ['Sep 7', 'Sep 14', 'Sep 21', 'Sep 28'].map((label, c) => ({
    label,
    size: 980 + c * 40,
    retention: [1, 0.71, 0.6, 0.55].slice(0, 4 - c),
  })),
  daysToPaid: Array.from({ length: 300 }, (_, i) => 0.5 + ((i * 37) % 140) / 10),
  upgrades: Array.from({ length: 126 }, (_, i) => {
    const d = new Date(Date.UTC(2026, 8, 30 - (125 - i)))
    return { date: d.toISOString().slice(0, 10), value: (i * 7) % 11 }
  }),
}

/** A language-learning app's own funnel, segments and German strings. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    report,
    segments: [
      { value: 'all', label: 'Alle' },
      { value: 'app', label: 'App' },
      { value: 'web', label: 'Web' },
    ],
    today: new Date(2026, 8, 30),
    locale: 'de-DE',
    brand: { name: 'Lingoleaf' },
    copy: {
      title: 'Plus-Funnel',
      description: 'Lernende, letzte 4 Wochen, verglichen mit den 4 davor',
      section: 'Produktanalyse',
      badge: 'Wachstum',
      platform: 'Plattform',
      visitorToPaid: 'Lektion zu Plus',
      trialsStarted: 'Testphasen',
      newPaying: 'Neue Abos',
      trialToPaid: 'Test zu Abo',
      funnelTitle: 'Lektion zu Plus',
      stepsTitle: 'Schritt-Konversion',
      cohortsTitle: 'Bindung nach Kohorte',
      timeTitle: 'Zeit bis zum Abo',
      upgradesTitle: 'Abos pro Tag',
    },
    onSegmentChange: fn(),
  },
}
