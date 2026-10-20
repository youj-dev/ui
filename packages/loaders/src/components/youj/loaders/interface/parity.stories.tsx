import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderParity, meta as about } from './parity'

export default { title: 'Visuals/Loaders/Interface/Parity', tags: ['autodocs'], ...loaderMeta(LoaderParity, about) } satisfies Meta<typeof LoaderParity>

const s = loaderStories(LoaderParity)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
