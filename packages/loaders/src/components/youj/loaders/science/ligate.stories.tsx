import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderLigate, meta as about } from './ligate'

export default { title: 'Visuals/Loaders/Science/Ligate', tags: ['autodocs'], ...loaderMeta(LoaderLigate, about) } satisfies Meta<typeof LoaderLigate>

const s = loaderStories(LoaderLigate)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
