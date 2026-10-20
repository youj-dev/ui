import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderBuild, meta as about } from './build'

export default { title: 'Visuals/Loaders/Interface/Build', tags: ['autodocs'], ...loaderMeta(LoaderBuild, about) } satisfies Meta<typeof LoaderBuild>

const s = loaderStories(LoaderBuild)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
