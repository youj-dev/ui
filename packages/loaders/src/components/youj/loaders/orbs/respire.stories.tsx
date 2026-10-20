import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderRespire, meta as about } from './respire'

export default { title: 'Visuals/Loaders/Orbs/Respire', tags: ['autodocs'], ...loaderMeta(LoaderRespire, about) } satisfies Meta<typeof LoaderRespire>

const s = loaderStories(LoaderRespire)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
