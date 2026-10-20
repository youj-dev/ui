import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderCatenate, meta as about } from './catenate'

export default { title: 'Visuals/Loaders/Science/Catenate', tags: ['autodocs'], ...loaderMeta(LoaderCatenate, about) } satisfies Meta<typeof LoaderCatenate>

const s = loaderStories(LoaderCatenate)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
