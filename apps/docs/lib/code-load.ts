import { useEffect, useState } from 'react'
import type { CodeBody } from '@/lib/code-url'

export { codeUrl, type CodeBody } from '@/lib/code-url'

/* The source behind a Code tab, off the page: every file a preview, block or
 * example shows is prerendered as JSON (app/code/[...path]/route.ts, from
 * lib/code-files.ts), and a tab fetches the file it shows the first time it
 * shows it. A page carries only the names of its files. Each file is fetched
 * once per visit, however many panels ask for it. */

const cache = new Map<string, Promise<CodeBody>>()
/** The files already here, so a panel coming back to one shows it at once. */
const loaded = new Map<string, CodeBody>()

/** The file at `src`, fetched once; a failed fetch is forgotten, so asking again retries it. */
export function loadCode(src: string): Promise<CodeBody> {
  let body = cache.get(src)
  if (!body) {
    body = fetch(src).then((res) => {
      if (!res.ok) throw new Error(`${src}: ${res.status}`)
      return res.json() as Promise<CodeBody>
    })
    body.then(
      (b) => loaded.set(src, b),
      () => cache.delete(src),
    )
    cache.set(src, body)
  }
  return body
}

/** Starts fetching a file a reader is about to open (a Code tab under the pointer), ignoring a failure until it's asked for. */
export function prefetchCode(src: string) {
  loadCode(src).catch(() => {})
}

export type CodeState = { status: 'idle' | 'loading' } | { status: 'ready'; body: CodeBody } | { status: 'error'; retry: () => void }

/** The file at `src` once it's wanted (`src` null until then), with a retry when it couldn't be fetched. */
export function useCode(src: string | null): CodeState {
  const [state, setState] = useState<{ src: string; body?: CodeBody; failed?: boolean } | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!src) return
    let live = true
    loadCode(src).then(
      (body) => live && setState({ src, body }),
      () => live && setState({ src, failed: true }),
    )
    return () => {
      live = false
    }
  }, [src, attempt])

  if (!src) return { status: 'idle' }
  const body = loaded.get(src)
  if (body) return { status: 'ready', body }
  if (state?.src === src && state.failed)
    return {
      status: 'error',
      retry: () => {
        setState(null)
        setAttempt((n) => n + 1)
      },
    }
  return { status: 'loading' }
}
