import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderDocket, meta as about } from './docket'

export default { title: 'Visuals/Loaders/Interface/Docket', tags: ['autodocs'], ...loaderMeta(LoaderDocket, about) } satisfies Meta<typeof LoaderDocket>

const s = loaderStories(LoaderDocket)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
