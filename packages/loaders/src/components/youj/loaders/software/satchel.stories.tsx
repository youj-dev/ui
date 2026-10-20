import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderSatchel, meta as about } from './satchel'

export default { title: 'Visuals/Loaders/Software/Satchel', tags: ['autodocs'], ...loaderMeta(LoaderSatchel, about) } satisfies Meta<typeof LoaderSatchel>

const s = loaderStories(LoaderSatchel, { hero: 'Software at work, using the shared application context.' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
