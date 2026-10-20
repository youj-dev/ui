import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderPortico, meta as about } from './portico'

export default { title: 'Visuals/Loaders/Software/Portico', tags: ['autodocs'], ...loaderMeta(LoaderPortico, about) } satisfies Meta<typeof LoaderPortico>

const s = loaderStories(LoaderPortico, { hero: 'Software at work, using the shared application context.' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
