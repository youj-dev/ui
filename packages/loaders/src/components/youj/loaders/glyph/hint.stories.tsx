import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderHint, meta as about } from './hint'

export default { title: 'Visuals/Loaders/Glyph/Hint', tags: ['autodocs'], ...loaderMeta(LoaderHint, about) } satisfies Meta<typeof LoaderHint>

const s = loaderStories(LoaderHint)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
