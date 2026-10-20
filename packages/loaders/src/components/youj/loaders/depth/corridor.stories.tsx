import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderCorridor, meta as about } from './corridor'

export default { title: 'Visuals/Loaders/Depth/Corridor', tags: ['autodocs'], ...loaderMeta(LoaderCorridor, about) } satisfies Meta<typeof LoaderCorridor>

const s = loaderStories(LoaderCorridor)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
