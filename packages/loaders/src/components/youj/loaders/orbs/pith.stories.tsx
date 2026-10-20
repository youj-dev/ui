import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderPith, meta as about } from './pith'

export default { title: 'Visuals/Loaders/Orbs/Pith', tags: ['autodocs'], ...loaderMeta(LoaderPith, about) } satisfies Meta<typeof LoaderPith>

const s = loaderStories(LoaderPith)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
