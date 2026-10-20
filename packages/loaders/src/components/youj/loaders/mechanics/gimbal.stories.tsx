import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderGimbal, meta as about } from './gimbal'

export default { title: 'Visuals/Loaders/Mechanics/Gimbal', tags: ['autodocs'], ...loaderMeta(LoaderGimbal, about) } satisfies Meta<typeof LoaderGimbal>

const s = loaderStories(LoaderGimbal)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
