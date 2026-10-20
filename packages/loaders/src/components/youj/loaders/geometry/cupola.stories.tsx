import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderCupola, meta as about } from './cupola'

export default { title: 'Visuals/Loaders/Geometry/Cupola', tags: ['autodocs'], ...loaderMeta(LoaderCupola, about, 'Assembling the shell') } satisfies Meta<typeof LoaderCupola>

const s = loaderStories(LoaderCupola)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
