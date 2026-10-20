import { IconGalleryView } from '@/components/mdx-lazy'

/** The docs pages' compact way into the icons explorer. `type="morph"` shows state icons and opens the explorer’s morph pairs. */
export function IconGallery({ type }: { type?: 'morph' }) {
  return <IconGalleryView type={type} />
}
