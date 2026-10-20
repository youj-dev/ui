import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderMeasure, meta as about } from './measure'

export default { title: 'Visuals/Loaders/Interface/Measure', tags: ['autodocs'], ...loaderMeta(LoaderMeasure, about) } satisfies Meta<typeof LoaderMeasure>

const s = loaderStories(LoaderMeasure)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
