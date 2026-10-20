import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderLeastSquares, meta as about } from './least-squares'

export default { title: 'Visuals/Loaders/Signal/Least squares', tags: ['autodocs'], ...loaderMeta(LoaderLeastSquares, about) } satisfies Meta<typeof LoaderLeastSquares>

const s = loaderStories(LoaderLeastSquares)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
