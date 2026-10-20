import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderDatum, meta as about } from './datum'

export default { title: 'Visuals/Loaders/Geometry/Datum', tags: ['autodocs'], ...loaderMeta(LoaderDatum, about) } satisfies Meta<typeof LoaderDatum>

const s = loaderStories(LoaderDatum, { hero: 'Generating a map in a product workspace and its task list.', heroLabel: 'Generating a map' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
