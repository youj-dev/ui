import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderFacet, meta as about } from './facet'

export default { title: 'Visuals/Loaders/Geometry/Facet', tags: ['autodocs'], ...loaderMeta(LoaderFacet, about) } satisfies Meta<typeof LoaderFacet>

const s = loaderStories(LoaderFacet)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
