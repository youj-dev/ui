import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderDescent, meta as about } from './descent'

export default { title: 'Visuals/Loaders/Signal/Descent', tags: ['autodocs'], ...loaderMeta(LoaderDescent, about, 'Optimizing model') } satisfies Meta<typeof LoaderDescent>

const s = loaderStories(LoaderDescent, { hero: 'A product status and an inline task at their working sizes.' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
