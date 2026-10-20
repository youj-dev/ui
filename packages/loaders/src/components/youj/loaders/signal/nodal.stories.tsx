import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderNodal, meta as about } from './nodal'

export default { title: 'Visuals/Loaders/Signal/Nodal', tags: ['autodocs'], ...loaderMeta(LoaderNodal, about) } satisfies Meta<typeof LoaderNodal>

const s = loaderStories(LoaderNodal)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
