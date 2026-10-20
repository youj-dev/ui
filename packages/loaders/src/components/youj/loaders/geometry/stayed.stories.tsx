import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderStayed, meta as about } from './stayed'

export default { title: 'Visuals/Loaders/Geometry/Stayed', tags: ['autodocs'], ...loaderMeta(LoaderStayed, about, 'Building span') } satisfies Meta<typeof LoaderStayed>

const s = loaderStories(LoaderStayed, { hero: 'A product status and an inline task at their working sizes.' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
