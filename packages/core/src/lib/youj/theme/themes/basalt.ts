import { composeTheme } from '../layers'
import { cleanStyle } from '../styles'
import { youjPalette } from './youj'

/** The Youj palette in the Clean style: Inter, rounded rectangles, quiet hairlines and sentence-case labels. The library default. */
export const basalt = composeTheme(youjPalette, cleanStyle, {
  id: 'basalt',
  name: 'Basalt',
  description: 'The Youj palette in the Clean style: Inter, rounded rectangles, quiet hairlines and sentence-case labels. The library default.',
})
