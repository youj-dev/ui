import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderDuplex, meta as about } from './duplex'

export default { title: 'Visuals/Loaders/Waves/Duplex', tags: ['autodocs'], ...loaderMeta(LoaderDuplex, about) } satisfies Meta<typeof LoaderDuplex>

const s = loaderStories(LoaderDuplex)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
