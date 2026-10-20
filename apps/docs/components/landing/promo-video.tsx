import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { promoUrl, type Media } from '@/lib/media'

export interface PromoSource {
  src: string
  type: string
  /** The screens this encode is for (a media query); every screen when absent. The player checks it, since browsers ignore it on video. */
  media?: string
}

/** A poster's srcset in each format that was made (`avif`, `webp`, the `jpg` fallback), its small size first. */
export type PosterSet = Partial<Record<'avif' | 'webp' | 'jpg', string>>

/** The parts of the kit, each with a short loop of its own. */
export type TopicId = 'icons' | 'themes' | 'motion' | 'components' | 'illustrations' | 'sound' | 'entrances'

/** One cut of a topic loop: its encodings (the best a browser can play first), its poster (its first frame) and its size. */
export interface LoopClip {
  sources: PromoSource[]
  poster: string
  /** The poster in each modern format, at each size; `poster` is the JPG fallback. */
  posterSet?: PosterSet
  width: number
  height: number
}

/**
 * A topic's loop: `wide` (16:9) for its docs overview, `tile` (a 2.5:1 strip
 * whose middle is safe to crop to) in each scheme for a homepage tile, and
 * `title`, what it shows, for its accessible label. The site publishes only
 * `wide`: the strip is optional, and `<Family>` draws a live sketch without it.
 */
export interface TopicLoop {
  title: string
  wide?: LoopClip
  tile?: { dark?: LoopClip; light?: LoopClip }
}

/** The homepage's film: a seamless 16:9 loop in each scheme, and `title`, what it shows, for its accessible label. */
export interface HomeFilm {
  title: string
  dark: LoopClip
  light?: LoopClip
}

/* The shape apps/promo writes to public/promo/manifest.json (its files are on the media host: scripts/media-upload.ts). */
interface ManifestVideo {
  title?: string
  duration?: number
  loop?: boolean
  width?: number
  height?: number
  sources: PromoSource[]
  poster?: { src: string; srcset?: PosterSet }
}
export interface Manifest {
  videos?: Record<string, ManifestVideo>
  /** Each topic's loops, by cut: video names in `videos`. Only `wide` is published; `tall` and `tile` are optional, and apps/promo keeps them local. */
  loops?: Partial<Record<string, { wide?: string; tall?: string; tile?: { dark?: string; light?: string } }>>
  /** The homepage's film, by scheme: video names in `videos`. */
  home?: { dark?: string; light?: string }
}

/** A published video as a loop's cut, or undefined when it (or its poster) is missing. */
function cutOf(videos: Record<string, ManifestVideo>, name?: string): LoopClip | undefined {
  const video = name ? videos[name] : undefined
  if (!video?.sources?.length || !video.poster) return undefined
  // The JPG set is left out: every browser that reads srcset reads AVIF or WebP too, and the page carries each URL twice.
  const set = video.poster.srcset
  // Only what the player reads: the manifest's byte sizes would ride along to the browser for nothing.
  const sources = video.sources.map(({ src, type, media }) => ({ src, type, ...(media && { media }) }))
  return { sources, poster: video.poster.src, ...(set && { posterSet: { avif: set.avif, webp: set.webp } }), width: video.width ?? 16, height: video.height ?? 9 }
}

const TOPICS: TopicId[] = ['icons', 'themes', 'motion', 'components', 'illustrations', 'sound', 'entrances']

/** Each topic's loop the manifest names, with the cuts it has. A cut whose video is missing is left out. */
export function loopsFromManifest(manifest: Manifest): Partial<Record<TopicId, TopicLoop>> {
  const videos = manifest.videos ?? {}
  const loops: Partial<Record<TopicId, TopicLoop>> = {}
  for (const topic of TOPICS) {
    const names = manifest.loops?.[topic]
    if (!names) continue
    const wide = cutOf(videos, names.wide)
    const tile = { dark: cutOf(videos, names.tile?.dark), light: cutOf(videos, names.tile?.light) }
    const title = [names.wide, names.tile?.dark, names.tile?.light].map((name) => name && videos[name]?.title).find(Boolean)
    if (!title || (!wide && !tile.dark && !tile.light)) continue
    loops[topic] = { title, wide, tile: tile.dark || tile.light ? tile : undefined }
  }
  return loops
}

/**
 * The homepage's film the manifest names, in each scheme it was rendered in.
 * Either cut stands in for the other when only one is published; without
 * either (or a title) there is no film.
 */
export function homeFromManifest(manifest: Manifest): HomeFilm | null {
  const videos = manifest.videos ?? {}
  const dark = cutOf(videos, manifest.home?.dark)
  const light = cutOf(videos, manifest.home?.light)
  const title = [manifest.home?.dark, manifest.home?.light].map((name) => name && videos[name]?.title).find(Boolean)
  if (!title || !(dark ?? light)) return null
  return { title, dark: (dark ?? light)!, light: dark ? light : undefined }
}

/**
 * The manifest with each file's URL on the media host. A file that isn't on R2 is dropped, so a video without
 * a source or a poster is left out (as one that was never rendered is).
 */
export function onMediaHost(manifest: Manifest, files?: Media['files']): Manifest {
  const url = (path: string) => promoUrl(path, files)
  const set = (srcset: string) =>
    srcset
      .split(',')
      .map((candidate) => {
        const [path, ...rest] = candidate.trim().split(/\s+/)
        const resolved = url(path!)
        return resolved && [resolved, ...rest].join(' ')
      })
      .filter(Boolean)
      .join(', ')
  const videos = Object.fromEntries(
    Object.entries(manifest.videos ?? {}).map(([name, video]) => {
      const poster = video.poster && url(video.poster.src)
      const srcset = Object.fromEntries(Object.entries(video.poster?.srcset ?? {}).map(([format, value]) => [format, set(value)]).filter(([, value]) => value))
      return [
        name,
        {
          ...video,
          sources: video.sources.flatMap((source) => {
            const src = url(source.src)
            return src ? [{ ...source, src }] : []
          }),
          poster: poster ? { src: poster, srcset } : undefined,
        },
      ]
    }),
  )
  return { ...manifest, videos }
}

function readManifest(): Manifest {
  return onMediaHost(JSON.parse(readFileSync(join(process.cwd(), 'public/promo/manifest.json'), 'utf8')) as Manifest)
}

/** The topic loops in public/promo's manifest, read at build time. Empty without a manifest. */
export function readLoops(): Partial<Record<TopicId, TopicLoop>> {
  try {
    return loopsFromManifest(readManifest())
  } catch {
    return {}
  }
}

/** The homepage's film in public/promo's manifest, read at build time. Null without one. */
export function readHomeFilm(): HomeFilm | null {
  try {
    return homeFromManifest(readManifest())
  } catch {
    return null
  }
}
