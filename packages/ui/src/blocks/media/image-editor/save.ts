import type { ImageEditorEdit, ImageEditorResult } from './data'
import { clamp, render, toFrame, type Placement, type Size } from './geometry'

/* Save: the framing drawn on a canvas at its output size (what isn't image
 * is white in a JPEG), encoded, and handed over with the same framing in the
 * source's pixels (for an image CDN), the focal point as fractions of the
 * saved image, the alt text and the edit to reopen it. */

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' }

/** The rotation written between −180° and 180°. */
export const normalized = (edit: ImageEditorEdit): ImageEditorEdit => ({ ...edit, rotation: ((((edit.rotation + 180) % 360) + 360) % 360) - 180 })

interface SaveInput {
  image: HTMLImageElement
  natural: Size
  frame: Size
  placed: Placement
  out: Size
  edit: ImageEditorEdit
  name: string
  type: 'image/jpeg' | 'image/webp' | 'image/png'
  quality: number
  failed: string
}

export async function framed({ image, natural, frame, placed, out, edit, name, type, quality, failed }: SaveInput): Promise<ImageEditorResult> {
  const canvas = render(image, natural, frame, placed, out, type === 'image/jpeg')
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
  if (!blob) throw new Error(failed)
  const at = toFrame(edit.focal, natural, placed)
  const saved = normalized(edit)
  return {
    file: new File([blob], `${name}-edited.${EXT[type]}`, { type }),
    width: out.width,
    height: out.height,
    region: {
      centerX: edit.center.x * natural.width,
      centerY: edit.center.y * natural.height,
      width: frame.width / placed.scale,
      height: frame.height / placed.scale,
      rotation: saved.rotation,
      flipX: edit.flipX,
      flipY: edit.flipY,
    },
    focal: { x: clamp(at.x / frame.width + 0.5, 0, 1), y: clamp(at.y / frame.height + 0.5, 0, 1) },
    alt: edit.alt,
    edit: saved,
  }
}
