import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderBlossom, meta as about } from './blossom'

export default { title: 'Visuals/Loaders/Signal/Blossom', tags: ['autodocs'], ...loaderMeta(LoaderBlossom, about) } satisfies Meta<typeof LoaderBlossom>

const s = loaderStories(LoaderBlossom)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
