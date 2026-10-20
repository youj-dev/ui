import { numberFormat } from '../../../lib/utils'
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
export function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

/** A point in the image, as fractions of its width and height. */
export interface ImageEditorPoint {
  x: number
  y: number
}

/** Everything about how the image is shown: save it with the image and reopen it with `defaultEdit`. */
export interface ImageEditorEdit {
  /** The chosen crop's id (`aspects`). */
  aspect: string
  /** Degrees clockwise: quarter turns and straightening together (−2.5, 90, 177.5). */
  rotation: number
  flipX: boolean
  flipY: boolean
  /** 1 is the image just covering the frame. */
  zoom: number
  /** The frame's center in the image. */
  center: ImageEditorPoint
  /** What matters most in the image, kept in view when it's cropped narrower or wider. */
  focal: ImageEditorPoint
  /** What the image shows, for people who can't see it. */
  alt: string
}

/** A crop to choose: `ratio` is width over height, or `original` for the image's own. */
export interface ImageEditorAspect {
  id: string
  label: string
  ratio: number | 'original'
}

/** A place the image appears, shown live as it's edited: `ratio` is width over height. */
export interface ImageEditorPreview {
  id: string
  label: string
  ratio: number
  /** Its height in the panel, in px. Default 64. */
  size?: number
}

/** What Save hands over. */
export interface ImageEditorResult {
  /** The image as framed: cropped, turned and flipped. */
  file: File
  width: number
  height: number
  /** The same framing in the source's pixels, for an image CDN: the crop's center and size, turned by `rotation` about its center. */
  region: { centerX: number; centerY: number; width: number; height: number; rotation: number; flipX: boolean; flipY: boolean }
  /** The focal point in the saved image, as fractions: a CSS `object-position` or a CDN's gravity. */
  focal: ImageEditorPoint
  alt: string
  /** The edit, to reopen it as it was. */
  edit: ImageEditorEdit
}

export type ImageEditorVariant = 'image' | 'cover' | 'avatar'

export const ASPECTS: ImageEditorAspect[] = [
  { id: 'original', label: 'Original', ratio: 'original' },
  { id: 'square', label: 'Square', ratio: 1 },
  { id: 'portrait', label: '4:5', ratio: 4 / 5 },
  { id: 'wide', label: '16:9', ratio: 16 / 9 },
]

/** Where the demo's photos are served from: the Youj site, so a copied block shows them in any app. */
const PHOTOS = 'https://www.youj.dev/blocks/products'

/** Each shape's frame, the places it appears, and what it starts with. */
export const VARIANTS: Record<
  ImageEditorVariant,
  {
    aspects: ImageEditorAspect[]
    previews: ImageEditorPreview[]
    src: string
    edit: Partial<ImageEditorEdit>
    maxOutput: number
    minDimensions?: { width: number; height: number }
  }
> = {
  image: {
    aspects: ASPECTS,
    previews: [
      { id: 'card', label: 'Card', ratio: 4 / 3 },
      { id: 'square', label: 'Grid', ratio: 1 },
      { id: 'story', label: 'Story', ratio: 9 / 16 },
      { id: 'banner', label: 'Banner', ratio: 3 },
    ],
    src: `${PHOTOS}/bud-vases.webp`,
    edit: {
      aspect: 'wide',
      rotation: -2,
      zoom: 1.12,
      center: { x: 0.5, y: 0.56 },
      focal: { x: 0.36, y: 0.62 },
      alt: 'Three white ceramic bud vases in a row on a pale grey surface.',
    },
    maxOutput: 2400,
  },
  cover: {
    aspects: [{ id: 'cover', label: '3:1', ratio: 3 }],
    previews: [
      { id: 'desktop', label: 'Desktop', ratio: 3, size: 52 },
      { id: 'tablet', label: 'Tablet', ratio: 2, size: 64 },
      { id: 'phone', label: 'Phone', ratio: 4 / 3, size: 72 },
    ],
    src: `${PHOTOS}/bud-vases.webp`,
    edit: { aspect: 'cover', center: { x: 0.5, y: 0.58 }, focal: { x: 0.34, y: 0.6 }, alt: 'Three white ceramic bud vases in a row.' },
    maxOutput: 3000,
    minDimensions: { width: 1200, height: 400 },
  },
  avatar: {
    aspects: [{ id: 'avatar', label: '1:1', ratio: 1 }],
    previews: [
      { id: 'profile', label: 'Profile', ratio: 1, size: 72 },
      { id: 'comment', label: 'Comment', ratio: 1, size: 32 },
      { id: 'mention', label: 'Mention', ratio: 1, size: 20 },
    ],
    src: `${PHOTOS}/mug.webp`,
    edit: { aspect: 'avatar', zoom: 1.35, center: { x: 0.5, y: 0.55 }, alt: 'A white mug.' },
    maxOutput: 512,
    minDimensions: { width: 256, height: 256 },
  },
}

export const DEFAULT_COPY = {
  title: 'Edit image',
  description: 'Crop, straighten and set what matters most. The previews show it everywhere it appears.',
  avatarTitle: 'Profile photo',
  avatarDescription: 'Move and zoom until it sits right in the circle.',
  coverTitle: 'Cover image',
  coverDescription: 'Wide screens show it all; narrower ones crop it around the focal point.',
  replace: 'Replace',
  remove: 'Remove',
  /** The stage. */
  stage: 'Image',
  stageRole: 'crop area',
  stageKeys: 'Drag or use the arrow keys to move it, scroll or press + and − to zoom, [ and ] to straighten, R to turn, H and V to flip, 0 to reset.',
  hint: 'Drag to move · Scroll to zoom',
  focal: 'Focal point',
  focalKeys: 'Drag it, or use the arrow keys, onto what matters most.',
  focalAt: (x: number, y: number) => `${x}% from the left, ${y}% from the top`,
  /** The controls. */
  crop: 'Crop',
  straighten: 'Straighten',
  degrees: (value: string) => `${value}°`,
  zoom: 'Zoom',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  rotateLeft: 'Turn left',
  rotateRight: 'Turn right',
  flipHorizontal: 'Flip horizontally',
  flipVertical: 'Flip vertically',
  reset: 'Reset',
  previews: 'Where it appears',
  /** Alt text. */
  alt: 'Alt text',
  altHint: 'Say what matters in the image for people who can’t see it. Leave it empty only if it’s decoration.',
  altCount: (count: number, max: number) => `${count}/${max}`,
  /** The footer. */
  output: (width: number, height: number, format: string) => `Saves ${width} × ${height} ${format}`,
  save: 'Save image',
  saving: 'Saving…',
  saved: 'Saved',
  saveFailed: 'Couldn’t save',
  /** Empty, loading and broken. */
  emptyTitle: 'Drop an image here',
  emptyHint: (modifier: string) => `or browse, or paste with ${modifier}V`,
  emptyRules: (types: string, size: string) => `${types} · up to ${size}`,
  minRule: (width: number, height: number) => `at least ${width} × ${height} px`,
  loading: 'Opening the image…',
  broken: 'This image couldn’t be opened.',
  chooseAnother: 'Choose another',
  notAnImage: (name: string) => `${name} isn’t an image this takes.`,
  tooLarge: (name: string, size: string, max: string) => `${name} is ${size}, over the ${max} limit.`,
  tooSmall: (name: string, width: number, height: number, min: string) => `${name} is ${width} × ${height} px; it needs ${min}.`,
  /** Announced. */
  turned: (degrees: number) => `Turned to ${degrees}°`,
  flipped: 'Flipped',
  removed: 'Image removed',
}

export type ImageEditorCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its numbers are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte']

/** Bytes in the locale: "6.8 MB" (1024 to the kilobyte, as limits are written). */
export function formatBytes(bytes: number, locale: string) {
  const i = Math.min(UNITS.length - 1, Math.max(0, Math.floor(Math.log(Math.max(1, bytes)) / Math.log(1024))))
  const value = bytes / 1024 ** i
  return numberFormat(locale, {
    style: 'unit',
    unit: UNITS[i],
    unitDisplay: i === 0 ? 'long' : 'short',
    maximumFractionDigits: i > 0 && value < 100 ? 1 : 0,
  }).format(value)
}
