'use client'

import { LinkIcon } from '@youj/icons'
import { AsyncButton } from '../../../components/ui/async-button'
import { useSearchConfig } from './copy'

/* The search as its URL: every part of the state lives in the query string,
 * so the page can be linked, reloaded or shared as it stands. Keys are
 * quiet, values full strength, and the copy button confirms in place. */

export function Address({ search, origin = 'kestrel.so/search' }: { search: string; origin?: string }) {
  const { copy } = useSearchConfig()
  const params = search.replace(/^\?/, '').split('&').filter(Boolean)
  return (
    <div className="flex h-control-sm min-w-0 items-center gap-2 rounded-lg border border-line bg-transparent ps-2.5 pe-0.5">
      <LinkIcon size={14} aria-hidden className="shrink-0 text-fg-muted" />
      <output aria-label={copy.linkToSearch} className="min-w-0 flex-1 truncate font-mono text-ui-xs text-fg-muted">
        {origin}
        {params.map((p, i) => {
          const [key, value = ''] = p.split('=')
          return (
            <span key={p}>
              <span className="text-fg-subtle">{i ? '&' : '?'}</span>
              {key}=<span className="text-fg">{decodeURIComponent(value.replace(/\+/g, ' '))}</span>
            </span>
          )
        })}
      </output>
      <AsyncButton
        size="xs"
        variant="ghost"
        successLabel={copy.copied}
        errorLabel={copy.copyFailed}
        onAction={() => navigator.clipboard.writeText(`https://${origin}${search}`)}
        className="shrink-0"
      >
        {copy.copyLink}
      </AsyncButton>
    </div>
  )
}
