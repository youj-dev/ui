import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderYoke, meta as about } from './yoke'

export default { title: 'Visuals/Loaders/Mechanics/Yoke', tags: ['autodocs'], ...loaderMeta(LoaderYoke, about) } satisfies Meta<typeof LoaderYoke>

const s = loaderStories(LoaderYoke)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
