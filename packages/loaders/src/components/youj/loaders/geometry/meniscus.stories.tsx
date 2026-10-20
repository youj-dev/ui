import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderMeniscus, meta as about } from './meniscus'

export default { title: 'Visuals/Loaders/Geometry/Meniscus', tags: ['autodocs'], ...loaderMeta(LoaderMeniscus, about) } satisfies Meta<typeof LoaderMeniscus>

const s = loaderStories(LoaderMeniscus)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
