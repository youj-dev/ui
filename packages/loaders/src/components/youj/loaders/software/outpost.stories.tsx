import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderOutpost, meta as about } from './outpost'

export default { title: 'Visuals/Loaders/Software/Outpost', tags: ['autodocs'], ...loaderMeta(LoaderOutpost, about) } satisfies Meta<typeof LoaderOutpost>

const s = loaderStories(LoaderOutpost, { hero: 'Software at work, using the shared application context.' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
