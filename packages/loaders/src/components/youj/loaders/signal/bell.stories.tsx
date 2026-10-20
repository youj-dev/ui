import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderBell, meta as about } from './bell'

export default { title: 'Visuals/Loaders/Signal/Bell', tags: ['autodocs'], ...loaderMeta(LoaderBell, about) } satisfies Meta<typeof LoaderBell>

const s = loaderStories(LoaderBell)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
