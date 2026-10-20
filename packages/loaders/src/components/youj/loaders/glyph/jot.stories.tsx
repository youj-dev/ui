import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderJot, meta as about } from './jot'

export default { title: 'Visuals/Loaders/Glyph/Jot', tags: ['autodocs'], ...loaderMeta(LoaderJot, about) } satisfies Meta<typeof LoaderJot>

const s = loaderStories(LoaderJot)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
