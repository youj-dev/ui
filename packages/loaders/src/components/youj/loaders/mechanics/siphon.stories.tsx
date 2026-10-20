import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderSiphon, meta as about } from './siphon'

export default { title: 'Visuals/Loaders/Mechanics/Siphon', tags: ['autodocs'], ...loaderMeta(LoaderSiphon, about) } satisfies Meta<typeof LoaderSiphon>

const s = loaderStories(LoaderSiphon)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
