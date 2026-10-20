import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChipFilters } from './chip-filters'
import { histogram, type ChipFiltersFields } from './chip-filters/data'

const meta: Meta<typeof ChipFilters> = {
  title: 'Blocks/App/Chip Filters',
  component: ChipFilters,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card', preset: 'basalt' },
    docs: {
      description: {
        component:
          'Narrow a search with filters you can type, paste or edit as chips: a range with a histogram and a checklist of groups, each rewriting the other’s chip. Orders, job listings and a library catalog read the same way.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ChipFilters>

export const Default: Story = { name: 'Order search' }

/** No filters: every state, the whole value range, and no chips. */
export const AllOrders: Story = { name: 'All orders', args: { defaultValue: { range: [0, 320], selected: ['paid', 'packed', 'shipped', 'returned'] } } }

/** Nothing checked: the count runs to zero and the histogram falls to its baseline. */
export const NothingMatches: Story = { args: { defaultValue: { range: [25, 180], selected: [] } } }

const SALARY: ChipFiltersFields = {
  range: { id: 'salary', min: 40, max: 240, step: 1, bins: 40, ticks: [40, 90, 140, 190, 240] },
  choice: { id: 'team' },
}

/** Careers: open roles by salary (in thousands of dollars) and team. Salary moves with the thumbs or as `salary:90..140`; teams as `team:in(engineering,design)`. */
export const JobListings: Story = {
  name: 'Job listings',
  args: {
    fields: SALARY,
    format: (value) => `$${value}K`,
    defaultValue: { range: [90, 160], selected: ['engineering', 'design'] },
    options: [
      { id: 'engineering', label: 'Engineering', token: 'engineering', bins: histogram([[118, 0.22, 0.7], [165, 0.14, 0.3]], 214, SALARY.range) },
      { id: 'design', label: 'Design', token: 'design', bins: histogram([[104, 0.2, 1]], 96, SALARY.range) },
      { id: 'sales', label: 'Sales', token: 'sales', bins: histogram([[78, 0.25, 0.6], [124, 0.18, 0.4]], 128, SALARY.range) },
      { id: 'support', label: 'Support', token: 'support', bins: histogram([[62, 0.18, 1]], 87, SALARY.range) },
    ],
    copy: {
      title: 'Open roles',
      scope: 'all offices · remote included',
      more: 'More role search actions',
      copied: 'Role search copied',
      search: 'Search roles',
      ofTotal: (total) => `of ${total} roles`,
      matchedAnnouncement: (count) => `${count} roles match`,
      rangeLabel: 'Salary (thousands)',
      choiceLabel: 'Team',
      allOptions: 'All teams',
      countColumn: 'Roles',
      selectedOf: (selected, total) => `${selected} of ${total} teams`,
      saveView: 'Save alert',
      invalidToken: 'Write a filter as field:value, e.g. team:design.',
      invalidRange: 'Write a salary in thousands as salary:90..140.',
      unknownOption: (known) => `Team takes ${known}.`,
    },
  },
}

const YEARS: ChipFiltersFields = {
  range: { id: 'year', min: 1950, max: 2025, step: 1, bins: 25, ticks: [1950, 1975, 2000, 2025] },
  choice: { id: 'format' },
}

/** Education: a library catalog by year published and format. The years are plain (`format={String}`), the formats are a checklist, and an audiobook-only search is `format:audiobook`. */
export const LibraryCatalog: Story = {
  name: 'Library catalog',
  args: {
    fields: YEARS,
    format: String,
    defaultValue: { range: [1990, 2020], selected: ['print', 'ebook'] },
    options: [
      { id: 'print', label: 'Print book', token: 'print', bins: histogram([[2004, 0.006, 0.6], [1976, 0.005, 0.4]], 18_400, YEARS.range) },
      { id: 'ebook', label: 'E-book', token: 'ebook', bins: histogram([[2015, 0.0035, 1]], 6_200, YEARS.range) },
      { id: 'audiobook', label: 'Audiobook', token: 'audiobook', bins: histogram([[2018, 0.003, 1]], 2_150, YEARS.range) },
      { id: 'journal', label: 'Journal', token: 'journal', bins: histogram([[1996, 0.008, 1]], 3_900, YEARS.range) },
    ],
    copy: {
      title: 'Catalog',
      scope: 'Riverside Public Library · all branches',
      more: 'More catalog search actions',
      copied: 'Catalog search copied',
      search: 'Search the catalog',
      ofTotal: (total) => `of ${total} titles`,
      matchedAnnouncement: (count) => `${count} titles match`,
      rangeLabel: 'Year published',
      choiceLabel: 'Format',
      allOptions: 'All formats',
      countColumn: 'Titles',
      selectedOf: (selected, total) => `${selected} of ${total} formats`,
      saveView: 'Save shelf',
      invalidToken: 'Write a filter as field:value, e.g. format:ebook.',
      invalidRange: 'Write a year range as year:1990..2020.',
      unknownOption: (known) => `Format takes ${known}.`,
    },
  },
}
