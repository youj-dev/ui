import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderOffshoot, meta as about } from './offshoot'

export default { title: 'Visuals/Loaders/Software/Offshoot', tags: ['autodocs'], ...loaderMeta(LoaderOffshoot, about) } satisfies Meta<typeof LoaderOffshoot>

const s = loaderStories(LoaderOffshoot, { hero: 'Software at work, using the shared application context.' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
