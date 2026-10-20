import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderRaccord, meta as about } from './raccord'

export default { title: 'Visuals/Loaders/Software/Raccord', tags: ['autodocs'], ...loaderMeta(LoaderRaccord, about) } satisfies Meta<typeof LoaderRaccord>

const s = loaderStories(LoaderRaccord, { hero: 'Software at work, using the shared application context.' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
