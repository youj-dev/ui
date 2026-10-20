import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderLeader, meta as about } from './leader'

export default { title: 'Visuals/Loaders/Signal/Leader', tags: ['autodocs'], ...loaderMeta(LoaderLeader, about) } satisfies Meta<typeof LoaderLeader>

const s = loaderStories(LoaderLeader)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
