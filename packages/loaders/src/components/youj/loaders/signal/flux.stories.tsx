import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderFlux, meta as about } from './flux'

export default { title: 'Visuals/Loaders/Signal/Flux', tags: ['autodocs'], ...loaderMeta(LoaderFlux, about) } satisfies Meta<typeof LoaderFlux>

const s = loaderStories(LoaderFlux)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
