import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderStave, meta as about } from './stave'

export default { title: 'Visuals/Loaders/Geometry/Stave', tags: ['autodocs'], ...loaderMeta(LoaderStave, about) } satisfies Meta<typeof LoaderStave>

const s = loaderStories(LoaderStave)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
