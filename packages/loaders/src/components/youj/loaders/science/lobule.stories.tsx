import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderLobule, meta as about } from './lobule'

export default { title: 'Visuals/Loaders/Science/Lobule', tags: ['autodocs'], ...loaderMeta(LoaderLobule, about) } satisfies Meta<typeof LoaderLobule>

const s = loaderStories(LoaderLobule)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
