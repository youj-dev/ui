import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderCadence, meta as about } from './cadence'

export default { title: 'Visuals/Loaders/Software/Cadence', tags: ['autodocs'], ...loaderMeta(LoaderCadence, about) } satisfies Meta<typeof LoaderCadence>

const s = loaderStories(LoaderCadence, { hero: 'Software at work, using the shared application context.' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
