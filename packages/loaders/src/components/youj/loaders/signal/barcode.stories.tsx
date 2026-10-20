import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderBarcode, meta as about } from './barcode'

export default { title: 'Visuals/Loaders/Signal/Barcode', tags: ['autodocs'], ...loaderMeta(LoaderBarcode, about) } satisfies Meta<typeof LoaderBarcode>

const s = loaderStories(LoaderBarcode)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
