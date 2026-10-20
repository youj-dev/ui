import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderQuantile, meta as about } from './quantile'

export default { title: 'Visuals/Loaders/Signal/Quantile', tags: ['autodocs'], ...loaderMeta(LoaderQuantile, about, 'Analyzing distribution') } satisfies Meta<typeof LoaderQuantile>

const s = loaderStories(LoaderQuantile, { hero: 'A product status and an inline task at their working sizes.' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
