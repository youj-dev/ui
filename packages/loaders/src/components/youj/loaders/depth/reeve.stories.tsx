import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderReeve, meta as about } from './reeve'

export default { title: 'Visuals/Loaders/Depth/Reeve', tags: ['autodocs'], ...loaderMeta(LoaderReeve, about) } satisfies Meta<typeof LoaderReeve>

const s = loaderStories(LoaderReeve)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
