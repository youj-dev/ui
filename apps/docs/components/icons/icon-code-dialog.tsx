'use client'

import { BracesIcon, CodeIcon, FileCodeIcon, TerminalIcon } from '@youj/icons'
import { highlightTsx } from '@/components/create/highlight'
import { CodeExportDialog, ExportCode, ExportCommand, ExportSection, type CodeExportDialogProps, type CodeExportSection } from '@/components/ui/code-export-dialog'
import { categoryLabel, isState, type Entry, type IconEntry } from './catalog'
import { chainInstall, chainSnippet, ICONS_PACKAGE, installCommands, snippetsFor, type SnippetOptions } from './snippets'
import type { IconNode } from './static-svg'

/* An icon's code, in the site's large code modal (the same one a scene's
 * code and Create's export open), one section at a time: the React to paste
 * (with its import), the icon at rest as SVG and as JSX with no dependency,
 * and how to install it (the package, or the icon copied in with the CLI).
 * Every snippet is drawn as the explorer is set: size, stroke and color, and
 * the trigger, effect and transition the details panel picked. Loaded the
 * first time it opens (the explorer imports it lazily). */

export interface IconCodeDialogProps {
  entry: Entry
  /** The icon at rest, for SVG and JSX; null for a pair (an IconSwap has no single rest drawing). */
  nodes: IconNode[] | null
  options: SnippetOptions
  /** The chain: the code steps through these with IconSwap. */
  chain?: readonly IconEntry[]
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The control that opened it, which gets focus back. */
  finalFocus?: CodeExportDialogProps['finalFocus']
  onOpenChangeComplete?: (open: boolean) => void
}

const icon = { size: 16, strokeWidth: 1.75 }

const Mono = ({ children }: { children: string }) => <code className="code-inline [overflow-wrap:anywhere]">{children}</code>

const code = (text: string, title: string, label: string) => (
  <ExportCode code={text} title={title} label={label}>
    {highlightTsx(text)}
  </ExportCode>
)

function describe(entry: Entry) {
  if (entry.kind === 'youj') return `${entry.component} · ${categoryLabel(entry.category)}`
  return `IconSwap · ${entry.from.component} → ${entry.to.component}`
}

function usageNote(entry: Entry, chain?: readonly IconEntry[]) {
  if (chain)
    return (
      <>
        One <Mono>IconSwap</Mono> between consecutive icons, stepping round the list; advance <Mono>step</Mono> yourself (a click, say) instead of the timer if you like.
      </>
    )
  if (entry.kind === 'pair')
    return (
      <>
        Drive it with <Mono>active</Mono> for a state, or pass <Mono>progress</Mono> (a number or a MotionValue) to scrub it yourself.
      </>
    )
  if (isState(entry))
    return (
      <>
        A state icon: <Mono>active</Mono> turns it from {entry.states![0]} to {entry.states![1]}, from wherever it is.
      </>
    )
  return <>It plays its choreography on hover by default; pass a trigger to change that.</>
}

export default function IconCodeDialog({ entry, nodes, options, chain, open, onOpenChange, onOpenChangeComplete, finalFocus }: IconCodeDialogProps) {
  const snippets = snippetsFor(entry, nodes, options)
  const react = chain ? { ...snippets[0]!, code: chainSnippet(chain, options) } : snippets.find((s) => s.id === 'react')!
  const svg = snippets.find((s) => s.id === 'svg')
  const jsx = snippets.find((s) => s.id === 'jsx')
  const install = chain ? chainInstall(chain) : installCommands(entry)
  const file = chain ? 'icon-chain' : entry.kind === 'pair' ? `${entry.from.name}-to-${entry.to.name}` : entry.name

  const sections: CodeExportSection[] = [
    {
      value: 'react',
      label: 'React',
      icon: <CodeIcon {...icon} />,
      description: 'With its import, drawn as you’ve set it here: size, stroke and color.',
      content: (
        <div className="flex flex-col gap-3">
          {code(react.code, `${file}.tsx`, 'React code')}
          <p className="max-w-[44rem] text-[12.5px] leading-relaxed text-pretty text-fg-muted">{usageNote(entry, chain)}</p>
        </div>
      ),
    },
  ]
  if (svg)
    sections.push({
      value: 'svg',
      label: 'SVG',
      icon: <FileCodeIcon {...icon} />,
      description: 'The icon at rest as a standalone file: no motion, no dependency.',
      content: code(svg.code, `${file}.svg`, 'SVG code'),
    })
  if (jsx)
    sections.push({
      value: 'jsx',
      label: 'JSX',
      icon: <BracesIcon {...icon} />,
      description: 'The same drawing as JSX, to paste into a component.',
      content: code(jsx.code, `${file}.tsx`, 'JSX code'),
    })
  sections.push({
    value: 'install',
    label: 'Install',
    icon: <TerminalIcon {...icon} />,
    description: `From the package, or just ${entry.kind === 'pair' ? 'these' : 'this one'} copied into your app.`,
    content: (
      <div className="flex max-w-[52rem] flex-col gap-7">
        <ExportSection title="From the package" note={`Every icon is in ${ICONS_PACKAGE}.`}>
          <ExportCommand command={install.packageCommand} label="Package install command" />
        </ExportSection>
        <ExportSection
          title="Or copy it in"
          note={
            <>
              Copies the source into your app with the Youj CLI, beside the motion it plays with.
            </>
          }
        >
          {install.cli.map((command) => (
            <ExportCommand key={command} command={command} label={command.startsWith('npx') ? 'Copy-in command' : 'Peer install command'} />
          ))}
        </ExportSection>
      </div>
    ),
  })

  return <CodeExportDialog open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete} finalFocus={finalFocus} title={chain ? 'Chain' : entry.name} description={chain ? `IconSwap · ${chain.length} icons` : describe(entry)} navLabel="The code" sections={sections} />
}
