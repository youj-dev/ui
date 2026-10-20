import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderArris, meta as about } from './arris'

export default { title: 'Visuals/Loaders/Geometry/Arris', tags: ['autodocs'], ...loaderMeta(LoaderArris, about) } satisfies Meta<typeof LoaderArris>

const s = loaderStories(LoaderArris, { hero: 'Finishing the model in a product workspace and its task list.', heroLabel: 'Finishing the model' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
