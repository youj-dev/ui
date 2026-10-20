import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderTorsion, meta as about } from './torsion'

export default { title: 'Visuals/Loaders/Geometry/Torsion', tags: ['autodocs'], ...loaderMeta(LoaderTorsion, about) } satisfies Meta<typeof LoaderTorsion>

const s = loaderStories(LoaderTorsion)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
