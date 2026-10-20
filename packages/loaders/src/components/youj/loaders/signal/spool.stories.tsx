import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderSpool, meta as about } from './spool'

export default { title: 'Visuals/Loaders/Signal/Spool', tags: ['autodocs'], ...loaderMeta(LoaderSpool, about) } satisfies Meta<typeof LoaderSpool>

const s = loaderStories(LoaderSpool)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
