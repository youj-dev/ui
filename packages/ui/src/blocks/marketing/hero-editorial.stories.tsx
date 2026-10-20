import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { HeroEditorial } from './hero-editorial'

const meta: Meta<typeof HeroEditorial> = {
  title: 'Blocks/Marketing/Hero editorial',
  component: HeroEditorial,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section', preset: 'brutal' },
    docs: {
      description: {
        component:
          'Give your landing page a journal-style opening with large type, a byline and supporting figures.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof HeroEditorial>

export const Default: Story = {}

/** Inside another page: a section named by an h2, laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="sr-only">Northwind Journal</h1>
      <HeroEditorial {...args} />
    </main>
  ),
}

/** A finance product's masthead, byline, words, figures and calls to action in place of the demo's. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: {
      issue: 'No. 12',
      season: 'Winter 2026',
      section: 'The close report',
      publication: 'Ledgerly Review',
      headlineLead: 'Close the books on',
      headlineTail: 'Go home early.',
      author: 'Maya Ortiz',
      authorRole: 'Head of finance, Ledgerly',
      authorInitials: 'MO',
      dateline: 'December 2, 2026 · 5 min read',
      inThisIssue: 'Also this month',
      lede: [
        'Month end used to be a week of spreadsheets and missing receipts. With every payment matched as it lands, there is nothing left to chase on the last day.',
        'We followed 400 small businesses through a year of closes. The median one now takes a little over a day, and most of that is waiting for the bank.',
      ],
    },
    words: ['Tuesday.', 'payday.', 'the 31st.'],
    stories: [
      { kicker: 'Close', title: 'The one-day close: a checklist', href: '/report/one-day-close', minutes: 5, onClick: fn() },
      { kicker: 'Data', title: 'What 400 teams do on the 31st', href: '/report/the-31st', minutes: 7 },
      { kicker: 'Tooling', title: 'Why we stopped exporting CSVs', href: '/report/csv', minutes: 3 },
    ],
    figures: [
      { value: 1.2, format: { minimumFractionDigits: 1 }, unit: 'days', label: 'median close' },
      { value: 98, unit: '%', label: 'matched automatically' },
      { value: 400, unit: 'teams', label: 'in the study' },
    ],
    primaryCta: { label: 'Open an account', href: '/signup', onClick: fn() },
    secondaryCta: { label: 'Read the close report', href: '/report', onClick: fn() },
  },
}
