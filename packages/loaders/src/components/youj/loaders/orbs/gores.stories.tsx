import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderGores, meta as about } from './gores'

export default { title: 'Visuals/Loaders/Orbs/Gores', tags: ['autodocs'], ...loaderMeta(LoaderGores, about) } satisfies Meta<typeof LoaderGores>

const s = loaderStories(LoaderGores)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
