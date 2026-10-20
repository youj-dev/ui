import type { FilterField } from '@youj/react'

export interface Deal {
  name: string
  stage: string
  owner: string
  amount: number
  closes: string
  tags: string[]
}

export const DEAL_FIELDS: FilterField[] = [
  { id: 'name', label: 'Deal', type: 'text' },
  { id: 'stage', label: 'Stage', type: 'select', options: ['Lead', 'Qualified', 'Proposal', 'Won', 'Lost'] },
  { id: 'owner', label: 'Owner', type: 'select', options: ['Ada', 'Grace', 'Linus', 'Margaret'] },
  { id: 'amount', label: 'Amount', type: 'number' },
  { id: 'closes', label: 'Close date', type: 'date' },
  { id: 'tags', label: 'Tags', type: 'multiselect', options: [{ value: 'enterprise', label: 'Enterprise' }, { value: 'renewal', label: 'Renewal' }, { value: 'partner', label: 'Partner' }] },
]

export const DEALS: Deal[] = [
  { name: 'Northwind renewal', stage: 'Proposal', owner: 'Ada', amount: 48000, closes: '2026-11-04', tags: ['renewal', 'enterprise'] },
  { name: 'Globex rollout', stage: 'Qualified', owner: 'Grace', amount: 125000, closes: '2026-12-15', tags: ['enterprise'] },
  { name: 'Initech pilot', stage: 'Lead', owner: 'Linus', amount: 9000, closes: '2026-10-30', tags: [] },
  { name: 'Umbrella expansion', stage: 'Won', owner: 'Ada', amount: 76000, closes: '2026-09-21', tags: ['partner'] },
  { name: 'Hooli licenses', stage: 'Proposal', owner: 'Margaret', amount: 32000, closes: '2026-11-18', tags: ['renewal'] },
  { name: 'Stark audit', stage: 'Lost', owner: 'Grace', amount: 54000, closes: '2026-08-02', tags: ['enterprise', 'partner'] },
  { name: 'Wayne security review', stage: 'Qualified', owner: 'Ada', amount: 210000, closes: '2027-01-12', tags: ['enterprise'] },
  { name: 'Soylent supply', stage: 'Lead', owner: 'Margaret', amount: 18500, closes: '2026-12-01', tags: ['partner'] },
]
