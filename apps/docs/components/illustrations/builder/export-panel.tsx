'use client'

import { useMemo, useState, type ReactElement, type RefObject } from 'react'
import { BracesIcon, CodeIcon, DownloadIcon, LinkIcon, TerminalIcon } from '@youj/icons'
import {
  Button,
  AsyncButton,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  toast,
} from '@youj/react'
import { highlightTsx } from '@/components/create/highlight'
import { CodeExportDialog, ExportCode, ExportCommand } from '@/components/ui/code-export-dialog'
import { download, fileName, naturalSize, rasterize, serializeScene } from '../export'
import { generateCode, installItems } from '@youj/illustrations/builder'
import { sceneSlug, toJson, type BuilderScene } from '@youj/illustrations/builder'
import { copyToast } from '@/lib/copy-toast'

/* Taking the scene home: the component (the kit's own shapes on the stage,
 * as a shipped scene is written), the command that installs what it draws
 * with, the scene as JSON, a link back to it, and the frame as an SVG or a
 * PNG in the preview's theme (from a still copy: finished, not bobbing).
 * The panel keeps the actions on its bottom edge; the code opens in the
 * site's large code modal, a section each for the component, the kit's
 * install and the JSON, so it never squeezes into the panel. */

export interface ExportPanelProps {
  scene: BuilderScene
  link: string
  /** The still copy the files are made from, and the stage whose canvas color a background takes. */
  still: RefObject<HTMLDivElement | null>
  /** "Basalt, dark": what a saved file looks like. */
  look: string
}

/** Saves the still frame as an SVG, or a PNG at a scale; the message to show, or throws. */
export async function saveFrame(still: HTMLElement, scene: BuilderScene, kind: 'svg' | 'png', scale: number, transparent: boolean) {
  const svg = still.querySelector('svg')
  if (!svg) throw new Error('No drawing to save')
  const stage = still.closest('[data-slot=illustration-stage]')
  const background = transparent || !stage ? undefined : getComputedStyle(stage).backgroundColor
  const text = serializeScene(svg, { title: scene.name, scale, background })
  const name = fileName(sceneSlug(scene.name), kind, kind === 'png' ? scale : 1)
  if (kind === 'svg') download(text, name)
  else {
    const { width, height } = naturalSize(svg)
    download(await rasterize(text, Math.round(width * scale), Math.round(height * scale)), name)
  }
  return name
}

/** The frame as an SVG or a PNG, behind the menu `trigger`. */
function DownloadMenu({ scene, still, look, trigger }: ExportPanelProps & { trigger: ReactElement }) {
  const [transparent, setTransparent] = useState(true)
  const save = async (kind: 'svg' | 'png', scale = 1) => {
    const el = still.current
    if (!el) return
    try {
      const name = await saveFrame(el, scene, kind, scale, transparent)
      toast.success(`Saved ${name}`, { id: 'builder-download', description: `${scene.name} in ${look}${transparent ? ', transparent' : ''}.` })
    } catch {
      toast.error('Couldn’t make the file', { id: 'builder-download', description: 'The browser blocked the drawing.' })
    }
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent align="end" sideOffset={6} className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{look}</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => save('svg')}>
            SVG
            <span className="ms-auto type-label text-fg-subtle">{fileName(sceneSlug(scene.name), 'svg')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => save('png', 1)}>
            PNG 1×
            <span className="ms-auto type-label text-fg-subtle">.png</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => save('png', 2)}>
            PNG 2×
            <span className="ms-auto type-label text-fg-subtle">@2x.png</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={transparent} onCheckedChange={setTransparent} closeOnClick={false}>
          Transparent background
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** The panel's bottom edge: the link and the download at hand, and the code in the modal. */
export function ExportPanel(props: ExportPanelProps) {
  const { scene, link } = props
  const code = useMemo(() => generateCode(scene, { link }), [scene, link])
  const json = useMemo(() => toJson(scene), [scene])
  const highlighted = useMemo(() => highlightTsx(code), [code])
  const install = `npx youj add ${installItems(scene).join(' ')}`
  const component = /export function (\w+)/.exec(code)?.[1] ?? 'Illustration'

  const icon = { size: 16, strokeWidth: 1.75 }

  return (
    <div className="flex flex-col gap-2">
      <CodeExportDialog
        trigger={
          <Button className="w-full">
            <CodeIcon size={15} strokeWidth={1.75} />
            Get the code
          </Button>
        }
        title={scene.name === 'Untitled' ? 'Your scene' : scene.name}
        description="Your scene as a component, its kit and JSON."
        navLabel="The code"
        sections={[
          {
            value: 'component',
            label: 'Component',
            icon: <CodeIcon {...icon} />,
            description: 'It draws exactly what the canvas shows, with the kit it draws with copied into your app (see Install). The link in its first line opens it here again.',
            content: (
              <ExportCode code={code} title={`${component}.tsx`} label={`${scene.name} as a component`}>
                {highlighted}
              </ExportCode>
            ),
          },
          {
            value: 'install',
            label: 'Install',
            icon: <TerminalIcon {...icon} />,
            description: 'The isometric kit and the shapes this scene uses, copied into your app. Run it once and every scene you build draws with it.',
            content: (
              <div className="flex max-w-[52rem] flex-col gap-3">
                <ExportCommand command={install} label="Install command" />
                <p className="max-w-[44rem] text-[12.5px] leading-relaxed text-pretty text-fg-muted">
                  Then save the component in your app and render it like any scene: <code className="code-inline">{`<${component} />`}</code>.
                </p>
              </div>
            ),
          },
          {
            value: 'json',
            label: 'JSON',
            icon: <BracesIcon {...icon} />,
            description: 'Its parts, groups and name: the builder’s own format, for keeping the scene or building on it.',
            content: (
              <ExportCode code={json} title={`${sceneSlug(scene.name)}.json`} label={`${scene.name} as JSON`}>
                {highlightTsx(json)}
              </ExportCode>
            ),
          },
        ]}
      />
      <div className="grid grid-cols-2 gap-2">
        <AsyncButton variant="outline" onAction={() => navigator.clipboard.writeText(link).then(() => copyToast('Link copied', 'To this illustration.'))} successLabel="Copied" errorLabel="Blocked">
          <LinkIcon size={15} strokeWidth={1.75} />
          Copy link
        </AsyncButton>
        <DownloadMenu
          {...props}
          trigger={
            <Button variant="outline">
              <DownloadIcon size={15} strokeWidth={1.75} />
              Download
            </Button>
          }
        />
      </div>
    </div>
  )
}
