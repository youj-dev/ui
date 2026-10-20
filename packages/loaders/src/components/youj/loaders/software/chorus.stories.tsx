import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderChorus, meta as about } from './chorus'

export default { title: 'Visuals/Loaders/Software/Chorus', tags: ['autodocs'], ...loaderMeta(LoaderChorus, about) } satisfies Meta<typeof LoaderChorus>

const s = loaderStories(LoaderChorus, { hero: 'Software at work, using the shared application context.' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
