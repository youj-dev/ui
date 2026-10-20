import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderTackle, meta as about } from './tackle'

export default { title: 'Visuals/Loaders/Mechanics/Tackle', tags: ['autodocs'], ...loaderMeta(LoaderTackle, about) } satisfies Meta<typeof LoaderTackle>

const s = loaderStories(LoaderTackle)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
