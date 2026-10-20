import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderContour, meta as about } from './contour'

export default { title: 'Visuals/Loaders/Geometry/Contour', tags: ['autodocs'], ...loaderMeta(LoaderContour, about) } satisfies Meta<typeof LoaderContour>

const s = loaderStories(LoaderContour)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
