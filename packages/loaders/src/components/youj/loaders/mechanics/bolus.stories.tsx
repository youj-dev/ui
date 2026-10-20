import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderBolus, meta as about } from './bolus'

export default { title: 'Visuals/Loaders/Mechanics/Bolus', tags: ['autodocs'], ...loaderMeta(LoaderBolus, about) } satisfies Meta<typeof LoaderBolus>

const s = loaderStories(LoaderBolus)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
