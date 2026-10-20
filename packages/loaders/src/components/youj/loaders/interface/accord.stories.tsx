import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderAccord, meta as about } from './accord'

export default { title: 'Visuals/Loaders/Interface/Accord', tags: ['autodocs'], ...loaderMeta(LoaderAccord, about, 'Solving constraints') } satisfies Meta<typeof LoaderAccord>

const s = loaderStories(LoaderAccord)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
