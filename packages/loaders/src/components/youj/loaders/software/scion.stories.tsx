import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderScion, meta as about } from './scion'

export default { title: 'Visuals/Loaders/Software/Scion', tags: ['autodocs'], ...loaderMeta(LoaderScion, about) } satisfies Meta<typeof LoaderScion>

const s = loaderStories(LoaderScion, { hero: 'Software at work, using the shared application context.' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
