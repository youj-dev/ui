'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { shippedThemes } from '@youj/core/lib/youj/theme'
import type { YoujIconComponent } from '@youj/icons'
import { useLoader } from '@/components/loaders/live'
import { Stage } from '@/components/site/stage'
import { ICONS, SCENES } from '@/generated/palette-art'
import { cn } from '@/lib/cn'

/* The palette's stage: the highlighted row, shown as what it is. A loader
 * plays, an icon performs its choreography, a scene stands on the stage, a
 * theme dresses a small card in its own colors; anything else holds its glyph. Under it, what the row is
 * and a line about it.
 *
 * It's a chunk of its own, fetched once the palette is open, and it fetches
 * only what it shows: one loader, one icon, one scene's file. A row that's passed over before
 * its art arrives costs a request and nothing else. It's a picture of the row
 * the list already names, so it's hidden from assistive tech. */

export type StageArt =
  | { kind: 'loader'; id: string }
  | { kind: 'icon'; name: string }
  | { kind: 'scene'; id: string }
  | { kind: 'theme'; id: string }
  | { kind: 'glyph'; Glyph: YoujIconComponent }

export interface StageItem {
  art: StageArt
  /** What the row is: `Loader`, `Component`, `Docs page`. */
  kind: string
  title: string
  text?: ReactNode
}

const artKey = (art: StageArt) => (art.kind === 'glyph' ? art.Glyph.meta?.name : 'id' in art ? art.id : art.name)

/** Chunks once in, by the function that fetches them, so returning to a row shows its art at once. */
const loaded = new Map<() => Promise<unknown>, unknown>()

function useChunk<T>(load: (() => Promise<T>) | undefined): T | null {
  const [state, setState] = useState<{ load: typeof load; value: T | null }>({ load, value: load ? ((loaded.get(load) as T) ?? null) : null })
  const current = state.load === load ? state : { load, value: load ? ((loaded.get(load) as T) ?? null) : null }
  if (current !== state) setState(current)
  useEffect(() => {
    if (!load || loaded.has(load)) return
    let live = true
    load().then(
      (value) => {
        loaded.set(load, value)
        if (live) setState({ load, value })
      },
      () => {},
    )
    return () => {
      live = false
    }
  }, [load])
  return current.value
}

/** Fades and rises into place as it mounts; still under reduced motion. */
const enter =
  'transition-[opacity,translate,scale] yj-duration-base ease-enter starting:translate-y-1 starting:scale-[0.98] starting:opacity-0 motion-reduce:transition-none'

function LoaderArt({ id }: { id: string }) {
  const { Component } = useLoader(id)
  return Component && <Component size={92} label={null} className={cn('text-fg', enter)} />
}

function IconArt({ name }: { name: string }) {
  const Icon = useChunk(ICONS[name])
  return Icon && <Icon size={64} strokeWidth={1.5} trigger="loop" className={cn('text-fg', enter)} />
}

function SceneArt({ id }: { id: string }) {
  const Scene = useChunk(SCENES[id])
  return (
    Scene && <span className={cn('grid size-full place-items-center p-2 [&_svg]:max-h-full [&_svg]:max-w-full', enter)}>{<Scene unit={17} />}</span>
  )
}

/** A theme, worn: a small card in its page, surface, accent, chart colors and corners. */
function ThemeArt({ id }: { id: string }) {
  const name = shippedThemes.find((t) => t.id === id)?.name ?? id
  return (
    <Stage theme={id} className={cn('absolute inset-0 grid place-items-center', enter)}>
      <span className="w-[72%] rounded-xl bg-surface p-3.5 text-fg shadow-sm ring-1 ring-line">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-[15px] font-medium">{name}</span>
          <span className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-contrast">Accent</span>
        </span>
        <span className="mt-3 flex h-14 items-end gap-1.5" aria-hidden>
          {[0.45, 0.8, 0.6, 1, 0.7].map((h, i) => (
            <span key={i} className="flex-1 rounded-sm" style={{ height: `${h * 100}%`, background: `var(--color-chart-${i + 1})` }} />
          ))}
        </span>
        <span className="mt-3 block h-1.5 w-2/3 rounded-full bg-line-strong" />
        <span className="mt-1.5 block h-1.5 w-1/3 rounded-full bg-line-strong" />
      </span>
    </Stage>
  )
}

function GlyphArt({ Glyph }: { Glyph: YoujIconComponent }) {
  return <Glyph size={56} strokeWidth={1.25} trigger="loop" className={cn('text-fg', enter)} />
}

function Art({ art }: { art: StageArt }) {
  switch (art.kind) {
    case 'loader':
      return <LoaderArt id={art.id} />
    case 'icon':
      return ICONS[art.name] ? <IconArt name={art.name} /> : null
    case 'scene':
      return SCENES[art.id] ? <SceneArt id={art.id} /> : null
    case 'theme':
      return <ThemeArt id={art.id} />
    case 'glyph':
      return <GlyphArt Glyph={art.Glyph} />
  }
}

export default function SearchStage({ item }: { item: StageItem | undefined }) {
  return (
    <div aria-hidden data-slot="search-stage" className="flex min-h-0 flex-col gap-3 p-2.5">
      <Stage className="search-stage-art relative isolate grid aspect-[10/9] shrink-0 place-items-center overflow-hidden rounded-lg ring-1 ring-line [--yj-anim-paper:var(--color-canvas)]">
        <span className="dot-grid absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_70%_75%_at_50%_55%,black,transparent)]" />
        {item && <Art key={`${item.art.kind}:${artKey(item.art)}`} art={item.art} />}
      </Stage>
      {item && (
        <div key={`${item.kind}:${item.title}`} className={cn('min-w-0 px-1.5', enter)}>
          <p className="text-ui-xs font-medium text-fg-muted">{item.kind}</p>
          <p className="mt-1 truncate text-ui-lg font-medium text-fg">{item.title}</p>
          {item.text && <p className="mt-1 line-clamp-4 text-ui-sm text-pretty text-fg-muted">{item.text}</p>}
        </div>
      )}
    </div>
  )
}
