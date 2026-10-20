import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderPhosphor, meta as about } from './phosphor'

export default { title: 'Visuals/Loaders/Signal/Phosphor', tags: ['autodocs'], ...loaderMeta(LoaderPhosphor, about) } satisfies Meta<typeof LoaderPhosphor>

const s = loaderStories(LoaderPhosphor)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
