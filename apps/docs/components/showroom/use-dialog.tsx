'use client'

import { useEffect, useId, useState, type ReactNode } from 'react'
import { Button, SegmentedControl, SegmentedControlItem } from '@youj/react'
import { highlightTsx } from '@/components/create/highlight'
import { InlineCode } from '@/components/docs/inline-code'
import { InstallField, type Install } from '@/components/landing/install-field'
import { TabList } from '@/components/ui/controls'
import { CopyButton } from '@/components/ui/copy-button'
import { Stage } from '@/components/site/stage'
import { cn } from '@/lib/cn'
import type { ComponentDoc } from '@/lib/props'
import type { Scheme } from './hooks'

/* What every showroom's Use it is made of, one grammar in every area, inside the site's large code modal
 * (components/ui/code-export-dialog: the sections in a nav on the inline start, the open one beside it):
 *
 * - UsePreview: the item, small and live, on a stage, over its name at the head of the nav.
 * - Use it, the first section, the quick path in two steps (UseSteps): 1 Install, the site's install field (its
 *   package-manager menu, the command in the code colors, copy), 2 Put it on a page, the code (UseCode). Where the item
 *   can be copied in as well as installed, RouteSwitch (Package | Copy in) at the section's heading switches both.
 * - Props (PropsSheet): every prop, its type and its default, its line under it.
 * - Source (RegistrySource): the file the CLI writes, read from the site's registry the first time it's shown.
 * - An area's own between them: a scene's Download, its In a block.
 *
 * A section comes in with a short fade (at once under reduced motion); a code block's variants are tabs on its bar,
 * its copy button at the bar's end. Everything here is the modal's chunk: nothing loads before Use it is pressed. */

/** The item on a stage, in the stage's light or dark: a small, live picture at the head of the modal's nav. */
export function UsePreview({ scheme, children }: { scheme: Scheme; children: ReactNode }) {
  return (
    <Stage aria-hidden mode={scheme} className="relative isolate grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-[10px] border border-line">
      <div className="pointer-events-none absolute -inset-px -z-10 blueprint opacity-70 [mask-image:radial-gradient(closest-side,black_40%,transparent)]" />
      {children}
    </Stage>
  )
}

/** How the code is taken home: the package, or the item's own source copied in by the CLI. */
export type Route = 'package' | 'copy'

/** Package or Copy in, at the Use it section's heading: the install command and the code follow it. */
export function RouteSwitch({ value, onChange }: { value: Route; onChange: (route: Route) => void }) {
  return (
    <SegmentedControl aria-label="Take it as" size="sm" value={value} onValueChange={(next) => onChange(next as Route)} className="shrink-0">
      <SegmentedControlItem value="package" className="px-3 text-[12.5px]">
        Package
      </SegmentedControlItem>
      <SegmentedControlItem value="copy" className="px-3 text-[12.5px]">
        Copy in
      </SegmentedControlItem>
    </SegmentedControl>
  )
}

/** Numbered steps, each on a rail that runs down to the next. */
export function UseSteps({ children }: { children: ReactNode }) {
  return <ol className="swap-in flex min-w-0 flex-col">{children}</ol>
}

export function UseStep({ n, title, note, children }: { n: number; title: ReactNode; note?: ReactNode; children: ReactNode }) {
  return (
    <li className="group/step grid min-w-0 grid-cols-[1.5rem_minmax(0,1fr)] gap-x-4">
      <div className="flex flex-col items-center">
        <span className="grid size-6 shrink-0 place-items-center rounded-full border border-line bg-surface font-mono text-[11px] font-medium text-fg tabular-nums">{n}</span>
        <span aria-hidden className="mt-1.5 mb-1 w-px flex-1 bg-line group-last/step:hidden" />
      </div>
      <div className="flex min-w-0 flex-col gap-3 pb-8 group-last/step:pb-0">
        <h3 className="flex min-h-6 items-center text-[13.5px] font-medium text-fg">{title}</h3>
        {children}
        {note && <p className="-mt-0.5 max-w-[44rem] text-[12.5px] leading-relaxed text-pretty text-fg-muted">{note}</p>}
      </div>
    </li>
  )
}

/** The install command, in the reader's package manager: the package, or the CLI copying the item in. */
export function UseInstall({ install, label }: { install: Install; label: string }) {
  return <InstallField install={install} label={label} className="w-full" />
}

/** One way to write it: a tab on the code block's bar (`label`), the file it's in, the code. */
export interface CodeVariant {
  value: string
  label: string
  /** The file it goes in, on the bar: `results.tsx`, a path. */
  file?: string
  code: string
}

/**
 * A code block in the site's code style: its bar holds the variants as tabs (or the file's name, for one), the file
 * and the copy button; the code under it, highlighted, scrolling in both directions past its height.
 */
export function UseCode({ variants, label, className }: { variants: CodeVariant[]; /** The variants' tabs' accessible name. */ label: string; className?: string }) {
  const id = useId()
  const [picked, setPicked] = useState(variants[0]!.value)
  const current = variants.find((v) => v.value === picked) ?? variants[0]!
  const tabs = variants.length > 1
  return (
    <figure className={cn('code-block min-w-0 overflow-hidden', className)}>
      <figcaption className="flex h-10 min-w-0 items-center gap-3 border-b border-(--code-line) ps-3 pe-1.5">
        {tabs ? (
          <TabList idBase={id} label={label} variant="pill" compact tabs={variants.map((v) => ({ value: v.value, label: v.label }))} value={current.value} onChange={setPicked} className="-ms-1.5" />
        ) : (
          <span className="min-w-0 truncate font-mono text-[12px] text-fg-muted">{current.file ?? current.label}</span>
        )}
        {tabs && current.file && <span className="ms-auto min-w-0 truncate font-mono text-[11.5px] text-fg-subtle max-sm:hidden">{current.file}</span>}
        <CopyButton value={current.code} label={`Copy ${current.label}`} className={cn('shrink-0', !(tabs && current.file) && 'ms-auto')} />
      </figcaption>
      <div id={tabs ? `${id}-panel-${current.value}` : undefined} role={tabs ? 'tabpanel' : undefined} aria-labelledby={tabs ? `${id}-tab-${current.value}` : undefined}>
        <div
          key={current.value}
          dir="ltr"
          tabIndex={0}
          role="group"
          aria-label={current.label}
          className="code-panel swap-in max-h-[26rem] overflow-auto focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none focus-visible:ring-inset"
        >
          {highlightTsx(current.code)}
        </div>
      </div>
    </figure>
  )
}

/**
 * Every prop of the item, a row each: its name, its type (and the values it takes), its default, and its line under
 * them. Where the section is narrow (a phone) a row reads down instead: the name and its default, then its type and line.
 */
export function PropsSheet({ doc }: { doc: ComponentDoc }) {
  return (
    <div className="swap-in min-w-0 overflow-hidden rounded-xl border border-line">
      <table className="w-full table-fixed border-collapse text-start @max-xl:block">
        <caption className="sr-only">{doc.name} props</caption>
        <colgroup>
          <col className="w-[30%]" />
          <col />
          <col className="w-[20%]" />
        </colgroup>
        <thead className="@max-xl:sr-only">
          <tr className="border-b border-line bg-band">
            {['Prop', 'Type', 'Default'].map((h) => (
              <th key={h} scope="col" className="h-9 px-4 text-start font-mono text-[10.5px] font-medium tracking-[0.08em] text-fg-subtle uppercase">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="@max-xl:block">
          {doc.props.map((prop) => (
            <tr key={prop.name} className="border-b border-line align-top last:border-b-0 @max-xl:flex @max-xl:flex-wrap @max-xl:items-baseline @max-xl:gap-x-3 @max-xl:px-4 @max-xl:py-3">
              <th scope="row" className="px-4 py-3 text-start font-normal @max-xl:p-0">
                <code className={cn('font-mono text-[12.5px] font-medium [overflow-wrap:anywhere] text-fg', prop.deprecated && 'line-through decoration-fg-subtle')}>{prop.name}</code>
                {prop.required && <span className="mt-1 block text-[11px] text-accent-text @max-xl:mt-0 @max-xl:ms-2 @max-xl:inline">Required</span>}
              </th>
              <td className="px-4 py-3 @max-xl:order-last @max-xl:mt-1 @max-xl:w-full @max-xl:p-0">
                <code className="font-mono text-[12px] leading-5 [overflow-wrap:anywhere] text-fg-muted">{prop.type}</code>
                {prop.values && (
                  <span className="mt-1.5 flex flex-wrap gap-1">
                    {prop.values.map((value) => (
                      <code key={value} className="code-inline text-[11px]">
                        {value}
                      </code>
                    ))}
                  </span>
                )}
                {prop.description && (
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-pretty text-fg-muted">
                    <InlineCode text={prop.description} />
                  </p>
                )}
              </td>
              <td className="px-4 py-3 @max-xl:ms-auto @max-xl:p-0">
                {prop.default !== undefined ? (
                  <code className="font-mono text-[12px] leading-5 [overflow-wrap:anywhere] text-fg">
                    <span className="me-1.5 font-sans text-[11px] text-fg-subtle @xl:hidden">default</span>
                    {/* A default written as code in its comment (`md`) is code here already. */}
                    {prop.default.replace(/^`([^`]*)`$/, '$1')}
                  </code>
                ) : (
                  <span className="text-[12px] text-fg-subtle @max-xl:hidden" aria-label="none">
                    –
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {doc.extends && (
        <p className="border-t border-line px-4 py-2.5 text-[12px] [overflow-wrap:anywhere] text-fg-muted">
          Any other prop goes to {doc.extends.length > 1 ? 'one of ' : ''}
          {doc.extends.map((base, i) => (
            <span key={base}>
              {i > 0 && ', '}
              <code className="code-inline">{base}</code>
            </span>
          ))}
          .
        </p>
      )}
    </div>
  )
}

type Source = { status: 'loading' } | { status: 'ready'; code: string; uses: string[] } | { status: 'failed' }

const sources = new Map<string, Promise<{ code: string; uses: string[] }>>()

/** A registry item's first file and what it draws with, fetched once (a failure is forgotten, so it can be tried again). */
function loadSource(item: string) {
  let pending = sources.get(item)
  if (!pending) {
    pending = fetch(`/r/${item}.json`)
      .then((res) => (res.ok ? (res.json() as Promise<{ files?: { content?: string }[]; registryDependencies?: string[] }>) : Promise.reject(new Error(String(res.status)))))
      .then((body) => {
        const code = body.files?.find((f) => f.content)?.content
        if (!code) throw new Error('empty')
        return { code: code.trimEnd(), uses: (body.registryDependencies ?? []).map((d) => d.split('/').at(-1)!.replace(/\.json$/, '')) }
      })
    pending.catch(() => sources.delete(item))
    sources.set(item, pending)
  }
  return pending
}

/** Line lengths for the placeholder, so it reads as code rather than a bar chart. */
const LINES = [58, 34, 0, 72, 46, 64, 28, 0, 52, 40]

/** The file `npx @youj/cli add <item>` writes, as it writes it: read the first time it's shown; meanwhile code-shaped lines. */
export function RegistrySource({ item, path }: { item: string; /** Where it lands in the app, without the @/ alias. */ path: string }) {
  const [attempt, setAttempt] = useState(0)
  const [source, setSource] = useState<Source>({ status: 'loading' })
  useEffect(() => {
    let live = true
    setSource({ status: 'loading' })
    loadSource(item).then(
      (body) => live && setSource({ status: 'ready', ...body }),
      () => live && setSource({ status: 'failed' }),
    )
    return () => {
      live = false
    }
  }, [item, attempt])
  if (source.status === 'ready')
    return (
      <div className="swap-in flex min-w-0 flex-col gap-3">
        <UseCode variants={[{ value: 'source', label: path, file: path, code: source.code }]} label="Source" />
        {source.uses.length > 0 && (
          <p className="text-[12.5px] leading-relaxed text-fg-muted">
            It draws with <span className="text-fg">{source.uses.join(', ')}</span>, which the command brings along.
          </p>
        )}
      </div>
    )
  return (
    <figure className="code-block min-w-0 overflow-hidden">
      <figcaption className="flex h-10 items-center border-b border-(--code-line) ps-3 pe-1.5">
        <span className="min-w-0 truncate font-mono text-[12px] text-fg-muted">{path}</span>
      </figcaption>
      {source.status === 'failed' ? (
        <div role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3.5 text-[13px] text-fg-muted">
          The source didn’t load.
          <Button variant="outline" size="sm" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </Button>
        </div>
      ) : (
        <div aria-busy className="loading-in px-4 py-3.5">
          <span className="sr-only">Reading the source…</span>
          <div aria-hidden className="flex flex-col">
            {LINES.map((width, i) => (
              <span key={i} className="flex h-[1.7em] items-center text-[12.75px]">
                {width > 0 && <span className="h-[0.6em] rounded-sm bg-line" style={{ width: `${width}%` }} />}
              </span>
            ))}
          </div>
        </div>
      )}
    </figure>
  )
}

/** A word of the code in running text. */
export const Mono = ({ children }: { children: string }) => <code className="code-inline [overflow-wrap:anywhere]">{children}</code>
