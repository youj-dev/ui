'use client'

import { Fragment, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useYouj } from '@youj/core'
import { DownloadIcon, FileIcon, FolderIcon } from '@youj/icons'
import { CodeSource } from '@/components/ui/code-source'
import { CopyButton } from '@/components/ui/copy-button'
import { cn } from '@/lib/cn'
import { loadCode, prefetchCode, useCode } from '@/lib/code-load'
import { observeScroll } from '@/lib/observe-scroll'
import { zip } from '@/lib/zip'

export type CodeFile = {
  /** Where `youj add` writes it in an app: `examples/mail/mail.tsx`. */
  path: string
} & (
  /** Written in the browser (Create's files): the text and its highlight, here already. */
  | { code: string; highlighted: ReactNode }
  /** A block's or example's file: its length, and where its text is published (app/code), fetched when it's first shown. */
  | { src: string; lines: number }
)

export interface CodeInstall {
  /** `npx @youj/cli add app-billing` */
  command: string
  /** Registry items that come with it. */
  deps: string[]
}

/**
 * The source of a block or example, the way `youj add` writes it: the
 * install command, a file tree, and each file with its own copy button.
 * Download packs the files into a .zip in the browser. The tree is a vertical
 * tab list (arrow keys, Home, End), so each file is one keystroke away. A
 * published file's text is fetched when it's first shown (or pointed at), and
 * only while the panel is `open`.
 */
export function CodePanel({
  idBase,
  files,
  install,
  download,
  height,
  open = true,
  collapsibleTree = false,
}: {
  idBase: string
  files: CodeFile[]
  /** Whether the panel is showing: a hidden one fetches nothing. */
  open?: boolean
  install?: CodeInstall
  /** The .zip's name, without the extension. */
  download: string
  height: string
  /** The file tree is a toggle in the file's bar, hidden until asked for (and none for a single file), so the code takes the whole width. */
  collapsibleTree?: boolean
}) {
  const [treeOpen, setTreeOpen] = useState(false)
  const [path, setPath] = useState(files[0]?.path)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const active = files.find((f) => f.path === path) ?? files[0]
  const folder = commonFolder(files.map((f) => f.path))
  const loaded = useCode(open && active && 'src' in active ? active.src : null)
  const source = useRef<HTMLDivElement>(null)
  // A line wider than the panel fades out on the side with more to see (`scroll-fade`), so a cut-off line reads as "keeps going".
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measures when another file or its loaded source fills the panel
  useEffect(() => {
    const el = source.current
    if (!el) return
    const measure = () => {
      const max = el.scrollWidth - el.clientWidth
      const at = Math.abs(el.scrollLeft)
      el.toggleAttribute('data-more-start', max > 1 && at > 1)
      el.toggleAttribute('data-more-end', max > 1 && at < max - 1)
    }
    return observeScroll(el, measure, true)
  }, [path, loaded.status])
  if (!active) return null
  const text = 'code' in active ? active.code : loaded.status === 'ready' ? loaded.body.code : undefined
  const toggle = collapsibleTree && files.length > 1
  const tree = !collapsibleTree || (toggle && treeOpen)
  const treeId = `${idBase}-tree`
  const intent = (file: CodeFile) => 'src' in file && prefetchCode(file.src)

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const keys: Record<string, number> = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: files.length - 1 }
    const next = keys[e.key]
    if (next === undefined) return
    e.preventDefault()
    const target = (next + files.length) % files.length
    setPath(files[target]!.path)
    tabs.current[target]?.focus()
  }

  return (
    <div className="flex flex-col" style={{ height }}>
      {install && (
        <div className="flex min-h-11 items-center gap-2 border-b border-line ps-3.5 pe-2">
          <div tabIndex={0} role="group" aria-label="Install command" className="min-w-0 flex-1 overflow-x-auto rounded-sm scrollbar-none focus-ring">
            <p className="code-text leading-7 whitespace-nowrap text-fg">
              <span aria-hidden className="me-2.5 text-fg-subtle select-none">
                $
              </span>
              {install.command}
            </p>
          </div>
          <CopyButton value={install.command} label="Copy install command" />
          <DownloadButton files={files} name={download} />
        </div>
      )}
      <div className={cn('grid min-h-0 flex-1', tree ? 'grid-rows-[auto_minmax(0,1fr)] md:grid-cols-[15rem_minmax(0,1fr)] md:grid-rows-1' : 'grid-rows-[minmax(0,1fr)]')}>
        {/* Collapsed, the tree stays in the document (hidden), so the open file's tab still names its panel. */}
        <div id={treeId} hidden={!tree} className="flex min-h-0 flex-col border-line max-md:border-b md:border-e">
          <p className="flex items-center gap-2 px-3.5 pt-3 pb-1.5 type-label text-fg-subtle">
            <FolderIcon size={13} strokeWidth={1.6} aria-hidden />
            <span className="truncate">{folder || 'files'}</span>
          </p>
          <div
            role="tablist"
            aria-label="Files"
            aria-orientation="vertical"
            className="flex gap-0.5 overflow-x-auto px-1.5 pb-2 scrollbar-none md:flex-col md:overflow-y-auto"
          >
            {files.map((file, i) => {
              const selected = file.path === active.path
              const relative = file.path.slice(folder ? folder.length + 1 : 0)
              const dir = relative.slice(0, relative.lastIndexOf('/') + 1)
              const previous = files[i - 1]?.path.slice(folder ? folder.length + 1 : 0) ?? ''
              return (
                <Fragment key={file.path}>
                  {/* A subfolder's name heads its files; the tabs still carry it, for screen readers and the phone's row. */}
                  {dir && dir !== previous.slice(0, previous.lastIndexOf('/') + 1) && (
                    <span aria-hidden className="flex h-7 shrink-0 items-center gap-2 ps-5 pt-1.5 type-small text-fg-subtle max-md:hidden">
                      <FolderIcon size={13} strokeWidth={1.6} />
                      {dir.slice(0, -1)}
                    </span>
                  )}
                  <button
                    ref={(el) => {
                      tabs.current[i] = el
                    }}
                    type="button"
                    role="tab"
                    id={`${idBase}-file-${i}`}
                    aria-controls={`${idBase}-source`}
                    aria-selected={selected}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setPath(file.path)}
                    onKeyDown={(e) => onKeyDown(e, i)}
                    onPointerEnter={() => intent(file)}
                    onFocus={() => intent(file)}
                    className={cn(
                      'flex h-8 shrink-0 items-center gap-2 rounded-md ps-2 pe-2.5 text-start type-small transition-colors duration-(--yj-duration-fast) ease-standard focus-ring md:ps-5',
                      dir && 'md:ps-10',
                      selected ? 'bg-selected text-fg' : 'text-fg-muted hover:bg-hover hover:text-fg',
                    )}
                  >
                    <FileIcon size={13} strokeWidth={1.6} aria-hidden className={cn('shrink-0', selected && 'text-accent')} />
                    <span className="truncate">
                      <span className="md:sr-only">{dir}</span>
                      {relative.slice(dir.length)}
                    </span>
                    <span className="ms-auto ps-2 text-[10.5px] text-fg-subtle tabular-nums max-md:hidden">{'code' in file ? lines(file.code) : file.lines}</span>
                  </button>
                </Fragment>
              )
            })}
          </div>
          {install && install.deps.length > 0 && (
            <p className="mt-auto hidden border-t border-line px-3.5 py-3 text-[12px] leading-relaxed text-fg-muted md:block">
              Installs with {install.deps.length} {install.deps.length === 1 ? 'item' : 'items'} from the registry:{' '}
              <span className="text-fg">{install.deps.slice(0, 6).join(', ')}</span>
              {install.deps.length > 6 && <> and {install.deps.length - 6} more</>}.
            </p>
          )}
        </div>
        <div
          role="tabpanel"
          id={`${idBase}-source`}
          aria-labelledby={`${idBase}-file-${files.indexOf(active)}`}
          aria-busy={loaded.status === 'loading' || undefined}
          className="flex min-h-0 min-w-0 flex-col"
        >
          <div className="flex h-10 shrink-0 items-center gap-2 border-b border-line ps-2 pe-2">
            {toggle && (
              <button
                type="button"
                aria-expanded={treeOpen}
                aria-controls={treeId}
                aria-label={treeOpen ? 'Hide the file tree' : 'Show the file tree'}
                title={treeOpen ? 'Hide the file tree' : 'Show the file tree'}
                onClick={() => setTreeOpen((v) => !v)}
                className={cn('icon-button size-7 rounded-md', treeOpen && 'bg-selected text-fg')}
              >
                <FolderIcon size={15} strokeWidth={1.6} aria-hidden />
              </button>
            )}
            <span className={cn('min-w-0 flex-1 truncate type-small text-fg-muted', !toggle && 'ps-1.5')}>{active.path}</span>
            <CopyButton value={text} disabled={text === undefined} label={`Copy ${active.path.split('/').at(-1)}`} />
          </div>
          <div ref={source} tabIndex={0} aria-label={`${active.path} source`} className="code-panel scroll-fade min-h-0 flex-1 overflow-auto focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none focus-visible:ring-inset">
            {'code' in active ? active.highlighted : <CodeSource state={loaded} />}
          </div>
        </div>
      </div>
    </div>
  )
}

/** The files as a .zip, saved from the browser. */
function DownloadButton({ files, name }: { files: CodeFile[]; name: string }) {
  const k = useYouj()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const save = async () => {
    setSaving(true)
    let texts: string[]
    try {
      // Published files that haven't been shown yet are fetched now (each once, lib/code-load.ts).
      texts = await Promise.all(files.map((f) => ('code' in f ? f.code : loadCode(f.src).then((body) => body.code))))
    } catch {
      return
    } finally {
      setSaving(false)
    }
    const bytes = zip(files.map((f, i) => ({ path: f.path, content: `${texts[i]}\n` })))
    const url = URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer], { type: 'application/zip' }))
    const link = Object.assign(document.createElement('a'), { href: url, download: `${name}.zip` })
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
    setSaved(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setSaved(false), k.ms('deliberate') * 3)
  }

  return (
    <button type="button" onClick={save} disabled={saving} aria-busy={saving || undefined} aria-label={saved ? `Saved ${name}.zip` : `Download ${name}.zip`} title={`Download ${name}.zip`} className="icon-button size-7 rounded-md disabled:opacity-60">
      <DownloadIcon size={15} strokeWidth={1.6} active={saved} />
      <span aria-live="polite" className="sr-only">
        {saved ? `Saved ${name}.zip` : ''}
      </span>
    </button>
  )
}

function lines(code: string) {
  return code.split('\n').length
}

/** The folder every path shares: `examples/mail` for its files. */
function commonFolder(paths: string[]): string {
  const parts = paths.map((p) => p.split('/').slice(0, -1))
  const first = parts[0] ?? []
  let n = 0
  while (n < first.length && parts.every((p) => p[n] === first[n])) n++
  return first.slice(0, n).join('/')
}
