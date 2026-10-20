import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderCoarea, meta as about } from './coarea'

export default { title: 'Visuals/Loaders/Geometry/Coarea', tags: ['autodocs'], ...loaderMeta(LoaderCoarea, about, 'Generating a surface') } satisfies Meta<typeof LoaderCoarea>

const s = loaderStories(LoaderCoarea)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
