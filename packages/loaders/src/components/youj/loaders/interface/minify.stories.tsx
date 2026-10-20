import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderMinify, meta as about } from './minify'

export default { title: 'Visuals/Loaders/Interface/Minify', tags: ['autodocs'], ...loaderMeta(LoaderMinify, about) } satisfies Meta<typeof LoaderMinify>

const s = loaderStories(LoaderMinify)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
