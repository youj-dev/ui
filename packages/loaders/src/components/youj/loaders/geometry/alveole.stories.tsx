import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderAlveole, meta as about } from './alveole'

export default { title: 'Visuals/Loaders/Geometry/Alveole', tags: ['autodocs'], ...loaderMeta(LoaderAlveole, about) } satisfies Meta<typeof LoaderAlveole>

const s = loaderStories(LoaderAlveole)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
