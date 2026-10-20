import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { FilterBuilder } from './filter-builder'
import { EMPTY_FILTER, matchFilter, type FilterGroup } from './filter-builder-model'
import { DEALS, DEAL_FIELDS, NESTED_FILTER } from './filter-builder.fixtures'

const meta: Meta<typeof FilterBuilder> = {
  title: 'UI/Inputs/Filter builder',
  component: FilterBuilder,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Builds a query of AND/OR groups of typed rules, such as “Stage is not Lost and (Owner is Ada or Amount > 100000)”. Each rule reads as a sentence of soft tokens (field, an operator that suits its type, a value), and each token opens a small menu or editor; every row starts in one connector column (Where, then and/or), and nested groups hang off a guide line. Edits are a draft until Apply, Reset throws them away, and the footer says while they differ. Incomplete rules are flagged and Apply refuses them. Groups nest up to `maxDepth`. The value is plain JSON; `matchFilter(row, group)` runs it in the browser and `describeFilter(group, fields)` writes it as a sentence. Rows enter and leave through Presence List; reduced motion is instant.',
      },
    },
  },
  argTypes: {
    maxDepth: { control: { type: 'number', min: 1, max: 4 } },
    summary: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: { fields: DEAL_FIELDS, maxDepth: 2, summary: true, disabled: false },
}
export default meta
type Story = StoryObj<typeof FilterBuilder>

function WithDeals({ initial, ...args }: React.ComponentProps<typeof FilterBuilder> & { initial: FilterGroup }) {
  const [filter, setFilter] = useState(initial)
  const rows = DEALS.filter((deal) => matchFilter(deal, filter))
  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      <FilterBuilder {...args} value={filter} onValueChange={setFilter} />
      <ul aria-label="Deals" className="flex flex-col divide-y divide-line-subtle rounded-lg border border-line-subtle text-ui">
        {rows.map((deal) => (
          <li key={deal.name} className="flex items-center justify-between gap-3 px-3 py-2">
            <span className="font-medium">{deal.name}</span>
            <span className="text-fg-muted">
              {deal.stage} · {deal.owner} · {deal.amount.toLocaleString('en-US')}
            </span>
          </li>
        ))}
        {rows.length === 0 && <li className="px-3 py-2 text-fg-muted">No deals match.</li>}
      </ul>
    </div>
  )
}

/** Every prop as a control, over a deals list. */
export const Playground: Story = {
  render: (args) => <WithDeals {...args} initial={EMPTY_FILTER} />,
}

/** A group inside the outer one: Ada’s deals or big ones, but never lost ones. */
export const Nested: Story = {
  render: (args) => <WithDeals {...args} initial={NESTED_FILTER} />,
}

/** `maxDepth` 3 allows a group inside a group inside the outer one. */
export const Deeper: Story = {
  args: { maxDepth: 3 },
  render: (args) => <WithDeals {...args} initial={NESTED_FILTER} />,
}

/** No summary above the builder. */
export const WithoutSummary: Story = {
  args: { summary: false },
  render: (args) => <WithDeals {...args} initial={NESTED_FILTER} />,
}

/** A schema with many fields: the field menu opens with a search that narrows it as you type. */
export const ManyFields: Story = {
  args: {
    fields: [
      ...DEAL_FIELDS,
      { id: 'region', label: 'Region', type: 'select', options: ['EMEA', 'Americas', 'APAC'] },
      { id: 'source', label: 'Source', type: 'select', options: ['Inbound', 'Outbound', 'Partner', 'Event'] },
      { id: 'probability', label: 'Probability', type: 'number' },
      { id: 'created', label: 'Created', type: 'date' },
    ],
  },
  render: (args) => <WithDeals {...args} initial={NESTED_FILTER} />,
}

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => <FilterBuilder {...args} defaultValue={NESTED_FILTER} />,
}
