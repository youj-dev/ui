import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderNutate, meta as about } from './nutate'

export default { title: 'Visuals/Loaders/Mechanics/Nutate', tags: ['autodocs'], ...loaderMeta(LoaderNutate, about) } satisfies Meta<typeof LoaderNutate>

const s = loaderStories(LoaderNutate)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
