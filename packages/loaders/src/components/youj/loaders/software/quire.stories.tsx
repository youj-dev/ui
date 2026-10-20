import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderQuire, meta as about } from './quire'

export default { title: 'Visuals/Loaders/Software/Quire', tags: ['autodocs'], ...loaderMeta(LoaderQuire, about) } satisfies Meta<typeof LoaderQuire>

const s = loaderStories(LoaderQuire, { hero: 'Software at work, using the shared application context.' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
