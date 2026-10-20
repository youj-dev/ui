'use client'

import { useState, type ReactElement } from 'react'
import Link from 'next/link'
import { ThemeScope } from '@youj/core'
import type { InternalThemeId as ThemeId } from '@youj/core/lib/youj/theme'
import { ArrowRightIcon, CheckIcon, CodeIcon, DownloadIcon, FileCodeIcon, LayoutGridIcon, SlidersIcon } from '@youj/icons'
import { sceneViewBox } from '@youj/illustrations'
import { SegmentedControl, SegmentedControlItem } from '@youj/react'
import type { Scheme } from '@/components/showroom/hooks'
import { Mono, PropsSheet, RegistrySource, RouteSwitch, UseCode, UseInstall, UsePreview, UseStep, UseSteps, type Route } from '@/components/showroom/use-dialog'
import { CodeExportDialog, type CodeExportDialogProps } from '@/components/ui/code-export-dialog'
import { cn } from '@/lib/cn'
import type { ComponentDoc } from '@/lib/props'
import { sitePreset } from '@/lib/preview'
import type { BlockLink, SceneEntry } from './catalog'
import { fileName } from './export'
import { byIdSnippet, copiedSnippet, directSnippet, GRAPHICS_PACKAGE, installedPath, itemName } from './snippets'
import { Stage } from '@/components/site/stage'

/* A scene's Use it, in the site's large code modal on the showroom's grammar (components/showroom/use-dialog): the
 * scene floating at the head of the nav, then Use it (1 install the package or copy the scene in, 2 the code: by id
 * through <Illustration>, or as its own component), Download (the frame as the stage draws it, as SVG or PNG at 1× or
 * 2×, transparent or on its canvas), its props, the blocks that take it, and its source as the CLI installs it (read
 * from the site's registry the first time it's shown). */

/** How the stage's frame is saved as a file: in the look it's drawn in (`Basalt, dark`), as SVG or PNG at a scale. */
export interface SceneDownload {
  look: string
  save: (kind: 'svg' | 'png', scale: number, transparent: boolean) => Promise<void>
}

/** The look the stage draws the scene in: its preset and light or dark. */
export interface SceneLook {
  preset: ThemeId
  mode: Scheme
  /** The preset isn't the site's for the mode, so it's scoped. */
  themed: boolean
}

/** Every scene frames the same volume: the file's size at 1×. */
const FRAME = sceneViewBox([8, 8, 3], 22, 10)

const FILES = [
  { kind: 'svg', scale: 1, name: 'SVG', note: 'Vector, its colors resolved' },
  { kind: 'png', scale: 1, name: 'PNG', note: `${Math.round(FRAME.width)} × ${Math.round(FRAME.height)}` },
  { kind: 'png', scale: 2, name: 'PNG 2×', note: `${Math.round(FRAME.width * 2)} × ${Math.round(FRAME.height * 2)}, for sharp screens` },
] as const

type Saving = { name: string; state: 'saving' | 'saved' | 'failed' } | null

/** The frame's files as cards, each a button that saves it, under the frame on the background they're saved on. */
function SceneFiles({ scene, download, look }: { scene: SceneEntry; download: SceneDownload; look?: SceneLook }) {
  const [transparent, setTransparent] = useState(true)
  const [saving, setSaving] = useState<Saving>(null)
  const save = async (file: (typeof FILES)[number], name: string) => {
    setSaving({ name, state: 'saving' })
    try {
      await download.save(file.kind, file.scale, transparent)
      setSaving({ name, state: 'saved' })
    } catch {
      setSaving({ name, state: 'failed' })
    }
    window.setTimeout(() => setSaving((was) => (was?.name === name ? null : was)), 1600)
  }
  const mode = look?.mode ?? 'dark'
  return (
    <div className="swap-in flex max-w-[52rem] flex-col gap-4">
      {/* What the files hold: the frame, finished and still, on a checkerboard while it's transparent, else on the stage's canvas. */}
      <ThemeScope theme={look?.themed ? sitePreset(look.preset) : undefined}>
        <Stage
          theme={look?.themed ? look.preset : undefined}
          aria-hidden
          mode={mode}
          className={cn(
            'grid h-44 place-items-center overflow-hidden rounded-xl border border-line transition-[background-color] duration-(--yj-duration-fast) ease-standard @max-md:h-36',
            transparent ? '[background:repeating-conic-gradient(var(--color-line)_0_25%,transparent_0_50%)_50%/14px_14px] bg-canvas' : 'bg-canvas',
          )}
        >
          <div className="w-[min(15rem,70%)]">
            <scene.Component assemble={false} float={false} explode={0} unit={22} grow />
          </div>
        </Stage>
      </ThemeScope>
      <ul className="grid gap-3 @xl:grid-cols-3">
        {FILES.map((file) => {
          const name = fileName(scene.id, file.kind, file.scale)
          const state = saving?.name === name ? saving.state : null
          return (
            <li key={name}>
              <button
                type="button"
                aria-label={`Download ${name}`}
                aria-busy={state === 'saving' || undefined}
                onClick={() => void save(file, name)}
                className={cn(
                  'group/file flex w-full cursor-pointer flex-col gap-3 rounded-xl border border-line bg-surface p-4 text-start outline-none focus-ring',
                  'transition-[border-color,background-color,translate] duration-(--yj-duration-fast) ease-standard hover:border-line-strong active:translate-y-px motion-reduce:active:translate-y-0',
                )}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[11px] font-medium tracking-[0.08em] text-fg uppercase">{file.name}</span>
                  <span
                    className={cn(
                      'grid size-7 place-items-center rounded-md border border-line text-fg-muted transition-colors duration-(--yj-duration-fast) ease-standard group-hover/file:text-fg',
                      state === 'saved' && 'border-transparent bg-success-subtle text-success',
                      state === 'failed' && 'border-transparent bg-danger-subtle text-danger',
                    )}
                  >
                    {state === 'saved' ? <CheckIcon size={14} strokeWidth={2.25} trigger="mount" /> : <DownloadIcon size={14} strokeWidth={1.75} />}
                  </span>
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-mono text-[12px] text-fg">{name}</span>
                  <span className="truncate text-[12px] text-fg-muted" aria-live="polite">
                    {state === 'saved' ? 'Saved' : state === 'failed' ? 'Couldn’t save it' : file.note}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span id="scene-background" className="text-[12.5px] text-fg-muted">
          Background
        </span>
        <SegmentedControl aria-labelledby="scene-background" size="sm" value={transparent ? 'none' : 'canvas'} onValueChange={(next) => setTransparent(next === 'none')}>
          <SegmentedControlItem value="none" className="px-3 text-[12.5px]">
            Transparent
          </SegmentedControlItem>
          <SegmentedControlItem value="canvas" className="px-3 text-[12.5px]">
            The canvas
          </SegmentedControlItem>
        </SegmentedControl>
      </div>
    </div>
  )
}

const icon = { size: 16, strokeWidth: 1.75 }

interface SceneCodeDialogProps extends Pick<CodeExportDialogProps, 'open' | 'onOpenChange' | 'onOpenChangeComplete' | 'finalFocus'> {
  scene: SceneEntry
  blocks: BlockLink[]
  /** The props every scene takes (read on the server). */
  props?: ComponentDoc
  /** Saving the stage's frame as a file, when there's a stage to save. */
  download?: SceneDownload
  /** The look the stage draws it in, which the preview wears. */
  look?: SceneLook
  /** The button that opens it; or leave it out and drive it with `open`. */
  trigger?: ReactElement
}

export function SceneCodeDialog({ scene, blocks, props, download, look, trigger, ...dialog }: SceneCodeDialogProps) {
  const [route, setRoute] = useState<Route>('package')
  const path = `${installedPath(scene.id).replace(/^@\//, '')}.tsx`
  return (
    <CodeExportDialog
      {...dialog}
      trigger={trigger}
      title={scene.name}
      description={`${scene.component} · ${scene.categoryName}`}
      preview={
        <UsePreview scheme={look?.mode ?? 'dark'}>
          <ScenePreview scene={scene} look={look} />
        </UsePreview>
      }
      navLabel="The code"
      sections={[
        {
          value: 'use',
          label: 'Use it',
          icon: <CodeIcon {...icon} />,
          description: route === 'package' ? `Install ${GRAPHICS_PACKAGE}, then put the scene on a page: by its id, or as its own component.` : 'Copy just this scene into your app, then put it on a page.',
          end: <RouteSwitch value={route} onChange={setRoute} />,
          content: (
            <UseSteps>
              <UseStep
                n={1}
                title="Install"
                note={route === 'package' ? `Every scene is in ${GRAPHICS_PACKAGE}, on @youj/motion.` : `Writes ${path} and the kit it’s drawn with.`}
              >
                {route === 'package' ? (
                  <UseInstall install={{ kind: 'package', packages: GRAPHICS_PACKAGE }} label="Package install command" />
                ) : (
                  <UseInstall install={{ kind: 'cli', run: `add ${itemName(scene.id)}` }} label="Copy-in command" />
                )}
              </UseStep>
              <UseStep n={2} title="Put it on a page" note={route === 'package' ? 'By id is what a block’s illustration slot takes, too.' : undefined}>
                <UseCode
                  key={route}
                  label="Ways to write it"
                  variants={
                    route === 'package'
                      ? [
                          { value: 'id', label: 'By id', file: 'page.tsx', code: byIdSnippet(scene) },
                          { value: 'component', label: 'The component', file: 'page.tsx', code: directSnippet(scene) },
                        ]
                      : [{ value: 'copy', label: 'The copied component', file: 'page.tsx', code: copiedSnippet(scene) }]
                  }
                />
              </UseStep>
            </UseSteps>
          ),
        },
        ...(download
          ? [
              {
                value: 'download',
                label: 'Download',
                icon: <DownloadIcon {...icon} />,
                description: `The frame as the stage draws it: ${download.look}.`,
                content: <SceneFiles scene={scene} download={download} look={look} />,
              },
            ]
          : []),
        ...(props
          ? [
              {
                value: 'props',
                label: 'Props',
                icon: <SlidersIcon {...icon} />,
                description: 'Every scene takes the same props, by id or as its own component.',
                content: <PropsSheet doc={props} />,
              },
            ]
          : []),
        {
          value: 'block',
          label: 'In a block',
          icon: <LayoutGridIcon {...icon} />,
          description: (
            <>
              Blocks with room for a picture take an <Mono>illustration</Mono> prop: pass <Mono>{`"${scene.id}"`}</Mono>, your own node, or <Mono>null</Mono> for none. On their pages the preview’s
              Illustration menu swaps it in live.
            </>
          ),
          content: (
            <div className="swap-in flex max-w-[52rem] flex-col gap-6">
              <UseCode label="In a block" variants={[{ value: 'block', label: 'In a block', file: 'page.tsx', code: `<NoResults illustration="${scene.id}" />` }]} />
              {blocks.length > 0 && (
                <section className="flex flex-col gap-2">
                  <h3 className="text-[13.5px] font-medium text-fg">Blocks that take it</h3>
                  <ul className="grid gap-x-6 @lg:grid-cols-2">
                    {blocks.map((b) => (
                      <li key={b.href}>
                        <Link
                          prefetch={false}
                          href={b.href}
                          className="group/link -mx-2 flex h-9 items-center gap-2 rounded-md px-2 text-[12.5px] text-fg-muted transition-colors duration-(--yj-duration-fast) ease-standard hover:bg-hover hover:text-fg focus-ring"
                        >
                          <span className="text-fg-subtle">{b.group} /</span>
                          <span className="truncate text-fg">{b.title}</span>
                          <ArrowRightIcon size={13} strokeWidth={1.8} className="ms-auto shrink-0 text-fg-subtle rtl:-scale-x-100" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          ),
        },
        {
          value: 'source',
          label: 'Source',
          icon: <FileCodeIcon {...icon} />,
          description: (
            <>
              What <Mono>{`npx @youj/cli add ${itemName(scene.id)}`}</Mono> writes into your app.
            </>
          ),
          content: <RegistrySource item={itemName(scene.id)} path={path} />,
        },
      ]}
    />
  )
}

/** The scene as the stage draws it (its preset, light or dark), floating, finished. */
function ScenePreview({ scene, look }: { scene: SceneEntry; look?: SceneLook }) {
  const { Component } = scene
  return (
    <ThemeScope theme={look?.themed ? sitePreset(look.preset) : undefined}>
      <div className="w-[84%]">
        <Component assemble={false} float explode={0} unit={22} grow />
      </div>
    </ThemeScope>
  )
}
