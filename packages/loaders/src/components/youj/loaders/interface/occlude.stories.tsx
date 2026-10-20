import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderOcclude, meta as about } from './occlude'

export default { title: 'Visuals/Loaders/Interface/Occlude', tags: ['autodocs'], ...loaderMeta(LoaderOcclude, about) } satisfies Meta<typeof LoaderOcclude>

const s = loaderStories(LoaderOcclude)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
