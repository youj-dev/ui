import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderCleave, meta as about } from './cleave'

export default { title: 'Visuals/Loaders/Orbs/Cleave', tags: ['autodocs'], ...loaderMeta(LoaderCleave, about) } satisfies Meta<typeof LoaderCleave>

const s = loaderStories(LoaderCleave)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
