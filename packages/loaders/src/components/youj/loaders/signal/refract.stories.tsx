import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderRefract, meta as about } from './refract'

export default { title: 'Visuals/Loaders/Signal/Refract', tags: ['autodocs'], ...loaderMeta(LoaderRefract, about) } satisfies Meta<typeof LoaderRefract>

const s = loaderStories(LoaderRefract)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
