import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderElide, meta as about } from './elide'

export default { title: 'Visuals/Loaders/Software/Elide', tags: ['autodocs'], ...loaderMeta(LoaderElide, about) } satisfies Meta<typeof LoaderElide>

const s = loaderStories(LoaderElide, { hero: 'Software at work, using the shared application context.' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
