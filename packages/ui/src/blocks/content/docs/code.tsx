'use client'

import { Fragment, useState } from 'react'
import { CodeIcon, CopyIcon } from '@youj/icons'
import { AsyncButton } from '../../../components/ui/async-button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'

const KEYWORDS = /\b(import|from|const|await|new|export|return|async|function)\b/

/** A tiny highlighter: strings, keywords and comments, from the theme's tokens. */
function Highlight({ code }: { code: string }) {
  return (
    <>
      {code.split('\n').map((line, i) => {
        const comment = line.indexOf('//')
        const [text, note] = comment >= 0 ? [line.slice(0, comment), line.slice(comment)] : [line, '']
        const parts = text.split(/('[^']*'|\b(?:import|from|const|await|new|export|return|async|function)\b)/)
        return (
          <Fragment key={i}>
            {parts.map((part, j) =>
              part.startsWith("'") ? (
                <span key={j} className="text-success-text">
                  {part}
                </span>
              ) : KEYWORDS.test(part) ? (
                <span key={j} className="text-accent-text">
                  {part}
                </span>
              ) : (
                part
              ),
            )}
            {note && <span className="text-fg-muted italic">{note}</span>}
            {'\n'}
          </Fragment>
        )
      })}
    </>
  )
}

const DEFAULT_LABELS = {
  copy: 'Copy',
  copyCode: 'Copy code',
  copied: 'Copied',
  copyFailed: 'Couldn’t copy',
  packageManager: 'Package manager',
}
type CodeLabels = Partial<typeof DEFAULT_LABELS>

function CopyButton({ text, labels }: { text: string; labels: typeof DEFAULT_LABELS }) {
  return (
    <AsyncButton variant="ghost" size="xs" successLabel={labels.copied} errorLabel={labels.copyFailed} onAction={() => navigator.clipboard?.writeText(text)} aria-label={labels.copyCode}>
      <CopyIcon size={13} /> {labels.copy}
    </AsyncButton>
  )
}

export function CodeBlock({ title, code, labels }: { title: string; code: string; labels?: CodeLabels }) {
  return (
    <figure className="overflow-hidden rounded-lg border border-line bg-surface">
      <figcaption className="flex h-10 items-center gap-2 border-b border-line ps-4 pe-2 text-ui-sm text-fg-muted">
        <CodeIcon size={14} />
        <span className="me-auto font-mono">{title}</span>
        <CopyButton text={code} labels={{ ...DEFAULT_LABELS, ...labels }} />
      </figcaption>
      <pre className="overflow-x-auto p-4 font-mono text-ui-sm leading-relaxed text-fg">
        <code>
          <Highlight code={code} />
        </code>
      </pre>
    </figure>
  )
}

const MANAGERS = [
  { id: 'pnpm', command: 'pnpm add @northstar/sdk' },
  { id: 'npm', command: 'npm install @northstar/sdk' },
  { id: 'yarn', command: 'yarn add @northstar/sdk' },
  { id: 'bun', command: 'bun add @northstar/sdk' },
]

export function InstallBlock({ labels: labelsProp }: { labels?: CodeLabels }) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp }
  const [manager, setManager] = useState('pnpm')
  const command = MANAGERS.find((m) => m.id === manager)!.command
  return (
    <Tabs value={manager} onValueChange={(value) => setManager(value as string)} className="gap-0 overflow-hidden rounded-lg border border-line bg-surface">
      <div className="relative">
        {/* On the command's inset, clear of the copy button at the end. */}
        <TabsList inset aria-label={labels.packageManager} className="me-12 [--tabs-inset:--spacing(4)]">
          {MANAGERS.map((m) => (
            <TabsTrigger key={m.id} value={m.id} className="font-mono">
              {m.id}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="absolute end-2 top-1/2 -translate-y-1/2">
          <CopyButton text={command} labels={labels} />
        </div>
      </div>
      {MANAGERS.map((m) => (
        <TabsContent key={m.id} value={m.id}>
          <pre className="overflow-x-auto p-4 font-mono text-ui-sm text-fg">
            <code>
              <span aria-hidden className="text-fg-muted select-none">$ </span>
              {m.command}
            </code>
          </pre>
        </TabsContent>
      ))}
    </Tabs>
  )
}
