import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderEvanesce, meta as about } from './evanesce'

export default { title: 'Visuals/Loaders/Waves/Evanesce', tags: ['autodocs'], ...loaderMeta(LoaderEvanesce, about) } satisfies Meta<typeof LoaderEvanesce>

const s = loaderStories(LoaderEvanesce)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
