import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderHarmonics, meta as about } from './harmonics'

export default { title: 'Visuals/Loaders/Signal/Harmonics', tags: ['autodocs'], ...loaderMeta(LoaderHarmonics, about) } satisfies Meta<typeof LoaderHarmonics>

const s = loaderStories(LoaderHarmonics)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
