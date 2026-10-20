import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderKekule, meta as about } from './kekule'

export default { title: 'Visuals/Loaders/Science/Kekule', tags: ['autodocs'], ...loaderMeta(LoaderKekule, about) } satisfies Meta<typeof LoaderKekule>

const s = loaderStories(LoaderKekule)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
