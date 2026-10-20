import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderMurmur, meta as about } from './murmur'

export default { title: 'Visuals/Loaders/Depth/Murmur', tags: ['autodocs'], ...loaderMeta(LoaderMurmur, about) } satisfies Meta<typeof LoaderMurmur>

const s = loaderStories(LoaderMurmur)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
