import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderSounding, meta as about } from './sounding'

export default { title: 'Visuals/Loaders/Waves/Sounding', tags: ['autodocs'], ...loaderMeta(LoaderSounding, about) } satisfies Meta<typeof LoaderSounding>

const s = loaderStories(LoaderSounding)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
