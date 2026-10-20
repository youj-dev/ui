import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderOvertone, meta as about } from './overtone'

export default { title: 'Visuals/Loaders/Waves/Overtone', tags: ['autodocs'], ...loaderMeta(LoaderOvertone, about) } satisfies Meta<typeof LoaderOvertone>

const s = loaderStories(LoaderOvertone)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
