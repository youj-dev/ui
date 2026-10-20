import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderWinnow, meta as about } from './winnow'

export default { title: 'Visuals/Loaders/Software/Winnow', tags: ['autodocs'], ...loaderMeta(LoaderWinnow, about) } satisfies Meta<typeof LoaderWinnow>

const s = loaderStories(LoaderWinnow, { hero: 'Software at work, using the shared application context.' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
