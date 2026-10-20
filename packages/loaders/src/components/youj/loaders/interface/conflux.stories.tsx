import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderConflux, meta as about } from './conflux'

export default { title: 'Visuals/Loaders/Interface/Conflux', tags: ['autodocs'], ...loaderMeta(LoaderConflux, about) } satisfies Meta<typeof LoaderConflux>

const s = loaderStories(LoaderConflux)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
