import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderTittle, meta as about } from './tittle'

export default { title: 'Visuals/Loaders/Depth/Tittle', tags: ['autodocs'], ...loaderMeta(LoaderTittle, about) } satisfies Meta<typeof LoaderTittle>

const s = loaderStories(LoaderTittle)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
