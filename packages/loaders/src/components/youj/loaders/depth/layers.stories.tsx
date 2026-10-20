import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderLayers, meta as about } from './layers'

export default { title: 'Visuals/Loaders/Depth/Layers', tags: ['autodocs'], ...loaderMeta(LoaderLayers, about) } satisfies Meta<typeof LoaderLayers>

const s = loaderStories(LoaderLayers)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
