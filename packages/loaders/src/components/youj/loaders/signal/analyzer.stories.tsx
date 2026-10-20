import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderAnalyzer, meta as about } from './analyzer'

export default { title: 'Visuals/Loaders/Signal/Analyzer', tags: ['autodocs'], ...loaderMeta(LoaderAnalyzer, about) } satisfies Meta<typeof LoaderAnalyzer>

const s = loaderStories(LoaderAnalyzer)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
