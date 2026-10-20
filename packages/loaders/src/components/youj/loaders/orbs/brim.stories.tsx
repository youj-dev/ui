import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderBrim, meta as about } from './brim'

export default { title: 'Visuals/Loaders/Orbs/Brim', tags: ['autodocs'], ...loaderMeta(LoaderBrim, about) } satisfies Meta<typeof LoaderBrim>

const s = loaderStories(LoaderBrim)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
