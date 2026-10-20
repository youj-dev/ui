import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import media from '@/lib/media.json'
import { readHomeFilm, readLoops, type LoopClip } from './promo-video'

/* public/promo holds the manifest and the OG image, and nothing else: the videos and posters are on R2 (scripts/media-upload.ts),
 * and lib/media.json says which. What apps/promo renders that no page plays (the tile strips, the 4:5 posts, the film, the
 * social images) is an export, in apps/promo/exports. */
const dir = join(process.cwd(), 'public/promo')
const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8')) as {
  home?: Record<string, string>
  videos: Record<string, { sources: { src: string }[]; poster?: { src: string; srcset?: Record<string, string> } }>
  loops?: Record<string, Record<string, unknown>>
  images?: Record<string, { src: string }>
  og?: string
}

const onHost = (url: string) => url.startsWith('https://media.youj.dev/promo/')

/** Every file a clip asks for: its sources, its poster, and the poster in each format and size. */
const filesOf = (clip: LoopClip) =>
  [
    ...clip.sources.map((source) => source.src),
    clip.poster,
    ...Object.values(clip.posterSet ?? {}).flatMap((set) => set.split(',').map((candidate) => candidate.trim().split(/\s+/)[0]!)),
  ]

describe('public/promo', () => {
  const film = readHomeFilm()
  const loops = Object.values(readLoops())

  it('has every file the homepage film and the topic loops play on R2, in every encode and poster', () => {
    expect(film).not.toBeNull()
    expect(loops.length).toBeGreaterThan(0)
    expect(loops.every((loop) => loop.wide)).toBe(true)
    const played = [film?.dark, film?.light, ...loops.map((loop) => loop.wide)].flatMap((clip) => (clip ? filesOf(clip) : []))
    expect(played.filter((url) => !onHost(url))).toEqual([])
    // Nothing the manifest names was dropped for not being on R2.
    const named = Object.values(manifest.videos).flatMap((video) => [...video.sources.map((s) => s.src), video.poster?.src, ...Object.values(video.poster?.srcset ?? {}).flatMap((set) => set.split(',').map((c) => c.trim().split(/\s+/)[0]))])
    expect(named.filter((path) => !(path!.replace(/^\/promo\//, '') in media.files))).toEqual([])
  })

  it('holds only the manifest and the OG image', () => {
    const og = manifest.og && manifest.images?.[manifest.og]?.src.replace(/^\/promo\//, '')
    expect(readdirSync(dir).sort()).toEqual(['manifest.json', og].filter(Boolean).sort())
  })

  it('names in its manifest only what the site plays: the film in each scheme, and each topic’s wide cut', () => {
    const wide = Object.values(manifest.loops ?? {}).map((cuts) => cuts.wide)
    expect(Object.keys(manifest.videos).sort()).toEqual([...Object.values(manifest.home ?? {}), ...wide].sort())
    for (const cuts of Object.values(manifest.loops ?? {})) expect(Object.keys(cuts)).toEqual(['wide'])
  })
})
