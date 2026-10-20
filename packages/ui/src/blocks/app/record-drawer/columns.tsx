'use client'

import { createDataGridColumns } from '../../tables/data-grid'
import { STAGE_TONES, type RecordDrawerCopy, type RecordDrawerDeal, type RecordDrawerStage } from './data'

const col = createDataGridColumns<RecordDrawerDeal>()

/** The deals list: the company and its deal, the stage, the money, the odds, the owner and the close date. */
export function dealColumns(copy: RecordDrawerCopy, currency: string) {
  const h = copy.columns
  const stages = Object.fromEntries(
    (Object.keys(STAGE_TONES) as RecordDrawerStage[]).map((stage) => [stage, { label: copy.stages[stage], tone: STAGE_TONES[stage] }]),
  )
  return [
    col.identity('company.name', { id: 'company', header: h.company, shape: 'square', secondary: (d) => d.name, size: 280, meta: { grow: true } }),
    col.status('stage', { header: h.stage, options: stages, size: 164 }),
    col.currency('value', { header: h.value, currency, size: 130 }),
    col.number((d) => d.probability / 100, { id: 'probability', header: h.probability, format: { style: 'percent' }, size: 120 }),
    col.people((d) => [d.owner], { id: 'owner', header: h.owner, size: 120 }),
    col.date('closesAt', { header: h.closesAt, size: 130 }),
  ]
}
