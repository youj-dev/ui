import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderHeddle, meta as about } from './heddle'

export default { title: 'Visuals/Loaders/Mechanics/Heddle', tags: ['autodocs'], ...loaderMeta(LoaderHeddle, about) } satisfies Meta<typeof LoaderHeddle>

const s = loaderStories(LoaderHeddle)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
