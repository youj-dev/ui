import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderEntail, meta as about } from './entail'

export default { title: 'Visuals/Loaders/Interface/Entail', tags: ['autodocs'], ...loaderMeta(LoaderEntail, about) } satisfies Meta<typeof LoaderEntail>

const s = loaderStories(LoaderEntail)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
