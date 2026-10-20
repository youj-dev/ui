import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderFathom, meta as about } from './fathom'

export default { title: 'Visuals/Loaders/Interface/Fathom', tags: ['autodocs'], ...loaderMeta(LoaderFathom, about) } satisfies Meta<typeof LoaderFathom>

const s = loaderStories(LoaderFathom)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
