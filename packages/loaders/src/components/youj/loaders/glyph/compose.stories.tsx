import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderCompose, meta as about } from './compose'

export default { title: 'Visuals/Loaders/Glyph/Compose', tags: ['autodocs'], ...loaderMeta(LoaderCompose, about) } satisfies Meta<typeof LoaderCompose>

const s = loaderStories(LoaderCompose)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
