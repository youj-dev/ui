import type { FilterField, FilterGroup } from './filter-builder-model'

/* A CRM deal list for the stories and tests. */

export const DEAL_FIELDS: FilterField[] = [
  { id: 'name', label: 'Deal', type: 'text' },
  { id: 'stage', label: 'Stage', type: 'select', options: ['Lead', 'Qualified', 'Proposal', 'Won', 'Lost'] },
  { id: 'owner', label: 'Owner', type: 'select', options: ['Ada', 'Grace', 'Linus', 'Margaret'] },
  { id: 'amount', label: 'Amount', type: 'number' },
  { id: 'closes', label: 'Close date', type: 'date' },
  { id: 'tags', label: 'Tags', type: 'multiselect', options: [{ value: 'enterprise', label: 'Enterprise' }, { value: 'renewal', label: 'Renewal' }, { value: 'partner', label: 'Partner' }] },
  { id: 'starred', label: 'Starred', type: 'boolean' },
]

export interface Deal {
  name: string
  stage: string
  owner: string
  amount: number
  closes: string
  tags: string[]
  starred: boolean
}

export const DEALS: Deal[] = [
  { name: 'Northwind renewal', stage: 'Proposal', owner: 'Ada', amount: 48000, closes: '2026-11-04', tags: ['renewal', 'enterprise'], starred: true },
  { name: 'Globex rollout', stage: 'Qualified', owner: 'Grace', amount: 125000, closes: '2026-12-15', tags: ['enterprise'], starred: false },
  { name: 'Initech pilot', stage: 'Lead', owner: 'Linus', amount: 9000, closes: '2026-10-30', tags: [], starred: false },
  { name: 'Umbrella expansion', stage: 'Won', owner: 'Ada', amount: 76000, closes: '2026-09-21', tags: ['partner'], starred: true },
  { name: 'Hooli licenses', stage: 'Proposal', owner: 'Margaret', amount: 32000, closes: '2026-11-18', tags: ['renewal'], starred: false },
  { name: 'Stark audit', stage: 'Lost', owner: 'Grace', amount: 54000, closes: '2026-08-02', tags: ['enterprise', 'partner'], starred: false },
]

/** Open deals that are Ada's, or big ones: a nested group. */
export const NESTED_FILTER: FilterGroup = {
  type: 'group',
  combinator: 'and',
  children: [
    { type: 'rule', field: 'stage', operator: 'isNot', value: 'Lost' },
    {
      type: 'group',
      combinator: 'or',
      children: [
        { type: 'rule', field: 'owner', operator: 'is', value: 'Ada' },
        { type: 'rule', field: 'amount', operator: 'gt', value: 100000 },
      ],
    },
  ],
}
