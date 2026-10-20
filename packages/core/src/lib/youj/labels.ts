import type { YoujLabels } from './labels-types'
import * as english from './labels-defaults'

export type { YoujLabels } from './labels-types'

const { continueLabel, exportLabel, ...labels } = english

/** Full dictionary for the public useLabels() API. Components select their own defaults. */
export const defaultLabels: YoujLabels = {
  ...labels,
  continue: continueLabel,
  export: exportLabel,
}
