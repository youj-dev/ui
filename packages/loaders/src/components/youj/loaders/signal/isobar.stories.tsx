import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderIsobar, meta as about } from './isobar'

export default { title: 'Visuals/Loaders/Signal/Isobar', tags: ['autodocs'], ...loaderMeta(LoaderIsobar, about) } satisfies Meta<typeof LoaderIsobar>

const s = loaderStories(LoaderIsobar)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
