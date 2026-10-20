import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderStow, meta as about } from './stow'

export default { title: 'Visuals/Loaders/Interface/Stow', tags: ['autodocs'], ...loaderMeta(LoaderStow, about) } satisfies Meta<typeof LoaderStow>

const s = loaderStories(LoaderStow)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
