import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderBellows, meta as about } from './bellows'

export default { title: 'Visuals/Loaders/Mechanics/Bellows', tags: ['autodocs'], ...loaderMeta(LoaderBellows, about) } satisfies Meta<typeof LoaderBellows>

const s = loaderStories(LoaderBellows)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
