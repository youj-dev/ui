import type { Meta, StoryObj } from '@storybook/react-vite'
import { SplitAllocation } from './split-allocation'

const meta: Meta<typeof SplitAllocation> = {
  title: 'Blocks/App/Split Allocation',
  component: SplitAllocation,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Split one amount across categories, evenly or by hand: a purchase, the rent, a pool of hours. A bar shows what is allocated and a status says what is left before it can be saved.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof SplitAllocation>

/** An equal split of $128.00 across three categories: $42.66, $42.66 and the last row's $42.68. */
export const Default: Story = { name: 'Split a purchase' }

/** A custom split with $12.80 still unallocated: the hatched end of the bar, the status in the warning tone and Save waiting. */
export const Custom: Story = {
  args: {
    defaultMode: 'custom',
    defaultLines: [
      { category: 'groceries', amount: 64 },
      { category: 'household', amount: 38.4 },
      { category: 'gifts', amount: 12.8 },
    ],
  },
}

/** Allocated $4.00 past the amount: the status says so in the danger tone and Save waits. */
export const Over: Story = {
  args: {
    defaultMode: 'custom',
    defaultLines: [
      { category: 'groceries', amount: 70 },
      { category: 'household', amount: 40 },
      { category: 'gifts', amount: 22 },
    ],
  },
}

/** Other data: euros written the German way, another purchase and another list of categories. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    locale: 'de-DE',
    format: { style: 'currency', currency: 'EUR' },
    total: { label: 'Linden Hardware', detail: 'Household', date: '2026-10-02', amount: 86.5 },
    categories: [
      { id: 'tools', name: 'Tools' },
      { id: 'paint', name: 'Paint' },
      { id: 'garden', name: 'Garden' },
      { id: 'storage', name: 'Storage' },
    ],
    defaultLines: [
      { category: 'tools', amount: 0 },
      { category: 'paint', amount: 0 },
    ],
  },
}

/** Roommates splitting the month's rent and utilities by room size: Dev's share is still open. */
export const SharedRent: Story = {
  name: 'Shared rent',
  args: {
    total: { label: 'Rent and utilities', detail: 'Unit 4B', date: '2026-10-01', amount: 2640 },
    categories: [
      { id: 'maya', name: 'Maya' },
      { id: 'dev', name: 'Dev' },
      { id: 'ines', name: 'Ines' },
      { id: 'tomas', name: 'Tomás' },
    ],
    defaultMode: 'custom',
    defaultLines: [
      { category: 'maya', amount: 1050 },
      { category: 'dev', amount: 780 },
      { category: 'ines', amount: 810 },
    ],
    copy: {
      title: 'Split the rent',
      category: 'Roommate',
      add: 'Add roommate',
      save: 'Save shares',
      saved: 'Shares saved',
      categoryOf: (name: string) => `Roommate for ${name}`,
    },
  },
}

/** Volunteer hours for a festival, assigned to stations in tenths of an hour; 7 hours are still unassigned. */
export const VolunteerHours: Story = {
  name: 'Volunteer hours',
  args: {
    format: { style: 'unit', unit: 'hour', unitDisplay: 'narrow', maximumFractionDigits: 1 },
    total: { label: 'Harvest festival', detail: 'Volunteer shifts', date: '2026-10-18', amount: 48 },
    categories: [
      { id: 'registration', name: 'Registration' },
      { id: 'food', name: 'Food tent' },
      { id: 'kids', name: 'Kids corner' },
      { id: 'cleanup', name: 'Cleanup' },
      { id: 'parking', name: 'Parking' },
    ],
    defaultMode: 'custom',
    defaultLines: [
      { category: 'registration', amount: 8.5 },
      { category: 'food', amount: 18 },
      { category: 'kids', amount: 9.5 },
      { category: 'cleanup', amount: 5 },
    ],
    copy: {
      title: 'Assign volunteer hours',
      mode: 'Assignment mode',
      equal: 'Even',
      custom: 'By hand',
      category: 'Station',
      amount: 'Hours',
      add: 'Add station',
      save: 'Save plan',
      saved: 'Plan saved',
      complete: (total: string) => `All ${total} assigned`,
      left: (amount: string) => `${amount} left to assign`,
      over: (amount: string) => `${amount} over`,
    },
  },
}

/** Drawn as its own page, with the card's title as the page's `h1`. */
export const Standalone: Story = {
  args: {
    embedded: false,
    defaultMode: 'custom',
    defaultLines: [
      { category: 'groceries', amount: 90 },
      { category: 'household', amount: 25.2 },
    ],
  },
}
