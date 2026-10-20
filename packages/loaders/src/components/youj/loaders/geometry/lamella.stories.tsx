import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderLamella, meta as about } from './lamella'

export default { title: 'Visuals/Loaders/Geometry/Lamella', tags: ['autodocs'], ...loaderMeta(LoaderLamella, about) } satisfies Meta<typeof LoaderLamella>

const s = loaderStories(LoaderLamella)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
