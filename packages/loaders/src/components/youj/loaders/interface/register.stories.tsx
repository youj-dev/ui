import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderRegister, meta as about } from './register'

export default { title: 'Visuals/Loaders/Interface/Register', tags: ['autodocs'], ...loaderMeta(LoaderRegister, about) } satisfies Meta<typeof LoaderRegister>

const s = loaderStories(LoaderRegister)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
