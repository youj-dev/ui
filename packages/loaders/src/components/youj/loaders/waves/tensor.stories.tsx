import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderTensor, meta as about } from './tensor'

export default { title: 'Visuals/Loaders/Waves/Tensor', tags: ['autodocs'], ...loaderMeta(LoaderTensor, about) } satisfies Meta<typeof LoaderTensor>

const s = loaderStories(LoaderTensor)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
