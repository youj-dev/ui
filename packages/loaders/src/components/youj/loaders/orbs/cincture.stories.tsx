import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderCincture, meta as about } from './cincture'

export default { title: 'Visuals/Loaders/Orbs/Cincture', tags: ['autodocs'], ...loaderMeta(LoaderCincture, about) } satisfies Meta<typeof LoaderCincture>

const s = loaderStories(LoaderCincture)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
