import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderLattice, meta as about } from './lattice'

export default { title: 'Visuals/Loaders/Mechanics/Lattice', tags: ['autodocs'], ...loaderMeta(LoaderLattice, about) } satisfies Meta<typeof LoaderLattice>

const s = loaderStories(LoaderLattice)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
