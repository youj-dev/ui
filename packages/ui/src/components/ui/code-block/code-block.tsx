'use client'

import { useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { useSoundCue } from '@youj/core'
import { AsyncAnnouncer } from '@youj/motion'
import { CopyIcon } from '@youj/icons/components/youj/icons/copy'
import { useYouj } from '@youj/core/lib/youj/provider'
import { useComponentLabels } from '@youj/core/labels'
import { codeBlockLabels } from '@youj/core/labels'
import { cn } from '../../../lib/utils'
import { Button } from '../button'
import { ScrollArea } from '../scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip'
import { highlight, type CodeTokenKind } from './code-block-highlight'

/* A block of code on a recessed panel: a header with the file name or the
 * language and a copy button, then the code, highlighted, scrolling sideways
 * rather than wrapping (a ScrollArea, so the bar appears only when needed).
 * Highlighting is the same small tokenizer the chat uses: tokens, never
 * HTML, so code from anywhere is safe to show. Copy is youj's CopyIcon:
 * the back sheet tucks behind the front one and a check is written on it,
 * then it all eases back after a beat (3 × deliberate). The tooltip reads
 * "Copied" meanwhile and the result is announced; a clipboard that refuses
 * says so. Reduced motion: the icon swaps to the check at once. */

type CopyState = 'idle' | 'copied' | 'error'

/** Copies text and reports it: `copied` holds for 3 × deliberate, a refusal is `error`. With sound on, each plays its cue as the icon answers. */
export function useCopyText(onSettled?: (state: 'copied' | 'error') => void, sound = true) {
  const k = useYouj()
  const cue = useSoundCue()
  const [state, setState] = useState<CopyState>('idle')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      clearTimeout(timer.current)
    }
  }, [])
  const copy = (text: string) => {
    const settle = (next: 'copied' | 'error') => {
      if (!mounted.current) return
      setState(next)
      onSettled?.(next)
      if (sound) cue(next === 'copied' ? 'success' : 'error')
      clearTimeout(timer.current)
      timer.current = setTimeout(() => mounted.current && setState('idle'), k.ms('deliberate') * 3)
    }
    // The clipboard can refuse (no permission, an insecure page): say so rather than pretend.
    Promise.resolve()
      .then(() => navigator.clipboard.writeText(text))
      .then(
        () => settle('copied'),
        () => settle('error'),
      )
  }
  return { state, copy }
}

/** The youj code palette, by token kind (DiffViewer draws with it too). */
export const tokenClass: Record<CodeTokenKind, string> = {
  keyword: 'own:text-accent-text',
  string: 'own:text-success-text',
  number: 'own:text-warning-text',
  comment: 'own:text-fg-subtle',
  function: 'own:text-fg',
  type: 'own:text-fg',
  property: 'own:text-accent-text',
  tag: 'own:text-accent-text',
  punctuation: 'own:text-fg-muted',
  inserted: 'own:text-success-text',
  deleted: 'own:text-danger-text',
  meta: 'own:text-fg-muted',
}

const LANGUAGE_NAMES: Record<string, string> = {
  js: 'JavaScript',
  jsx: 'JSX',
  ts: 'TypeScript',
  tsx: 'TSX',
  py: 'Python',
  sh: 'Shell',
  bash: 'Bash',
  json: 'JSON',
  css: 'CSS',
  html: 'HTML',
  sql: 'SQL',
  yaml: 'YAML',
  yml: 'YAML',
  go: 'Go',
  rs: 'Rust',
  rust: 'Rust',
}

/** Highlighted code as spans, in the youj code palette. */
export function CodeTokens({ code, lang }: { code: string; lang: string }) {
  const tokens = useMemo(() => highlight(code, lang), [code, lang])
  return tokens.map((token, index) =>
    token.kind ? (
      <span key={index} className={tokenClass[token.kind]}>
        {token.text}
      </span>
    ) : (
      token.text
    ),
  )
}

function CopyCodeButton({ code, label, sound }: { code: string; label: string; sound: boolean }) {
  const labels = useComponentLabels(codeBlockLabels)
  const { state, copy } = useCopyText(undefined, sound)
  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={<Button variant="ghost" size="icon-xs" sound={sound} />}
          // The tooltip stays through the click, to say "Copied".
          closeOnClick={false}
          aria-label={label}
          data-slot="code-block-copy"
          onClick={() => copy(code)}
        >
          <CopyIcon active={state === 'copied'} size={14} strokeWidth={1.75} />
        </TooltipTrigger>
        <TooltipContent>{state === 'copied' ? labels.copied : state === 'error' ? labels.copyFailed : label}</TooltipContent>
      </Tooltip>
      <AsyncAnnouncer state={state === 'copied' ? 'success' : state === 'error' ? 'error' : 'idle'} successLabel={labels.copied} errorLabel={labels.copyFailed} />
    </>
  )
}

interface CodeBlockProps extends Omit<ComponentProps<'figure'>, 'children'> {
  /** The source to show and copy. */
  code: string
  /** Language for highlighting and the header label: `ts`, `tsx`, `js`, `json`, `css`, `html`, `sh`, `py`, `go`, `rust`, `sql`, `yaml`, `diff`… Anything else is plain text. */
  language?: string
  /** A file name for the header, in place of the language. */
  filename?: string
  /** Number the lines in a gutter that stays put while the code scrolls. Default false. */
  lineNumbers?: boolean
  /** The copy button's name and tooltip. Default "Copy code". */
  copyLabel?: string
  /** Replaces the header's copy button, e.g. with your own actions. */
  actions?: ReactNode
  /** Drawn at the end of the code, inside it: the caret of a streaming answer, say. */
  tail?: ReactNode
  /** With sound on (`YoujProvider`’s `sound`), the copy button plays `tap` and a copy `success`. `false` keeps it silent. Default true. */
  sound?: boolean
}

function CodeBlock({
  code,
  language = '',
  filename,
  lineNumbers = false,
  copyLabel,
  actions,
  tail,
  sound = true,
  className,
  ...props
}: CodeBlockProps) {
  const labels = useComponentLabels(codeBlockLabels)
  copyLabel ??= labels.copyCode
  const name = LANGUAGE_NAMES[language] ?? (language ? language[0]!.toUpperCase() + language.slice(1) : labels.code)
  const lines = lineNumbers ? code.replace(/\n$/, '').split('\n').length : 0
  const body = (
    <ScrollArea orientation="horizontal" aria-label={filename ?? labels.codeBlock(name)} className="min-w-0 flex-1">
      <pre className="w-max min-w-full px-3.5 py-3 font-mono text-[length:var(--text-ui)] leading-5 text-fg">
        <code>
          <CodeTokens code={code} lang={language} />
          {tail}
        </code>
      </pre>
    </ScrollArea>
  )
  return (
    <figure
      data-slot="code-block"
      className={cn('min-w-0 overflow-hidden own:rounded-lg border border-line own:bg-band', className)}
      {...props}
    >
      <figcaption className="flex h-8 items-center justify-between gap-2 border-b border-line ps-3 pe-1">
        {filename ? (
          <span className="own:flex min-w-0 items-center gap-2 own:font-mono own:text-ui-xs">
            <span data-slot="code-block-filename" className="truncate own:text-fg">
              {filename}
            </span>
            {language && <span className="own:text-fg-muted">{language}</span>}
          </span>
        ) : (
          <span className="own:font-mono own:text-ui-xs own:text-fg-muted">{language || 'text'}</span>
        )}
        {actions ?? <CopyCodeButton code={code} label={copyLabel} sound={sound} />}
      </figcaption>
      {lineNumbers ? (
        <div className="own:flex">
          <div
            aria-hidden
            data-slot="code-block-gutter"
            className="shrink-0 border-e border-line py-3 ps-3 pe-2.5 own:text-end own:font-mono own:text-[length:var(--text-ui)] own:leading-5 text-fg-subtle own:tabular-nums select-none"
          >
            {Array.from({ length: lines }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          {body}
        </div>
      ) : (
        body
      )}
    </figure>
  )
}

export { CodeBlock, type CodeBlockProps }
