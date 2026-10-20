import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { defineTheme } from '@youj/core'
import { UsageOverview } from './usage-overview'

const cumulus = defineTheme({ accent: 'oklch(0.74 0.15 70)' }) // youj-allow: theme accent

const meta: Meta<typeof UsageOverview> = {
  title: 'Blocks/App/Usage Overview',
  component: UsageOverview,
  // The showcase's look: the block itself inherits the app's theme.
  args: { theme: cumulus },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component:
          'Track your cloud spending against a budget with a projected bill, usage breakdown and invoices.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof UsageOverview>

export const Default: Story = { name: 'Cloud bill' }

/** Its own page, for an app without the frame: the brand header over a centered canvas. */
export const Standalone: Story = { args: { embedded: false } }

/** A GPU render farm's bill in euros: your resources, meters, invoices and words, with saving and downloads handled by your app. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Lumen Render' },
    locale: 'de-DE',
    currency: 'EUR',
    resources: [
      { key: 'storage', label: 'Asset storage', color: 'var(--color-chart-5)' },
      { key: 'egress', label: 'Egress', color: 'var(--color-chart-2)' },
      { key: 'gpu', label: 'GPU', color: 'var(--color-chart-1)' },
    ],
    daily: Array.from({ length: 31 }, (_, i) => ({
      day: `${i + 1}. Okt`,
      costs: { gpu: 140 + ((i * 37) % 90), egress: 18 + ((i * 11) % 14), storage: 9 + i * 0.1 },
    })),
    meters: [
      { id: 'gpu', label: 'GPU hours', used: 410, included: 480, unit: 'h', alert: 0.8 },
      { id: 'egress', label: 'Egress', used: 3_100, included: 5_000, unit: 'GB', alert: 0.9 },
      { id: 'frames', label: 'Frames rendered', used: 1_240_000, included: 2_000_000, unit: 'frames', alert: 0.85 },
    ],
    invoices: [
      { id: 'LR-0926', period: 'September 2026', amount: 5_840.5, status: 'due' },
      { id: 'LR-0826', period: 'August 2026', amount: 4_912, status: 'paid' },
    ],
    budget: 6000,
    cycleDays: 31,
    today: 21,
    defaultCap: 7000,
    capRange: { min: 4000, max: 10000, step: 250 },
    copy: {
      subtitle: 'October cycle · Oct 1 – Oct 31, 2026 · updated every 15 min',
      workspace: 'Feature film unit',
      plan: 'Studio plan',
      resets: 'Cycle resets Nov 1',
      invoicesDescription: 'Paid by SEPA direct debit on the 3rd.',
      chartSummary: 'GPU time is most of every day.',
      chartCaption: 'Daily cost by resource, in EUR.',
      capWarning: (day: number) => `At this pace you reach the cap around Oct ${day}.`,
    },
    onRangeChange: fn(),
    onCapChange: fn(),
    onSaveCap: fn(),
    onDownloadInvoice: fn(),
  },
}
