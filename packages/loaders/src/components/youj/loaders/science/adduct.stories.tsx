import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderAdduct, meta as about } from './adduct'

export default { title: 'Visuals/Loaders/Science/Adduct', tags: ['autodocs'], ...loaderMeta(LoaderAdduct, about) } satisfies Meta<typeof LoaderAdduct>

const s = loaderStories(LoaderAdduct)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
