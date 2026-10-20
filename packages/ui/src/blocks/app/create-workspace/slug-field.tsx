'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { MorphLabel } from '@youj/motion'
import { AlertTriangleIcon, CheckIcon } from '@youj/icons'
import { Field, FieldDescription, FieldError, FieldLabel } from '../../../components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '../../../components/ui/input-group'
import { Spinner } from '../../../components/ui/spinner'
import { toSlug, validSlug, type CreateWorkspaceCopy, type SlugStatus } from './data'

/**
 * Checks a slug as it's typed: invalid ones are caught at once, valid ones are
 * asked about after a short pause. `settle` resolves the current slug's
 * status (checking it now if it hasn't been), for the step's validation.
 */
export function useSlugStatus(slug: string, check: (slug: string) => Promise<boolean>) {
  const [state, setState] = useState<{ slug: string; status: SlugStatus }>({ slug: '', status: 'idle' })
  const ticket = useRef(0)
  const checkRef = useRef(check)
  useLayoutEffect(() => {
    checkRef.current = check
  })

  const run = useCallback(async (value: string): Promise<SlugStatus> => {
    const id = ++ticket.current
    setState({ slug: value, status: 'checking' })
    const ok = await checkRef.current(value).catch(() => false)
    const status = ok ? 'available' : 'taken'
    if (id === ticket.current) setState({ slug: value, status })
    return status
  }, [])

  if (!slug && (state.slug || state.status !== 'idle')) setState({ slug, status: 'idle' })

  useEffect(() => {
    ticket.current++
    if (!slug) return
    // A pause before judging, so a hyphen typed mid-word isn't flagged.
    const timer = setTimeout(() => (validSlug(slug) ? run(slug) : setState({ slug, status: 'invalid' })), 350)
    return () => clearTimeout(timer)
  }, [slug, run])

  // Between a keystroke and its check, a valid slug counts as being checked.
  const status: SlugStatus = state.slug === slug ? state.status : slug && validSlug(slug) ? 'checking' : 'idle'
  const settle = async (): Promise<SlugStatus> => {
    if (!slug) return 'idle'
    if (!validSlug(slug)) {
      setState({ slug, status: 'invalid' })
      return 'invalid'
    }
    return status === 'available' || status === 'taken' ? status : run(slug)
  }
  return { status, settle }
}

export function SlugField({
  slug,
  status,
  onChange,
  copy,
  showIdleError,
}: {
  slug: string
  status: SlugStatus
  onChange: (slug: string) => void
  copy: CreateWorkspaceCopy
  /** The step was submitted with no slug: say so. */
  showIdleError?: boolean
}) {
  const bad = status === 'invalid' || status === 'taken' || (showIdleError && status === 'idle')
  const message =
    status === 'checking' ? copy.slugChecking : status === 'available' ? copy.slugAvailable(slug) : status === 'taken' ? copy.slugTaken(slug) : status === 'invalid' || showIdleError ? copy.slugInvalid : copy.slugHint
  return (
    <Field invalid={bad} required>
      <FieldLabel>{copy.url}</FieldLabel>
      {/* A URL reads left to right in any language. */}
      <InputGroup dir="ltr">
        <InputGroupAddon>
          <InputGroupText className="font-mono text-ui-sm">{copy.urlPrefix}</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          value={slug}
          spellCheck={false}
          autoCapitalize="none"
          autoComplete="off"
          className="font-mono text-ui-sm"
          onChange={(event) => onChange(toSlug(event.target.value))}
        />
        <InputGroupAddon align="inline-end" aria-hidden className="w-6 justify-center">
          <MorphLabel value={status}>
            {status === 'checking' ? (
              <Spinner className="size-3.5 text-fg-muted" />
            ) : status === 'available' ? (
              <CheckIcon trigger="mount" size={15} className="text-success-text" />
            ) : bad ? (
              <AlertTriangleIcon size={15} className="text-danger-text" />
            ) : null}
          </MorphLabel>
        </InputGroupAddon>
      </InputGroup>
      {bad ? (
        <FieldError>{message}</FieldError>
      ) : (
        <FieldDescription aria-live="polite" className={status === 'available' ? 'text-success-text' : undefined}>
          {message}
        </FieldDescription>
      )}
    </Field>
  )
}
