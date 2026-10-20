import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderOverturn, meta as about } from './overturn'

export default { title: 'Visuals/Loaders/Signal/Overturn', tags: ['autodocs'], ...loaderMeta(LoaderOverturn, about) } satisfies Meta<typeof LoaderOverturn>

const s = loaderStories(LoaderOverturn)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
