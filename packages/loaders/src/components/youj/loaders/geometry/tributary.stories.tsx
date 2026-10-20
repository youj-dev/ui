import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderTributary, meta as about } from './tributary'

export default { title: 'Visuals/Loaders/Geometry/Tributary', tags: ['autodocs'], ...loaderMeta(LoaderTributary, about) } satisfies Meta<typeof LoaderTributary>

const s = loaderStories(LoaderTributary)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
