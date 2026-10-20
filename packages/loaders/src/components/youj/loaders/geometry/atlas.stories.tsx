import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderAtlas, meta as about } from './atlas'

export default { title: 'Visuals/Loaders/Geometry/Atlas', tags: ['autodocs'], ...loaderMeta(LoaderAtlas, about) } satisfies Meta<typeof LoaderAtlas>

const s = loaderStories(LoaderAtlas)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
