import type { Meta, StoryObj } from '@storybook/react-vite'
import { PairedBars } from './paired-bars'

const meta: Meta<typeof PairedBars> = {
  title: 'Blocks/App/Paired Bars',
  component: PairedBars,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Two things side by side: per row, two bars on one shared axis, the numbers behind them and optionally a second figure for each, with an old one struck through. Search narrows the rows; View all shows every row in the same room. Plans, schools and phones read the same way.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof PairedBars>

export const Default: Story = { name: 'Pricing plans' }

/** The same rows on a linear axis from zero. */
export const Linear: Story = { args: { scale: 'linear' } }

/** Every row, scrolling inside the same room. */
export const Expanded: Story = { args: { defaultExpanded: true } }

export const Standalone: Story = { args: { embedded: false } }

/** Fed other sides, rows and a currency. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    locale: 'de-DE',
    visible: 3,
    copy: { title: 'Tarifvergleich', currency: 'EUR', nameHeader: 'Dienst' },
    sides: [
      { id: 'free', label: 'Free' },
      { id: 'pro', label: 'Pro' },
    ],
    rows: [
      { id: 'a', name: 'Mailer', values: [500, 50_000], figures: [{ amount: 0 }, { amount: 19, was: 25 }] },
      {
        id: 'b',
        name: 'Scheduler',
        detail: 'Runs every minute',
        badges: [{ label: 'New' }],
        values: [50, 2_000],
        figures: [undefined, { amount: 9 }],
      },
      { id: 'c', name: 'Vault', values: [10, 400], figures: [{ amount: 0 }, { amount: 5 }] },
    ],
  },
}

/** Education: two schools, four measures with their own units. Each row writes its own numbers, and there is no price column. */
export const TwoSchools: Story = {
  name: 'Two schools',
  args: {
    sides: [
      { id: 'north', label: 'North High' },
      { id: 'lakeview', label: 'Lakeview Prep' },
    ],
    rows: [
      {
        id: 'class',
        name: 'Class size',
        detail: 'Students per class',
        values: [28, 19],
        format: { maximumFractionDigits: 0 },
      },
      {
        id: 'scores',
        name: 'Test scores',
        detail: 'Met state standards',
        values: [78, 91],
        format: { style: 'unit', unit: 'percent', maximumFractionDigits: 0 },
      },
      {
        id: 'tuition',
        name: 'Tuition',
        detail: 'A year',
        values: [14_500, 28_900],
        format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
      },
      {
        id: 'distance',
        name: 'Distance',
        detail: 'From home',
        values: [2.4, 6.1],
        format: { style: 'unit', unit: 'mile', maximumFractionDigits: 1 },
      },
    ],
    copy: {
      title: 'Two schools',
      description: 'Class size, test scores, tuition and distance from home.',
      tableLabel: 'Schools compared',
      nameHeader: 'Measure',
      valuesHeader: 'Figures',
      chartHeader: (scale: 'linear' | 'log') => (scale === 'log' ? 'Figures, log scale' : 'Figures'),
      search: 'Search measures',
      count: (shown: number, total: number) => (shown === total ? `${total} measures` : `${shown} of ${total} measures`),
      region: 'All measures',
      empty: 'No measures match',
    },
  },
}

/** Consumer: two phones. A new badge, units in the row (hours, grams, gigabytes) and the price as a row of its own. */
export const TwoPhones: Story = {
  name: 'Two phones',
  args: {
    sides: [
      { id: 'halo', label: 'Halo 5' },
      { id: 'orbit', label: 'Orbit X' },
    ],
    rows: [
      {
        id: 'battery',
        name: 'Battery life',
        detail: 'Video playback',
        values: [28, 22],
        format: { style: 'unit', unit: 'hour', unitDisplay: 'long', maximumFractionDigits: 0 },
      },
      { id: 'weight', name: 'Weight', values: [174, 201], format: { style: 'unit', unit: 'gram', maximumFractionDigits: 0 } },
      {
        id: 'storage',
        name: 'Storage',
        detail: 'Base model',
        badges: [{ label: 'New' }],
        values: [128, 256],
        format: { style: 'unit', unit: 'gigabyte', maximumFractionDigits: 0 },
      },
      {
        id: 'price',
        name: 'Price',
        detail: 'Unlocked',
        values: [799, 949],
        format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
      },
    ],
    copy: {
      title: 'Two phones',
      description: 'Battery, weight, storage and price, side by side.',
      tableLabel: 'Phones compared',
      nameHeader: 'Spec',
      valuesHeader: 'Figures',
      chartHeader: (scale: 'linear' | 'log') => (scale === 'log' ? 'Figures, log scale' : 'Figures'),
      search: 'Search specs',
      count: (shown: number, total: number) => (shown === total ? `${total} specs` : `${shown} of ${total} specs`),
      region: 'All specs',
      empty: 'No specs match',
    },
  },
}

export const Loading: Story = { args: { loading: true } }

export const Failed: Story = { args: { error: 'The plans could not be loaded.', onRetry: () => undefined } }

export const Empty: Story = { args: { rows: [] } }
