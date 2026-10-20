import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderExtrude, meta as about } from './extrude'

export default { title: 'Visuals/Loaders/Geometry/Extrude', tags: ['autodocs'], ...loaderMeta(LoaderExtrude, about) } satisfies Meta<typeof LoaderExtrude>

const s = loaderStories(LoaderExtrude)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
