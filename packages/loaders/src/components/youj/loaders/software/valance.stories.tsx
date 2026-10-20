import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderValance, meta as about } from './valance'

export default { title: 'Visuals/Loaders/Software/Valance', tags: ['autodocs'], ...loaderMeta(LoaderValance, about) } satisfies Meta<typeof LoaderValance>

const s = loaderStories(LoaderValance, { hero: 'Software at work, using the shared application context.' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
