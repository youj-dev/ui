import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderVitals, meta as about } from './vitals'

export default { title: 'Visuals/Loaders/Signal/Vitals', tags: ['autodocs'], ...loaderMeta(LoaderVitals, about) } satisfies Meta<typeof LoaderVitals>

const s = loaderStories(LoaderVitals)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
