import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderFringe, meta as about } from './fringe'

export default { title: 'Visuals/Loaders/Signal/Fringe', tags: ['autodocs'], ...loaderMeta(LoaderFringe, about) } satisfies Meta<typeof LoaderFringe>

const s = loaderStories(LoaderFringe)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
