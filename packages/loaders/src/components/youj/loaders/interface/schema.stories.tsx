import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderSchema, meta as about } from './schema'

export default { title: 'Visuals/Loaders/Interface/Schema', tags: ['autodocs'], ...loaderMeta(LoaderSchema, about) } satisfies Meta<typeof LoaderSchema>

const s = loaderStories(LoaderSchema)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
