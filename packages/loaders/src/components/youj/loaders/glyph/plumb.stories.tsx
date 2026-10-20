import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderPlumb, meta as about } from './plumb'

export default { title: 'Visuals/Loaders/Glyph/Plumb', tags: ['autodocs'], ...loaderMeta(LoaderPlumb, about) } satisfies Meta<typeof LoaderPlumb>

const s = loaderStories(LoaderPlumb)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
