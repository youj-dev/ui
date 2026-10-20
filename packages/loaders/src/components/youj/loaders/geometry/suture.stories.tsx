import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderSuture, meta as about } from './suture'

export default { title: 'Visuals/Loaders/Geometry/Suture', tags: ['autodocs'], ...loaderMeta(LoaderSuture, about) } satisfies Meta<typeof LoaderSuture>

const s = loaderStories(LoaderSuture)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
