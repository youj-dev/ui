import { createContext, useContext, type RefCallback } from 'react'
import type { FilterBuilderLabels, FilterField, FilterOperator, FilterRule, FilterValue } from './filter-builder-model'

/* What the rows and groups of one builder share: the schema, the words, the
 * one token popup that is open, and the edits they ask for. */

interface FilterBuilderContext {
  fields: FilterField[]
  labels: FilterBuilderLabels
  maxDepth: number
  disabled: boolean
  /** Whether this rule is flagged as incomplete (it has been left, or Apply refused it). */
  flagged: (rule: FilterRule) => boolean
  touch: (ruleId: string) => void
  /** A ref callback that files the element under `key`, so focus can be moved to it later. */
  register: (key: string) => RefCallback<HTMLElement>
  /** The token whose popup is open, as `field:<rule id>`, `operator:…` or `value:…`. One at a time. */
  open: string | null
  setOpen: (key: string | null) => void
  /** The open popup as last set, read at the moment a closing popup decides where focus goes. */
  openNow: () => string | null
  setCombinator: (groupId: string, combinator: 'and' | 'or') => void
  addRule: (groupId: string) => void
  addGroup: (groupId: string) => void
  duplicate: (id: string) => void
  remove: (id: string, name: string) => void
  ungroup: (id: string) => void
  changeField: (ruleId: string, fieldId: string) => void
  changeOperator: (ruleId: string, operator: FilterOperator) => void
  changeValue: (ruleId: string, value: FilterValue) => void
}

const Context = createContext<FilterBuilderContext | null>(null)

function useFilterBuilder(): FilterBuilderContext {
  const context = useContext(Context)
  if (!context) throw new Error('Filter builder parts must be rendered inside <FilterBuilder>.')
  return context
}

export { Context as FilterBuilderProvider, useFilterBuilder, type FilterBuilderContext }
