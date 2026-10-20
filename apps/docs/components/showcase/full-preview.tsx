'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme as useColorScheme } from 'fumadocs-ui/provider/base'
import { XIcon } from '@youj/icons'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@youj/react'
import { useShowcasePickedPreset, useShowcaseLook } from '@/lib/showcase-theme'
import type { Level } from '@/lib/taxonomy'
import type { ViewerEntry } from './viewer-entry'
import { Screens } from './viewer-screens'
import { CodeScreen, IslandDock, InfoScreen, loadIndex, Stage, useViewerState, ViewerIsland } from './viewer-parts'

/* An item's /view page opened on its own (a docs preview's "Open in a new
 * tab", a link): the stage, frame and island of a docs preview, with the item
 * running in a frame of this very page (which, framed, is the bare demo). Its
 * header is the item's name and where it lives; ✕ and the island's Exit full
 * page go back to its docs page. A chunk of its own: a frame never loads it. */

/** The levels an item of a /view kind can be on. */
const LEVELS: Record<string, Level[]> = { blocks: ['card', 'section', 'frame', 'screen'], component: ['component'] }

function useEntry(id: string) {
  const [found, setFound] = useState<{ entry?: ViewerEntry; level?: Level; done: boolean }>({ done: false })
  useEffect(() => {
    let live = true
    const levels = LEVELS[id.slice(0, id.indexOf('/'))] ?? []
    Promise.allSettled(levels.map((level) => loadIndex(level).then((list) => ({ level, entry: list.find((e) => e.key === id) })))).then((results) => {
      if (!live) return
      const hit = results.flatMap((r) => (r.status === 'fulfilled' && r.value.entry ? [r.value] : []))[0]
      setFound({ entry: hit?.entry, level: hit?.level, done: true })
    })
    return () => {
      live = false
    }
  }, [id])
  return found
}

export function FullPreview({ id }: { id: string }) {
  const { entry, done } = useEntry(id)
  const { resolvedTheme } = useColorScheme()
  const pagePreset = useShowcasePickedPreset()
  const pageLook = useShowcaseLook()
  const viewer = useViewerState({
    itemKey: id,
    entry,
    basic: id.startsWith('component/'),
    opening: { dark: resolvedTheme !== 'light', preset: pagePreset, style: pageLook },
  })
  const router = useRouter()
  const [run, setRun] = useState(0)
  const [fit, setFit] = useState(100)
  const slug = id.slice(id.indexOf('/') + 1)
  const title = entry?.title ?? slug
  const files = entry?.files ?? entry?.stories.find((s) => s.id === viewer.story)?.files ?? []
  const home = entry?.docs ?? entry?.page ?? '/'

  // Esc does what ✕ does, unless it's closing something open first (a menu or a dialog).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return
      if (document.querySelector('[aria-expanded="true"], [role="dialog"], [role="menu"], [role="listbox"]')) return
      router.push(home)
    }
    // Capturing, so a tooltip left open by returning focus doesn't take the key first.
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  })

  useEffect(() => {
    document.title = `${title}: full-page preview`
  }, [title])

  return (
    <TooltipProvider>
      <div data-full-preview="" className="fixed inset-0 flex flex-col bg-surface text-fg">
        <header aria-label="Preview toolbar" className="flex shrink-0 items-center gap-3 py-2.5 ps-4 pe-2.5 md:ps-5">
          <div className="flex min-w-0 flex-1 flex-col">
            <h1 className="truncate type-body-strong text-fg">{title}</h1>
            <p className="truncate type-small text-fg-muted">{entry ? `${entry.level} · ${entry.category}` : ' '}</p>
          </div>
          <Tooltip>
            <TooltipTrigger
              render={
                <a
                  href={home}
                  aria-label={entry?.docs ? 'Close, back to its docs page' : 'Close, back to its page'}
                  className="grid size-control-sm place-items-center rounded-md text-fg-muted hover:bg-hover hover:text-fg focus-ring"
                />
              }
            >
              <XIcon size={16} strokeWidth={1.75} />
            </TooltipTrigger>
            <TooltipContent side="bottom">Close</TooltipContent>
          </Tooltip>
        </header>
        <main aria-label="Live preview" className="flex min-h-0 flex-1 flex-col">
          <div className="relative flex min-h-0 flex-1">
            <Screens
              view={viewer.view}
              screens={{
                preview: (
                  <Stage
                    hidden={false}
                    src={viewer.src}
                    title={`${title}, live`}
                    device={viewer.device}
                    zoom={viewer.zoom}
                    run={run}
                    onFit={setFit}
                  />
                ),
                code: <CodeScreen title={title} entry={entry} files={files} missing={done && !entry} />,
                info: <InfoScreen title={title} entry={entry} story={viewer.story} missing={done && !entry} fullPage={null} />,
              }}
            />
          </div>
          <IslandDock>
            <ViewerIsland
              title={title}
              entry={entry}
              viewer={viewer}
              fit={fit}
              onReload={() => setRun((r) => r + 1)}
              page={{ href: home, to: 'exit' }}
            />
          </IslandDock>
        </main>
      </div>
    </TooltipProvider>
  )
}
