import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderSection, meta as about } from './section'

export default { title: 'Visuals/Loaders/Geometry/Section', tags: ['autodocs'], ...loaderMeta(LoaderSection, about) } satisfies Meta<typeof LoaderSection>

const s = loaderStories(LoaderSection)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
