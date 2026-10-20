import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderEpicycle, meta as about } from './epicycle'

export default { title: 'Visuals/Loaders/Mechanics/Epicycle', tags: ['autodocs'], ...loaderMeta(LoaderEpicycle, about) } satisfies Meta<typeof LoaderEpicycle>

const s = loaderStories(LoaderEpicycle)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
