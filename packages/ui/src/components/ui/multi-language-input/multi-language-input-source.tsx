'use client'

import { cn } from '../../../lib/utils'
import { scriptTypography, type LocaleInfo } from './multi-language-input-locales'
import { diffWords, needsWork, type TranslationStatus } from './multi-language-input-model'
import { StatusGlyph } from './multi-language-input-status'

/* The source beside its translation (side-by-side view): read-only, in the
 * source's own language and direction, and read to screen readers as the
 * translation field's description. When the translation is outdated it
 * marks what changed in the source since: new words tinted, removed words
 * struck through, so a translator updates the part that moved instead of
 * rereading everything. Both panes carry a caption, so the two texts start
 * on one line. The pane fades in beside the field as the view changes. */

/** A pane's caption: its code, its name and, for the translation, its status. */
function PaneCaption({ code, label, status, hidden }: { code: string; label: string; status?: TranslationStatus; hidden?: boolean }) {
  return (
    <span aria-hidden={hidden || undefined} className="own:flex items-center gap-1.5 px-2.5 pt-2 own:text-ui-xs own:leading-4 own:font-medium own:text-fg-muted select-none">
      <span className="own:tracking-wide own:uppercase">{code}</span>
      <span className="truncate">{label}</span>
      {status && needsWork(status) && <StatusGlyph status={status} />}
    </span>
  )
}

interface SourcePaneProps {
  id: string
  source: LocaleInfo
  text: string
  /** The source text the translation was made against, when it's outdated. */
  basis?: string
  label: string
  emptyLabel: string
}

function SourcePane({ id, source, text, basis, label, emptyLabel }: SourcePaneProps) {
  const typography = scriptTypography(source.script)
  const parts = basis !== undefined && basis.trim() !== text.trim() ? diffWords(basis, text) : null
  return (
    <div
      data-slot="multi-language-source"
      className={cn(
        'own:flex min-w-0 flex-col border-b border-line bg-band',
        '@[34rem]/mli:border-e @[34rem]/mli:border-b-0',
        'transition-[opacity,translate] yj-duration-base ease-enter starting:-translate-x-1 starting:opacity-0 rtl:starting:translate-x-1',
      )}
    >
      <PaneCaption code={source.code} label={label} />
      <p
        id={id}
        lang={source.code}
        dir={source.dir}
        className={cn('px-2.5 pt-1 pb-2 own:text-ui own:leading-5 break-words whitespace-pre-wrap own:text-fg', typography.className, !text.trim() && 'own:text-fg-muted')}
        style={typography.style}
      >
        {!text.trim()
          ? emptyLabel
          : parts
            ? parts.map((part, i) => {
                if (part.kind === 'same') return part.text
                // Spaces at a change's edges stay outside its mark.
                const [, lead, core, trail] = /^(\s*)([\s\S]*?)(\s*)$/.exec(part.text)!
                return (
                  <span key={i}>
                    {lead}
                    {part.kind === 'added' ? (
                      <ins className="rounded-xs bg-warning-subtle own:px-0.5 text-warning-text no-underline">{core}</ins>
                    ) : (
                      // Struck words are for the eye; screen readers hear the source as it is now.
                      <del aria-hidden className="own:px-0.5 text-fg-muted decoration-fg-muted">
                        {core}
                      </del>
                    )}
                    {trail}
                  </span>
                )
              })
            : text}
      </p>
    </div>
  )
}

export { PaneCaption, SourcePane }
