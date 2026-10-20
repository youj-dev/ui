import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderKern, meta as about } from './kern'

export default { title: 'Visuals/Loaders/Glyph/Kern', tags: ['autodocs'], ...loaderMeta(LoaderKern, about) } satisfies Meta<typeof LoaderKern>

const s = loaderStories(LoaderKern)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
