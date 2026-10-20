import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderKnead, meta as about } from './knead'

export default { title: 'Visuals/Loaders/Geometry/Knead', tags: ['autodocs'], ...loaderMeta(LoaderKnead, about) } satisfies Meta<typeof LoaderKnead>

const s = loaderStories(LoaderKnead)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
