import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { brutal } from '@youj/core'
import { Changelog } from './changelog'

const meta: Meta<typeof Changelog> = {
  title: 'Blocks/Content/Changelog',
  component: Changelog,
  // The showcase's look: the block itself inherits the app's theme.
  args: { theme: brutal },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component:
          'Keep your users up to date with release notes organized by version and date.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Changelog>

export const Default: Story = {}

/** Its own page, for an app without the frame: a sticky masthead with a reading bar, over the headline. */
export const Standalone: Story = { args: { embedded: false } }

/** With your data: a payroll product's releases, brand and words, no archive, and subscriptions in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Ledgerline' },
    archiveHref: null,
    copy: { title: 'What’s new in Ledgerline', description: 'Payroll, tax filings and payouts, improved every two weeks.', filters: { all: 'Everything', new: 'New', improved: 'Better', fixed: 'Fixed' } },
    releases: [
      { version: '12.0', date: 'Sep 29, 2026', title: 'Same-day payouts in the EU', kinds: ['new'], body: ['Run payroll before 11:00 CET and employees are paid the same afternoon over SEPA Instant.'], media: { type: 'metric', value: 27, suffix: ' countries', caption: 'now settle the same day' } },
      { version: '11.9', date: 'Sep 15, 2026', title: 'Faster tax previews', kinds: ['improved', 'fixed'], body: ['Previews for quarterly filings now render in under a second, even for 5,000 employees.'], fixes: ['Rounding on Austrian social contributions matched the official calculator.'] },
    ],
    onSubscribe: fn(async () => {}),
    onFilterChange: fn(),
  },
}
