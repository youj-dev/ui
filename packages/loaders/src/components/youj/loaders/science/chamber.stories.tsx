import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderChamber, meta as about } from './chamber'

export default { title: 'Visuals/Loaders/Science/Chamber', tags: ['autodocs'], ...loaderMeta(LoaderChamber, about) } satisfies Meta<typeof LoaderChamber>

const s = loaderStories(LoaderChamber)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
