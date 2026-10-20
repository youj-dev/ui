import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { UsageCharges } from './usage-charges'

const meta: Meta<typeof UsageCharges> = {
  title: 'Blocks/App/Usage Charges',
  component: UsageCharges,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component:
          'Show what a workspace used and what it was charged: a date range, a project filter and Export CSV over the total, the days as stacked bars by SKU with a tooltip, and a table of SKUs with usage against the allowance, the part past it, the charge and a total row.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof UsageCharges>

/** Thirty days of five SKUs over three projects. Hover a bar, or focus the chart and use the arrow keys, for that day's charges. */
export const Default: Story = {}

/** Its own page, for an app without the frame: the title and controls over a centered canvas. */
export const Standalone: Story = { args: { embedded: false } }

/** Narrowed to one project: the figures, bars and table follow. */
export const OneProject: Story = { name: 'One project', args: { project: 'api' } }

/** Skeleton figures, chart and rows, in the same room. */
export const Loading: Story = { args: { loading: true } }

/** A failed load, with a way to try again. */
export const Failed: Story = { args: { error: 'Couldn’t load your usage.', onRetry: fn() } }

/** Nothing metered: the chart says so in its own room and the table keeps its rows. */
export const Empty: Story = { args: { records: [] } }

/** Other data: euros, German formats and words, two SKUs and your own export. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    locale: 'de-DE',
    currency: 'EUR',
    copy: { title: 'Nutzung', subtitle: 'Was Ihr Workspace verbraucht hat und was es kostete.', totalCharges: 'Gesamtkosten', export: 'CSV exportieren', allProjects: 'Alle Projekte' },
    skus: [
      { id: 'api', name: 'API-Aufrufe', tone: 'chart-1', unit: '', included: 100_000, rate: 0.0004 },
      { id: 'storage', name: 'Speicher', tone: 'chart-3', unit: 'GB', included: 20, rate: 0.5 },
    ],
    projects: [{ id: 'shop', name: 'Linden Shop' }],
    records: [
      { date: '2026-10-11', project: 'shop', sku: 'api', quantity: 70_000, overage: 0 },
      { date: '2026-10-12', project: 'shop', sku: 'api', quantity: 90_000, overage: 20_000 },
      { date: '2026-10-13', project: 'shop', sku: 'api', quantity: 110_000, overage: 40_000 },
      { date: '2026-10-12', project: 'shop', sku: 'storage', quantity: 14, overage: 0 },
      { date: '2026-10-13', project: 'shop', sku: 'storage', quantity: 24, overage: 4 },
    ],
    onExport: fn(),
    onRangeChange: fn(),
    onProjectChange: fn(),
  },
}

/** Hosted in a settings page: a section named by an h2, with no page around it. */
export const Embedded: Story = { args: { embedded: true } }
