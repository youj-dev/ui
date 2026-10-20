import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderEnvelope, meta as about } from './envelope'

export default { title: 'Visuals/Loaders/Geometry/Envelope', tags: ['autodocs'], ...loaderMeta(LoaderEnvelope, about, 'Resolving boundaries') } satisfies Meta<typeof LoaderEnvelope>

const s = loaderStories(LoaderEnvelope)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
