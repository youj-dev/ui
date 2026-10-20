import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderFulcrum, meta as about } from './fulcrum'

export default { title: 'Visuals/Loaders/Mechanics/Fulcrum', tags: ['autodocs'], ...loaderMeta(LoaderFulcrum, about) } satisfies Meta<typeof LoaderFulcrum>

const s = loaderStories(LoaderFulcrum)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
