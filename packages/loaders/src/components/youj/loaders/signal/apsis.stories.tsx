import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderApsis, meta as about } from './apsis'

export default { title: 'Visuals/Loaders/Signal/Apsis', tags: ['autodocs'], ...loaderMeta(LoaderApsis, about) } satisfies Meta<typeof LoaderApsis>

const s = loaderStories(LoaderApsis)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
