import { composeTheme } from '../layers'
import { brutalStyle } from '../styles'
import { youjPalette } from './youj'

/** The Youj palette in the Brutal style: ink outlines, hard offset shadows, square corners and heavy titles. */
export const brutal = composeTheme(youjPalette, brutalStyle, {
  id: 'brutal',
  name: 'Brutal',
  description: 'The Youj palette in the Brutal style: ink outlines, hard offset shadows, square corners and heavy titles.',
})
