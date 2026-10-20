import { composeTheme } from '../layers'
import { terminalStyle } from '../styles'
import { youjPalette } from './youj'

/** The Youj palette in the Terminal style: monospace throughout, square corners, tight rows. */
export const terminal = composeTheme(youjPalette, terminalStyle, {
  id: 'terminal',
  name: 'Terminal',
  description: 'The Youj palette in the Terminal style: monospace throughout, square corners, tight rows.',
})
