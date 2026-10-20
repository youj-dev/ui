import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderPipette, meta as about } from './pipette'

export default { title: 'Visuals/Loaders/Software/Pipette', tags: ['autodocs'], ...loaderMeta(LoaderPipette, about) } satisfies Meta<typeof LoaderPipette>

const s = loaderStories(LoaderPipette, { hero: 'Software at work, using the shared application context.' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
