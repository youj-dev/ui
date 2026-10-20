import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderLaminate, meta as about } from './laminate'

export default { title: 'Visuals/Loaders/Geometry/Laminate', tags: ['autodocs'], ...loaderMeta(LoaderLaminate, about) } satisfies Meta<typeof LoaderLaminate>

const s = loaderStories(LoaderLaminate)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
