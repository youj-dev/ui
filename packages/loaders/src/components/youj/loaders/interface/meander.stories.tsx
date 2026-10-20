import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderMeander, meta as about } from './meander'

export default { title: 'Visuals/Loaders/Interface/Meander', tags: ['autodocs'], ...loaderMeta(LoaderMeander, about) } satisfies Meta<typeof LoaderMeander>

const s = loaderStories(LoaderMeander)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
