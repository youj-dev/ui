import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderDelta, meta as about } from './delta'

export default { title: 'Visuals/Loaders/Signal/Delta', tags: ['autodocs'], ...loaderMeta(LoaderDelta, about) } satisfies Meta<typeof LoaderDelta>

const s = loaderStories(LoaderDelta)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
