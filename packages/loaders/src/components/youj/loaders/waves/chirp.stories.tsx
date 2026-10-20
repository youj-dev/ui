import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderChirp, meta as about } from './chirp'

export default { title: 'Visuals/Loaders/Waves/Chirp', tags: ['autodocs'], ...loaderMeta(LoaderChirp, about) } satisfies Meta<typeof LoaderChirp>

const s = loaderStories(LoaderChirp)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
