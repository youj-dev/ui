import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderAshlar, meta as about } from './ashlar'

export default { title: 'Visuals/Loaders/Geometry/Ashlar', tags: ['autodocs'], ...loaderMeta(LoaderAshlar, about) } satisfies Meta<typeof LoaderAshlar>

const s = loaderStories(LoaderAshlar)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
