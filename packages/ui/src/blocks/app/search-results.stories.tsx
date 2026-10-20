import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { graphite } from '@youj/core'
import { SearchResults } from './search-results'

const meta: Meta<typeof SearchResults> = {
  title: 'Blocks/App/Search results',
  component: SearchResults,
  // The showcase's look: the block itself inherits the app's theme.
  args: { theme: graphite },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', preset: 'graphite', address: 'kestrel.so/search?q=onboarding' },
    docs: {
      description: {
        component:
          'Help your users find pages and content with a search results screen for your app or knowledge base.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SearchResults>

export const Default: Story = {}

/** Its own page, for an app without the frame: the top bar over a centered canvas of the search field, filters and results. */
export const Standalone: Story = { args: { embedded: false } }

/** Filters in force: documents and projects updated in the past month. */
export const Filtered: Story = { args: { initialSearch: '?q=onboarding&type=document,project&updated=30d' } }

/** Before a search: recent and popular searches. */
export const Start: Story = { args: { initialSearch: '' } }

/** A misspelt query: no results, with a spelling fix. */
export const NoResults: Story = { args: { initialSearch: '?q=onbaording' } }

/** Waiting on the search API: skeleton rows shaped like results. */
export const Loading: Story = { args: { loading: true } }

/** A law firm's knowledge base: its own documents, people, brand and words. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Calder Legal' },
    origin: 'kb.calder.law/search',
    defaultSearch: '?q=contract',
    popular: ['contract', 'nda', 'retention', 'billing codes'],
    defaultRecent: ['nda template'],
    today: Date.UTC(2026, 9, 1, 12),
    people: {
      nora: { id: 'nora', name: 'Nora Calder', initials: 'NC', role: 'Managing partner', team: 'Corporate', location: 'Edinburgh', utc: 1, email: 'nora@calder.law' },
      sami: { id: 'sami', name: 'Sami Haddad', initials: 'SH', role: 'Associate', team: 'Employment', location: 'Glasgow', utc: 1, email: 'sami@calder.law' },
    },
    items: [
      { id: 'msa', type: 'document', title: 'Master services contract template', path: ['Templates', 'Corporate'], owner: 'nora', updated: 2, minutes: 14, tags: ['contract', 'template'], excerpt: 'Our standard contract for retained clients: scope, fees, liability caps and the termination schedule.', href: '/kb/msa' },
      { id: 'nda', type: 'document', title: 'Mutual NDA: when to use the short form', path: ['Guides', 'Corporate'], owner: 'sami', updated: 9, minutes: 5, tags: ['nda', 'contract'], excerpt: 'The short form covers most first meetings; switch to the long form when source code or trade secrets change hands.', href: '/kb/nda' },
      { id: 'person-nora', type: 'person', title: 'Nora Calder', owner: 'nora', updated: 0, tags: ['contract'], bio: 'Leads the corporate practice and signs off every contract template.', href: '/people/nora' },
      { id: 'renewals', type: 'project', title: 'Contract renewals for Q4', owner: 'sami', updated: 1, status: 'at-risk', progress: 40, members: ['sami', 'nora'], due: 'Dec 15', tags: ['contract'], summary: 'Forty-two client contracts renew this quarter; twelve still need a fee review.', href: '/projects/renewals' },
    ],
    copy: { title: 'Knowledge base', section: 'Knowledge base', placeholder: 'Search templates, guides and people' },
    onOpen: fn(),
    onSearchChange: fn(),
    onRecentChange: fn(),
    onLoadMore: fn(),
  },
}
