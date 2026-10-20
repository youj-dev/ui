'use client'

import { useId, useRef, useState, type DragEvent, type HTMLAttributes } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Collapse } from '@youj/motion'
import { ImageIcon, SearchXIcon, UploadIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { AsyncButton } from '../../components/ui/async-button'
import { Button } from '../../components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../../components/ui/empty'
import { Skeleton } from '../../components/ui/skeleton'
import { useLiveRegion } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { Art } from './library/art'
import {
  ASSETS,
  DEFAULT_COPY,
  demo,
  FOLDERS,
  type MediaLibraryAsset,
  type MediaLibraryCopy,
  type MediaLibraryFilter,
  type MediaLibraryFolder,
  type MediaLibraryKind,
  type MediaLibrarySort,
  type MediaLibraryUpload,
} from './library/data'
import { Grid } from './library/grid'
import { Lightbox } from './library/lightbox'
import { Toolbar } from './library/toolbar'
import { useLibrary } from './library/use-library'

/* A media picker for a product page or a post. Search names and
 * descriptions, narrow by type, sort, open a folder, see a grid or a list;
 * the count of what's shown is read out as it changes. Picking keeps its
 * order (numbered badges; the first is the cover) and respects a maximum,
 * saying so when it's reached. The grid is one multi-select listbox: arrows
 * move in two dimensions, Space picks, Shift picks a run, ⌘A or Ctrl+A picks
 * all, Escape clears, Enter opens the file large in a lightbox that grows
 * from its tile, steps with ← and →, and picks from there. Drop files on the
 * grid, or Upload, to add them to the open folder: they fill as they go and
 * are picked as they land, while there's room. Insert hands back the picked
 * files in order. Loading, failing, an empty folder and a search with no
 * results each have their own state. Reduced motion: tiles appear in place
 * and the lightbox opens without growing. */

interface MediaLibraryProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** A panel inside another page: an `h2`, and no page around it. Default true; `false` draws its own page (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (1024px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<MediaLibraryCopy>
  /** Writes sizes, dates and running times in this locale (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The files. Default: a studio's photos, film, sound and lookbook. */
  assets?: MediaLibraryAsset[]
  /** The folders files sit in (`asset.folder`). Default: three. */
  folders?: MediaLibraryFolder[]
  /** The picked files' ids, in order (controlled): pair it with `onSelectionChange`. */
  selection?: string[]
  /** The files picked at first, when the block owns it. Default: two of the demo's. */
  defaultSelection?: string[]
  onSelectionChange?: (ids: string[]) => void
  /** The most it lets you pick. Default 4; `Infinity` for no limit. */
  max?: number
  /** Grid or list at first. Default grid. */
  defaultView?: 'grid' | 'list'
  onViewChange?: (view: 'grid' | 'list') => void
  /** Files it takes when uploading, as an input's `accept`. Default images, video, audio and PDF. */
  accept?: string
  /** Shows placeholders while the library loads. */
  loading?: boolean
  /** Why the library didn't load; shows it with Try again (`onRetry`). */
  error?: string
  onRetry?: () => void
  /** Uploads a file into the open folder: report progress, resolve with what's stored. Default: a simulated upload. */
  onUpload?: MediaLibraryUpload
  /** Inserts the picked files, in order. Awaited (pending, then done or the error). Default: a demo wait. */
  onInsert?: (assets: MediaLibraryAsset[]) => Promise<unknown> | unknown
  /** Closes the picker without inserting. Without it, there's no Cancel. */
  onCancel?: () => void
  /** Classes for its parts: `grid` is the region the files scroll in (its height, 512px at 100%, holds the picker's size). */
  classNames?: { grid?: string }
}

const KINDS: MediaLibraryKind[] = ['image', 'video', 'audio', 'document']
const carriesFiles = (event: DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes('Files')

function MediaLibrary({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale,
  assets = ASSETS,
  folders = FOLDERS,
  selection: selectionProp,
  defaultSelection = assets === ASSETS ? ['sage', 'rose'] : [],
  onSelectionChange,
  max = 4,
  defaultView = 'grid',
  onViewChange,
  accept = 'image/*,video/*,audio/*,application/pdf',
  loading = false,
  error,
  onRetry,
  onUpload,
  onInsert,
  onCancel,
  classNames,
  className,
  ...rest
}: MediaLibraryProps) {
  const copy: MediaLibraryCopy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const optionsId = useId()
  const optionId = (id: string) => `${optionsId}-${id}`
  const Title = embedded ? 'h2' : 'h1'
  const limit = Number.isFinite(max) ? max : undefined
  const { politeRef, assertiveRef, announce } = useLiveRegion()
  const [selection, setInner] = useControllableState(selectionProp, defaultSelection)
  const setSelection = (next: string[]) => {
    setInner(next)
    onSelectionChange?.(next)
  }
  const [view, setView] = useState(defaultView)
  const lib = useLibrary({ assets, selection, setSelection, max: limit, onUpload, copy, announce })
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [lightbox, setOpenAsset] = useState<string | null>(null)
  // The file the lightbox last showed: its tile takes focus back when it closes.
  const shownLast = useRef<string | null>(null)
  const setLightbox = (id: string | null) => {
    if (id) shownLast.current = id
    setOpenAsset(id)
  }
  const shown = lib.visible
  const boxIndex = lightbox ? shown.findIndex((a) => a.id === lightbox) : -1
  const picked = selection.map((id) => lib.items.find((a) => a.id === id)).filter((a): a is MediaLibraryAsset => !!a)
  const kinds: MediaLibraryFilter[] = ['all', ...KINDS.filter((kind) => lib.items.some((a) => a.kind === kind))]
  const folderName = folders.find((f) => f.id === lib.folder)?.name ?? copy.root

  const search = (query: string) => {
    lib.setQuery(query)
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    const count = lib.items.filter(
      (a) => (lib.folder === null || a.folder === lib.folder) && words.every((w) => `${a.name} ${a.alt ?? ''}`.toLowerCase().includes(w)),
    ).length
    announce(copy.results(count), { delay: 600 })
  }
  const insert = async () => {
    await (onInsert ? onInsert(picked) : demo('MediaLibrary: onInsert', 700))
  }
  const drop = {
    onDragEnter: (event: DragEvent) => carriesFiles(event) && setOver(true),
    onDragOver: (event: DragEvent) => {
      if (!carriesFiles(event)) return
      event.preventDefault()
      event.dataTransfer.dropEffect = 'copy'
    },
    onDragLeave: (event: DragEvent) => !event.currentTarget.contains(event.relatedTarget as Node) && setOver(false),
    onDrop: (event: DragEvent) => {
      setOver(false)
      if (!event.dataTransfer?.files.length) return
      event.preventDefault()
      lib.upload(Array.from(event.dataTransfer.files))
    },
  }

  const body = error ? (
    <Alert variant="danger">
      <AlertTitle>{copy.errorTitle}</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
      {onRetry && (
        <AlertAction>
          <Button size="sm" variant="outline" onClick={onRetry}>
            {copy.retry}
          </Button>
        </AlertAction>
      )}
    </Alert>
  ) : loading ? (
    <div role="status" aria-label={copy.loading} className="grid grid-cols-[repeat(auto-fill,minmax(calc(var(--spacing)*30),1fr))] gap-x-3 gap-y-4">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  ) : shown.length === 0 ? (
    <Empty className="h-full py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">{lib.query ? <SearchXIcon /> : <ImageIcon />}</EmptyMedia>
        <EmptyTitle>{lib.query ? copy.noResults(lib.query) : copy.emptyTitle}</EmptyTitle>
        <EmptyDescription>{lib.query ? copy.noResultsBody : copy.emptyBody}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {lib.query ? (
          <Button variant="outline" size="sm" onClick={() => search('')}>
            {copy.clearSearch}
          </Button>
        ) : (
          <Button size="sm" onClick={() => input.current?.click()}>
            <UploadIcon />
            {copy.upload}
          </Button>
        )}
      </EmptyContent>
    </Empty>
  ) : (
    <Grid
      assets={shown}
      view={view}
      selection={selection}
      label={copy.media}
      idOf={optionId}
      copy={copy}
      onToggle={lib.toggle}
      onExtend={lib.extend}
      onSelectAll={lib.selectAll}
      onClear={lib.clear}
      onOpen={setLightbox}
    />
  )

  const panel = (
    <article
      aria-labelledby={titleId}
      {...(embedded ? rest : null)}
      className={cn(
        'flex w-full flex-col rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface text-fg',
        embedded ? 'shadow-sm' : 'shadow-lg',
        !fill && 'max-w-5xl',
        embedded && className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-(--ui--panel-x) pt-(--ui--panel-head-y) pb-4">
        <div className="flex min-w-0 flex-col gap-1">
          <Title id={titleId} className="text-(length:--ui--panel-title) leading-(--ui--panel-title-leading) font-semibold tracking-tight">
            {copy.title}
          </Title>
          <p className="text-ui text-fg-muted">{copy.description}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => input.current?.click()}>
          <UploadIcon />
          {copy.upload}
        </Button>
        <input
          ref={input}
          type="file"
          multiple
          accept={accept}
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          onChange={(event) => {
            lib.upload(Array.from(event.currentTarget.files ?? []))
            event.currentTarget.value = ''
          }}
        />
      </header>
      <div className="px-(--ui--panel-x) pb-4">
        <Toolbar
          copy={copy}
          query={lib.query}
          onQuery={search}
          filter={lib.filter}
          onFilter={lib.setFilter}
          kinds={kinds}
          sort={lib.sort}
          onSort={(sort: MediaLibrarySort) => lib.setSort(sort)}
          view={view}
          onView={(next) => {
            setView(next)
            onViewChange?.(next)
          }}
          folders={folders}
          folder={lib.folder}
          onFolder={lib.setFolder}
          items={lib.items}
        />
      </div>
      <div {...drop} data-state={over ? 'over' : 'idle'} className="group/drop relative border-t border-line">
        {/* The files scroll in a region of its own height: filtering, an empty folder, loading or an upload never resize the picker. */}
        <div className={cn('yj-scrollbar h-128 overflow-y-auto px-(--ui--panel-x) py-4', classNames?.grid)}>
          <Collapse open={lib.failures.length > 0}>
            <Alert variant="danger" open onOpenChange={lib.dismissFailures} dismissLabel={copy.clear} className="mb-4">
              <AlertDescription>
                {lib.failures.map((f) => (
                  <p key={f}>{f}</p>
                ))}
              </AlertDescription>
            </Alert>
          </Collapse>
          {body}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-2 grid place-items-center rounded-lg border-2 border-dashed border-accent bg-[color-mix(in_oklab,var(--color-surface)_80%,transparent)] opacity-0 backdrop-blur-sm transition-opacity yj-duration-fast ease-standard group-data-[state=over]/drop:opacity-100"
        >
          <span className="flex items-center gap-2 rounded-full border border-line bg-overlay px-4 py-2 text-ui font-medium text-fg shadow-md">
            <UploadIcon size={16} className="text-accent-text" />
            {copy.dropHere(folderName)}
          </span>
        </div>
      </div>
      <footer className="flex flex-wrap items-center gap-3 border-t border-line px-(--ui--panel-x) py-(--ui--panel-foot-y)">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {picked.length > 0 && (
            <ol aria-hidden className="flex shrink-0 [&>li:not(:first-child)]:-ms-2">
              {picked.slice(0, 5).map((a) => (
                <li key={a.id} className="size-8 overflow-hidden rounded-md border-2 border-surface bg-well">
                  {a.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element -- copy-in blocks run in Vite too
                    <img src={a.preview} alt="" className="size-full object-cover" />
                  ) : (
                    <Art kind={a.kind} name={a.name} className="size-full" />
                  )}
                </li>
              ))}
            </ol>
          )}
          <span className={cn('min-w-0 text-ui-sm tabular-nums', lib.full ? 'text-warning-text' : 'text-fg-muted')}>
            {lib.full && limit ? copy.full(limit) : copy.selected(selection.length, limit)}
          </span>
          {selection.length > 0 && (
            <Button variant="ghost" size="xs" onClick={lib.clear}>
              {copy.clear}
            </Button>
          )}
        </div>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            {copy.cancel}
          </Button>
        )}
        <AsyncButton
          onAction={insert}
          disabled={selection.length === 0}
          pendingLabel={copy.inserting}
          successLabel={copy.inserted}
          errorLabel={copy.insertFailed}
        >
          {copy.insert(selection.length)}
        </AsyncButton>
      </footer>
      <Lightbox
        asset={boxIndex >= 0 ? shown[boxIndex]! : null}
        index={boxIndex}
        total={shown.length}
        selected={!!lightbox && selection.includes(lightbox)}
        folders={folders}
        copy={copy}
        origin={() => (shownLast.current ? document.getElementById(optionId(shownLast.current)) : null)}
        onStep={(delta) => {
          const next = shown[Math.max(0, Math.min(shown.length - 1, boxIndex + delta))]
          if (next) setLightbox(next.id)
        }}
        onToggle={() => lightbox && lib.toggle(lightbox)}
        onClose={() => setLightbox(null)}
      />
      <div ref={politeRef} role="status" className="sr-only" />
      <div ref={assertiveRef} role="alert" className="sr-only" />
    </article>
  )

  const shell = embedded ? (
    panel
  ) : (
    <main {...rest} className={cn('grid min-h-dvh w-full place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {panel}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{shell}</ThemeScope> : shell
}

export { MediaLibrary, DEFAULT_COPY as MEDIA_LIBRARY_COPY }
export type {
  MediaLibraryAsset,
  MediaLibraryCopy,
  MediaLibraryFilter,
  MediaLibraryFolder,
  MediaLibraryKind,
  MediaLibraryProps,
  MediaLibrarySort,
  MediaLibraryUpload,
}
