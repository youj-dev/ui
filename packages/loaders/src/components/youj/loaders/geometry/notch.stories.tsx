import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderNotch, meta as about } from './notch'

export default { title: 'Visuals/Loaders/Geometry/Notch', tags: ['autodocs'], ...loaderMeta(LoaderNotch, about) } satisfies Meta<typeof LoaderNotch>

const s = loaderStories(LoaderNotch, { hero: 'Generating a mesh in a product workspace and its task list.', heroLabel: 'Generating a mesh' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
