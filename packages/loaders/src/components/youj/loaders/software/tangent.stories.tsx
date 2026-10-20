import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderTangent, meta as about } from './tangent'

export default { title: 'Visuals/Loaders/Software/Tangent', tags: ['autodocs'], ...loaderMeta(LoaderTangent, about) } satisfies Meta<typeof LoaderTangent>

const s = loaderStories(LoaderTangent, { hero: 'Software at work, using the shared application context.' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
