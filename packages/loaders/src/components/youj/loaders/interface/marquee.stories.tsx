import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderMarquee, meta as about } from './marquee'

export default { title: 'Visuals/Loaders/Interface/Marquee', tags: ['autodocs'], ...loaderMeta(LoaderMarquee, about) } satisfies Meta<typeof LoaderMarquee>

const s = loaderStories(LoaderMarquee)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
