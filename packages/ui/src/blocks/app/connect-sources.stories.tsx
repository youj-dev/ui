import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ConnectSources } from './connect-sources'

const meta: Meta<typeof ConnectSources> = {
  title: 'Blocks/App/Connect Sources',
  component: ConnectSources,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Plug your sources in during setup: a power strip shows which are connected, each tile shows a source’s day and what it brings, and a meter sums the coverage before you continue.',
      },
    },
  },
  argTypes: { theme: { control: false }, illustration: { control: false } },
}
export default meta
type Story = StoryObj<typeof ConnectSources>

/** Identity and Devices connected, Cloud backfilling its last 7 days, and three to add. */
export const Default: Story = { name: 'Security data' }

/** Without the drawing: the tiles and the meter alone. */
export const NoIllustration: Story = { name: 'No illustration', args: { illustration: null } }

/** Other data: four sources, German words, and the actions in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    locale: 'de-DE',
    sources: [
      {
        id: 'sso',
        label: 'Anmeldung',
        tone: 'chart-3',
        status: 'connected',
        perDay: 12800,
        coverage: 0.3,
        volume: [2, 1, 1, 1, 2, 4, 8, 12, 14, 13, 12, 11, 12, 13, 12, 10, 8, 6, 5, 4, 3, 3, 2, 2],
      },
      {
        id: 'edr',
        label: 'Geräte',
        tone: 'chart-1',
        status: 'backfilling',
        coverage: 0.2,
        progress: 0.3,
        backfillDays: 3,
        volume: [3, 3, 2, 2, 2, 3, 6, 9, 10, 10, 9, 9, 9, 10, 9, 8, 7, 5, 4, 4, 3, 3, 3, 3],
      },
      {
        id: 'fw',
        label: 'Firewall',
        tone: 'chart-2',
        status: 'available',
        coverage: 0.15,
        volume: [6, 5, 5, 4, 4, 5, 6, 7, 8, 8, 8, 8, 8, 8, 8, 8, 7, 7, 7, 6, 6, 6, 6, 6],
      },
      {
        id: 'mail',
        label: 'E-Mail',
        tone: 'chart-4',
        status: 'available',
        coverage: 0.1,
        volume: [1, 1, 1, 1, 1, 2, 5, 9, 11, 10, 8, 7, 8, 9, 8, 6, 4, 3, 2, 2, 1, 1, 1, 1],
      },
    ],
    copy: {
      title: 'Datenquellen',
      subtitle: 'Verbinden Sie Ihre Systeme',
      connectedCount: (n: number, total: number) => `${n} von ${total} verbunden`,
      perDay: (events: string) => `${events} / Tag`,
      backfilling: (days: number) => `Lädt ${days} Tage nach`,
      adds: (percent: string) => `+${percent} Abdeckung`,
      connect: (source: string) => `${source} verbinden`,
      coverage: 'Abdeckung',
      skip: 'Später',
      continue: 'Weiter',
    },
    onConnect: fn(),
    onSkip: fn(),
    onContinue: fn(),
  },
}

/** A day's shape: quiet at night, a swell around `peak` (0–23). */
const day = (peak: number, height: number, width = 4) =>
  Array.from({ length: 24 }, (_, h) => Math.round((0.06 + height * Math.exp(-((h - peak) ** 2) / (2 * width * width))) * 100) / 100)

/** Marketing: ad networks, the CRM, email and web analytics. Events come in compact, as the default formats them. */
export const MarketingStack: Story = {
  name: 'Marketing stack',
  args: {
    sources: [
      { id: 'ads', label: 'Search ads', tone: 'chart-1', status: 'connected', perDay: 18400, coverage: 0.28, volume: day(11, 1, 5) },
      { id: 'crm', label: 'CRM', tone: 'chart-3', status: 'connected', perDay: 2300, coverage: 0.22, volume: day(10, 0.8, 3) },
      { id: 'email', label: 'Email', tone: 'chart-4', status: 'backfilling', coverage: 0.16, volume: day(9, 0.9, 2.5), progress: 0.4, backfillDays: 30 },
      { id: 'web', label: 'Web analytics', tone: 'chart-2', status: 'available', coverage: 0.2, volume: day(14, 1, 4.5) },
    ],
    copy: {
      title: 'Marketing sources',
      subtitle: 'Bring your campaigns into one report',
      sourcesLabel: 'Marketing sources',
      perDay: (events: string) => `${events} events / day`,
      backfilling: (days: number) => `Importing ${days} days of history`,
      adds: (percent: string) => `+${percent} of your funnel`,
      coverage: 'Funnel covered',
      skip: 'Later',
      continue: 'Build my report',
    },
  },
}

/** Smart home: a thermostat, the meters and the cameras. `format` writes readings in full, grouped by the locale. */
export const SmartHomeHub: Story = {
  name: 'Smart home hub',
  args: {
    illustration: null,
    format: (perDay: number) => new Intl.NumberFormat(undefined).format(perDay),
    sources: [
      { id: 'thermostat', label: 'Climate', tone: 'chart-5', status: 'connected', perDay: 1440, coverage: 0.3, volume: day(7, 0.7, 5) },
      { id: 'meters', label: 'Meters', tone: 'chart-1', status: 'connected', perDay: 86400, coverage: 0.4, volume: day(19, 1, 3.5) },
      { id: 'cameras', label: 'Cameras', tone: 'chart-2', status: 'available', coverage: 0.3, volume: day(22, 0.8, 4) },
    ],
    copy: {
      title: 'Home devices',
      subtitle: 'Add what you want to see in one place',
      sourcesLabel: 'Devices',
      connectedCount: (connected: number, total: number) => `${connected} of ${total} added`,
      perDay: (readings: string) => `${readings} / day`,
      adds: (percent: string) => `+${percent} of your home`,
      connect: (source: string) => `Add ${source}`,
      connecting: (source: string) => `Adding ${source}`,
      announceConnected: (source: string) => `${source} added`,
      coverage: 'Home covered',
      skip: 'Not now',
      continue: 'Open my home',
    },
  },
}

/** Drawn as its own page, with the title as the page's `h1`. */
export const Standalone: Story = { args: { embedded: false } }
