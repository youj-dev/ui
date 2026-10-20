import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderMesh, meta as about } from './mesh'

export default { title: 'Visuals/Loaders/Mechanics/Mesh', tags: ['autodocs'], ...loaderMeta(LoaderMesh, about) } satisfies Meta<typeof LoaderMesh>

const s = loaderStories(LoaderMesh)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
