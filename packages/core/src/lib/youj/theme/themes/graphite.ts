import { composeTheme } from '../layers'
import { cleanStyle } from '../styles'
import { youjPalette } from './youj'

/** The Youj palette in the Clean style: Inter, rounded rectangles, quiet hairlines. The light default before palettes and styles split. */
export const graphite = composeTheme(youjPalette, cleanStyle, {
  id: 'graphite',
  name: 'Graphite',
  description: 'The Youj palette in the Clean style: Inter, rounded rectangles, quiet hairlines. The light default before palettes and styles split.',
})
