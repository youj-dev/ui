import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderInfill, meta as about } from './infill'

export default { title: 'Visuals/Loaders/Geometry/Infill', tags: ['autodocs'], ...loaderMeta(LoaderInfill, about) } satisfies Meta<typeof LoaderInfill>

const s = loaderStories(LoaderInfill)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
