import { useMemo } from 'react'
import { defaultLabels, type YoujLabels } from './labels'
import { useLabelOverrides } from './provider'

/**
 * The built-in copy in effect here: English, under the labels every enclosing
 * YoujProvider sets. Components fall back to it when their own prop is unset.
 * It lives apart from the provider so only components with built-in copy carry
 * the English dictionary.
 */
export function useLabels(): YoujLabels {
  const overrides = useLabelOverrides()
  return useMemo(() => (overrides ? { ...defaultLabels, ...overrides } : defaultLabels), [overrides])
}
