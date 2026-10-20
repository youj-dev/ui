import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderAmanuensis, meta as about } from './amanuensis'

export default { title: 'Visuals/Loaders/Software/Amanuensis', tags: ['autodocs'], ...loaderMeta(LoaderAmanuensis, about) } satisfies Meta<typeof LoaderAmanuensis>

const s = loaderStories(LoaderAmanuensis, { hero: 'Software at work, using the shared application context.' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
