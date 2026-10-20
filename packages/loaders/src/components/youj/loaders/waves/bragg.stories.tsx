import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderBragg, meta as about } from './bragg'

export default { title: 'Visuals/Loaders/Waves/Bragg', tags: ['autodocs'], ...loaderMeta(LoaderBragg, about) } satisfies Meta<typeof LoaderBragg>

const s = loaderStories(LoaderBragg)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
