import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderValence, meta as about } from './valence'

export default { title: 'Visuals/Loaders/Science/Valence', tags: ['autodocs'], ...loaderMeta(LoaderValence, about) } satisfies Meta<typeof LoaderValence>

const s = loaderStories(LoaderValence)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
