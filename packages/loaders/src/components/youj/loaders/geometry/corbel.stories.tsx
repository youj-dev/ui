import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderCorbel, meta as about } from './corbel'

export default { title: 'Visuals/Loaders/Geometry/Corbel', tags: ['autodocs'], ...loaderMeta(LoaderCorbel, about) } satisfies Meta<typeof LoaderCorbel>

const s = loaderStories(LoaderCorbel, { hero: 'Building your project in a product workspace and its task list.', heroLabel: 'Building your project' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
