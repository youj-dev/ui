import { download, rasterize } from '@/components/illustrations/export'
import type { IconEntry } from './catalog'
import { svgJsx, svgMarkup } from './static-svg'

/* An icon taken home as a file: the SVG at rest, a PNG of it, or a React
 * component of the drawing with no dependency. A file can't read the page's
 * tokens, so a token color (the accent, a status) is written as the color
 * it is on the page; Default stays currentColor in SVG and JSX, so the file
 * takes its color from where it's used, and a PNG, which has to be some
 * color, is drawn in the page's text color. Loaded on the first download. */

export type IconFileKind = 'svg' | 'png' | 'tsx'

/** A PNG is drawn at four times the icon's size, so it stays sharp on a slide or in a design file. */
export const PNG_SCALE = 4

/** Any CSS color the page can paint, as #rrggbb. */
export function hexOf(color: string): string {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return '#000000'
  ctx.fillStyle = '#000'
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return `#${[r!, g!, b!].map((n) => n.toString(16).padStart(2, '0')).join('')}`
}

const pascal = (name: string) => name.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase())

/** The drawing as a component file: the JSX with the props spread on its <svg>. */
export function componentFile(name: string, jsx: string): string {
  const body = jsx.replace(/^<svg([^>]*)>/, '<svg$1 {...props}>').replace(/\n/g, '\n    ')
  return `import type { SVGProps } from 'react'\n\nexport function ${name}(props: SVGProps<SVGSVGElement>) {\n  return (\n    ${body}\n  )\n}\n`
}

interface FileOptions {
  size: number
  strokeWidth: number
  /** The color to draw with: a hex, or undefined for currentColor. */
  color?: string
  /** What currentColor is on the page, for the PNG. */
  text: string
}

/** Makes the file and saves it. Returns its name. */
export async function saveIcon(entry: IconEntry, kind: IconFileKind, options: FileOptions): Promise<string> {
  const nodes = entry.nodes
  const base = `youj-${entry.name}`
  const svgOptions = { size: options.size, strokeWidth: options.strokeWidth, color: options.color }
  if (kind === 'svg') {
    const name = `${base}.svg`
    download(svgMarkup(nodes, svgOptions) + '\n', name)
    return name
  }
  if (kind === 'tsx') {
    const component = `${pascal(entry.name)}Icon`
    const name = `${component}.tsx`
    download(componentFile(component, svgJsx(nodes, svgOptions)), name, 'text/plain')
    return name
  }
  const px = options.size * PNG_SCALE
  const markup = svgMarkup(nodes, { ...svgOptions, size: px, color: options.color ?? options.text })
  const name = `${base}@${PNG_SCALE}x.png`
  download(await rasterize(markup, px, px), name)
  return name
}
