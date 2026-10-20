import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderPivot, meta as about } from './pivot'

export default { title: 'Visuals/Loaders/Interface/Pivot', tags: ['autodocs'], ...loaderMeta(LoaderPivot, about) } satisfies Meta<typeof LoaderPivot>

const s = loaderStories(LoaderPivot)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
