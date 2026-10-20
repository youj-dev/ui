import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderDetent, meta as about } from './detent'

export default { title: 'Visuals/Loaders/Mechanics/Detent', tags: ['autodocs'], ...loaderMeta(LoaderDetent, about) } satisfies Meta<typeof LoaderDetent>

const s = loaderStories(LoaderDetent)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
