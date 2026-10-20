'use client'

import { useMemo, useRef, useState, type ComponentProps, type DragEvent, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { ArchiveIcon, SearchIcon, UploadIcon } from '@youj/icons'
import { AppPage } from '../../components/ui/app-page'
import { Button } from '../../components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../../components/ui/resizable'
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet'
import { toast, Toaster } from '../../components/ui/toast'
import { useIsMobile } from '../../hooks/use-mobile'
import { cn } from '../../lib/utils'
import { FileManagerContext, type FileManagerEnv } from './file-manager/context'
import {
  DEFAULT_COPY,
  demo,
  FILES,
  folderModel,
  FOLDERS,
  kindOf,
  modified,
  NOW,
  QUOTA,
  STORAGE,
  type FileManagerCopy,
  type FileManagerFile,
  type FileManagerFolder,
  type FileManagerStorage,
  type Kind as FileManagerFileKind,
} from './file-manager/data'
import { DropTarget } from './file-manager/drop-target'
import { FilesBody } from './file-manager/files-body'
import { FolderPane } from './file-manager/folder-pane'
import { Preview } from './file-manager/preview'
import { SelectionBar } from './file-manager/selection-bar'
import { Toolbar } from './file-manager/toolbar'
import { UploadsTray } from './file-manager/uploads-tray'
import { useUploads, type FileManagerUploadHandler } from './file-manager/use-uploads'

/* Stash, a team file store. Folders in a TreeView beside the files (a
 * Resizable split; on phones the tree moves into a Sheet), with a storage
 * meter whose total counts up. The main pane has a breadcrumb, a grid / list
 * switch (a segmented control whose key glides) and a sort. Each tile shows
 * an isometric scene picked for what the file holds (a logo or a palette
 * shows itself), which assembles as it comes into view and lifts its lit part
 * while the tile is hovered or focused; ticking them raises a bulk bar from the bottom edge, and
 * files deleted from it (or from a tile's context menu) fade out while the
 * rest close ranks (PresenceList), with an Undo toast. Dragging files over
 * the pane fades in a full-surface drop target; dropped or picked files
 * queue in an uploads tray whose bars fill and whose rows leave as they
 * finish, landing in the folder. Opening a file slides in a preview Sheet
 * with its details and a share link whose Copy label morphs to Copied.
 * Pass your own `files`, `folders` and `storage`, wire `onUpload`,
 * `onDelete`, `onDownload` and `onCopyLink` to your storage API (the demo
 * timers run without them), and rewrite any string in `copy`. It is built for
 * the compact layout density (ui.css), taken from the page. Reduced motion:
 * the overlay, bars and tray appear and leave in place, and the scenes are
 * drawn finished and still. */

const BRAND = { name: 'Stash' }
const messageOf = (reason: unknown) => (reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : undefined)

interface FileManagerProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** A theme to force on the block. Default: none, so it inherits the app's (YoujProvider or a ThemeScope around it). */
  theme?: ThemeInput
  /** A page in your app's frame: the shared page header (AppPage) with search and Upload, and the frame's gutter, with no top bar of its own. Default true; `false` draws its own page (a top bar over full-height panes). */
  embedded?: boolean
  /** The product in the header, the breadcrumb root and the demo logo files. Default: Stash. */
  brand?: { name: string; logo?: ReactNode }
  /** The title's level. Default 1. */
  headingLevel?: 1 | 2 | 3
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<FileManagerCopy>
  /** Formats dates and sizes. Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** Every file, each naming its folder by id. Uploads and deletes change the list from here. Default: the demo's seventeen. */
  files?: FileManagerFile[]
  /** The folder tree. Default: Brand, Campaigns (Autumn 26, Orbit launch), Contracts, Research. */
  folders?: FileManagerFolder[]
  /** What the storage meter splits the space used into. Default: media, documents, archives. */
  storage?: FileManagerStorage[]
  /** The storage quota, in bytes. Default 100 GB. */
  quota?: number
  /** The moment "Today" and "3 days ago" count from, in epoch ms. Default: a fixed demo date. */
  now?: Date | number
  /** The open folder, to control it. Pair with `onFolderChange`. */
  folder?: string
  /** The folder open at first, when uncontrolled. Default: Autumn 26 in the demo, else the first folder. */
  defaultFolder?: string
  /** Called with the folder's id when the person opens another. */
  onFolderChange?: (folder: string) => void
  /** Grid or list, to control it. Pair with `onViewChange`. */
  view?: 'grid' | 'list'
  /** Grid or list at first, when uncontrolled. Default 'grid'. */
  defaultView?: 'grid' | 'list'
  /** Called when the person switches between grid and list. */
  onViewChange?: (view: 'grid' | 'list') => void
  /** Uploads one dropped or picked file into the open folder; report progress and resolve with the stored file. A rejection drops it from the tray with its message. Default: a demo transfer. */
  onUpload?: (file: File, folder: string, onProgress: (percent: number) => void) => ReturnType<FileManagerUploadHandler>
  /** Moves files to trash. They leave at once; a rejection puts them back and shows its message. */
  onDelete?: (files: FileManagerFile[]) => Promise<unknown> | unknown
  /** Undo after a delete: the files are back in the list. */
  onRestore?: (files: FileManagerFile[]) => Promise<unknown> | unknown
  /** Downloads one file (the preview) or the selection; resolve when it's done. Default: a demo wait. */
  onDownload?: (files: FileManagerFile[]) => Promise<unknown> | unknown
  /** Copies a file's link (the tile's menu); resolve when copied. Default: a "Link copied" toast. */
  onCopyLink?: (file: FileManagerFile) => Promise<unknown> | unknown
  /** The share link the preview shows and copies. Default: a demo stash.app link. */
  getShareUrl?: (file: FileManagerFile) => string
  /** Called when a file's preview opens. */
  onOpen?: (file: FileManagerFile) => void
  /** Shows skeleton tiles in place of the files while they load. */
  loading?: boolean
  /** A load failure, shown in place of the files, with Try again when `onRetry` is set. */
  error?: ReactNode
  /** Called from the error's Try again button. */
  onRetry?: () => void
  /** Replaces the empty folder's state. Default: a drop hint from `copy.emptyTitle`. */
  empty?: ReactNode
}

function FileManager({
  theme,
  embedded = true,
  brand = BRAND,
  headingLevel = 1,
  copy: copyProp,
  locale,
  files: initialFiles = FILES,
  folders = FOLDERS,
  storage = STORAGE,
  quota = QUOTA,
  now: nowProp = NOW,
  folder: folderProp,
  defaultFolder,
  onFolderChange,
  view: viewProp,
  defaultView = 'grid',
  onViewChange,
  onUpload,
  onDelete,
  onRestore,
  onDownload,
  onCopyLink,
  getShareUrl,
  onOpen,
  loading = false,
  error,
  onRetry,
  empty,
  className,
  ...rest
}: FileManagerProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const now = typeof nowProp === 'number' ? nowProp : nowProp.getTime()
  const Heading = `h${headingLevel}` as const
  const mobile = useIsMobile()
  const model = useMemo(() => folderModel(folders), [folders])
  const [files, setFiles] = useState(initialFiles)
  // A new `files` array (it loaded, or your app refetched) replaces the list.
  const [seed, setSeed] = useState(initialFiles)
  if (seed !== initialFiles) {
    setSeed(initialFiles)
    setFiles(initialFiles)
  }
  const [innerFolder, setInnerFolder] = useState(() => defaultFolder ?? (folders === FOLDERS ? 'autumn' : (folders[0]?.id ?? '')))
  const folder = folderProp ?? innerFolder
  const [innerView, setInnerView] = useState(defaultView)
  const view = viewProp ?? innerView
  const [sort, setSort] = useState('modified')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [previewId, setPreviewId] = useState<string>()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [tree, setTree] = useState(false)
  const [dragging, setDragging] = useState(false)
  const depth = useRef(0)
  const picker = useRef<HTMLInputElement>(null)
  const folderName = model.names[folder] ?? ''
  const failed = (reason: unknown) => toast.error(copy.actionFailed, { description: messageOf(reason) })

  const { uploads, add } = useUploads(
    (u, stored) => setFiles((list) => [stored ?? { id: u.id, name: u.name, folder, kind: kindOf(u.name), size: u.size, modified: now, owner: copy.you }, ...list]),
    onUpload && ((file, progress) => onUpload(file, folder, progress)),
    (u, reason) => toast.error(copy.uploadFailed(u.name), { description: messageOf(reason) }),
  )

  const q = query.trim().toLowerCase()
  const shown = useMemo(() => {
    const list = files.filter((f) => f.folder === folder && (!q || f.name.toLowerCase().includes(q)))
    return list.sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : sort === 'size' ? b.size - a.size : b.modified - a.modified))
  }, [files, folder, q, sort])
  const subfolders = q ? [] : (model.subfolders[folder] ?? [])
  const preview = files.find((f) => f.id === previewId)

  const go = (id: string) => {
    setInnerFolder(id)
    onFolderChange?.(id)
    setSelected(new Set())
    setTree(false)
  }
  const switchView = (next: 'grid' | 'list') => {
    setInnerView(next)
    onViewChange?.(next)
  }
  const toggle = (id: string) =>
    setSelected((set) => {
      const next = new Set(set)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const remove = async (ids: string[]) => {
    const gone = files.filter((f) => ids.includes(f.id))
    const putBack = () => setFiles((list) => [...gone, ...list])
    setFiles((list) => list.filter((f) => !ids.includes(f.id)))
    setSelected(new Set())
    setPreviewOpen(false)
    try {
      await onDelete?.(gone)
    } catch (reason) {
      putBack()
      failed(reason)
      return
    }
    toast(gone.length === 1 ? copy.movedOne(gone[0]!.name) : copy.movedMany(gone.length), {
      action: {
        label: copy.undo,
        onClick: () => {
          putBack()
          new Promise((resolve) => resolve(onRestore?.(gone))).catch(failed)
        },
      },
    })
  }
  const open = (id: string) => {
    setPreviewId(id)
    setPreviewOpen(true)
    const file = files.find((f) => f.id === id)
    if (file) onOpen?.(file)
  }
  const hasFiles = (event: DragEvent) => event.dataTransfer.types.includes('Files')

  const env: FileManagerEnv = {
    copy,
    brand,
    names: model.names,
    path: model.path,
    modified: (at) => modified(at, now, copy.locale, copy.today),
    shareUrl: getShareUrl ?? ((file) => `https://stash.app/s/${file.id}x${file.name.length}q`),
    copyLink: (file) =>
      void new Promise((resolve) => resolve(onCopyLink?.(file))).then(() => toast.success(copy.linkCopied, { description: file.name }), failed),
    download: onDownload ?? ((list) => demo('FileManager: onDownload', list.length > 1 ? 900 : 700)),
  }

  const views = { files, shown, subfolders, selected, onFolder: go, onToggle: toggle, onOpen: open, onRemove: remove }

  const content = <FilesBody loading={loading} error={error} onRetry={onRetry} empty={empty} query={q} folderName={folderName} view={view} views={views} />

  const main = (
    <div
      className="relative flex h-full min-h-0 flex-col"
      onDragEnter={(event) => {
        if (!hasFiles(event)) return
        depth.current += 1
        setDragging(true)
      }}
      onDragOver={(event) => hasFiles(event) && event.preventDefault()}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1)
        if (depth.current === 0) setDragging(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        depth.current = 0
        setDragging(false)
        add([...event.dataTransfer.files])
      }}
    >
      <Toolbar mobile={mobile} crumbs={model.path(folder)} home={folders[0]?.id ?? folder} sort={sort} onSort={setSort} view={view} onView={switchView} onFolder={go} onFolders={() => setTree(true)} />
      <div className="min-h-0 flex-1 overflow-y-auto pb-24">{content}</div>

      <DropTarget active={dragging} label={copy.dropTo(folderName)} />

      <SelectionBar files={files.filter((f) => selected.has(f.id))} onDelete={() => remove([...selected])} onClear={() => setSelected(new Set())} />
    </div>
  )

  const pane = <FolderPane folder={folder} onFolder={go} folders={folders} storage={storage} quota={quota} />

  const search = (
    <InputGroup className={cn('min-w-0 flex-1', embedded ? 'w-64 max-w-72 flex-none max-sm:hidden' : 'ms-auto max-w-72 max-sm:hidden')}>
      <InputGroupAddon>
        <SearchIcon size={15} />
      </InputGroupAddon>
      <InputGroupInput type="search" aria-label={copy.search} placeholder={copy.searchPlaceholder(folderName)} value={query} onChange={(event) => setQuery(event.target.value)} />
    </InputGroup>
  )
  const upload = (
    <>
      <input ref={picker} type="file" multiple hidden onChange={(event) => { add([...(event.target.files ?? [])]); event.target.value = '' }} />
      <Button onClick={() => picker.current?.click()} className={embedded ? undefined : 'max-sm:ms-auto'}>
        <UploadIcon size={14} /> {copy.upload}
      </Button>
    </>
  )
  const panes = mobile ? (
    main
  ) : (
    <ResizablePanelGroup orientation="horizontal">
      <ResizablePanel id="folders" defaultSize="20rem" minSize="14rem" maxSize="40%" className="bg-surface">
        {pane}
      </ResizablePanel>
      <ResizableHandle aria-label={copy.resizeFolders} />
      <ResizablePanel id="files" minSize="50%">
        {main}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
  const overlays = (
    <>
      <UploadsTray uploads={uploads} />

      <Sheet open={tree} onOpenChange={setTree}>
        <SheetContent side="start" className="w-72 p-0">
          <SheetHeader>
            <SheetTitle>{copy.folders}</SheetTitle>
          </SheetHeader>
          <SheetBody className="p-0">{pane}</SheetBody>
        </SheetContent>
      </Sheet>

      <Preview file={preview} open={previewOpen} onOpenChange={setPreviewOpen} onDelete={(f) => remove([f.id])} />
      <Toaster position="top-center" />
    </>
  )

  if (embedded) {
    const page = (
      <FileManagerContext value={env}>
        <AppPage
          {...rest}
          title={`${brand.name}${copy.titleSuffix}`}
          actions={
            <>
              {search}
              {upload}
            </>
          }
          headingLevel={headingLevel}
          width="fill"
          className={cn('text-fg', className)}
        >
          <div className="h-160 overflow-hidden rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-canvas">{panes}</div>
          {overlays}
        </AppPage>
      </FileManagerContext>
    )
    return theme ? <ThemeScope theme={theme}>{page}</ThemeScope> : page
  }
  return (
    <ThemeScope theme={theme}>
      <FileManagerContext value={env}>
        <div {...rest} className={cn('flex h-dvh min-h-144 flex-col bg-canvas text-fg', className)}>
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-4">
            {brand.logo ?? (
              <span aria-hidden className="grid size-7 place-items-center rounded-md bg-accent text-on-accent">
                <ArchiveIcon size={15} />
              </span>
            )}
            <Heading className="font-semibold tracking-tight">
              {brand.name} <span className="sr-only">{copy.titleSuffix}</span>
            </Heading>
            {search}
            {upload}
          </header>

          <main className="min-h-0 flex-1">{panes}</main>
          {overlays}
        </div>
      </FileManagerContext>
    </ThemeScope>
  )
}

export {
  FileManager,
  type FileManagerProps,
  type FileManagerCopy,
  type FileManagerFile,
  type FileManagerFileKind,
  type FileManagerFolder,
  type FileManagerStorage,
}
