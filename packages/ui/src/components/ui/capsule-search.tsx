'use client'

import { useEffect, useRef, useState, type ComponentProps, type CSSProperties } from 'react'
import { m } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { useMorphRoot } from '@youj/motion'
import { SearchIcon } from '@youj/icons/components/youj/icons/search'
import { XIcon } from '@youj/icons/components/youj/icons/x'
import { capsuleSearchLabels, useComponentLabels } from '@youj/core/labels'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { Button } from './button'
import { Kbd, KbdGroup } from './kbd'

/* A search that waits as a small capsule with its shortcut on it and opens
 * when it's wanted. Press the shortcut anywhere (`/`, or `mod+k` for ⌘K on
 * Apple and Ctrl K elsewhere) or click it, and the capsule widens to make
 * room to type; the key hint gives way to a clear button once there's text.
 * It stays open while it holds text, and Escape clears it, then leaves it.
 * Motion: the widening is a layout morph (transform only, the pill's ends kept
 * round) on the snappy spring, with the contents carried along unstretched;
 * a quick focus and blur reverses mid-flight. Reduced motion: it snaps open. */

interface CapsuleSearchProps extends Omit<ComponentProps<'input'>, 'size' | 'value' | 'defaultValue' | 'onChange' | 'type' | 'onSubmit' | 'width'> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Runs on Enter with the query. */
  onSubmit?: (value: string) => void
  /** A key that focuses the field from anywhere: `/`, or `mod+k` (⌘K on Apple, Ctrl K elsewhere). Shown as a hint at rest. */
  shortcut?: string
  /** Its width at rest and open. Default 11rem and 18rem; it never outgrows its container. */
  width?: { rest: string; open: string }
  size?: 'sm' | 'default'
}

function useIsApple() {
  const [apple, setApple] = useState(true)
  useEffect(() => setApple(/mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent)), [])
  return apple
}

const heights = {
  sm: 'h-[calc(var(--spacing-control-sm)+--spacing(2))]',
  default: 'h-[calc(var(--spacing-control)+--spacing(2))]',
}

function CapsuleSearch({
  value: valueProp,
  defaultValue = '',
  onValueChange,
  onSubmit,
  shortcut,
  width = { rest: '11rem', open: '18rem' },
  size = 'default',
  placeholder,
  className,
  style,
  onFocus,
  onBlur,
  onKeyDown,
  'aria-label': ariaLabel,
  ...props
}: CapsuleSearchProps) {
  const labels = useComponentLabels(capsuleSearchLabels)
  const apple = useIsApple()
  const morph = useMorphRoot('999px')
  const input = useRef<HTMLInputElement>(null)
  const [value, setValue] = useControllableState(valueProp, defaultValue)
  const [focused, setFocused] = useState(false)
  const open = focused || value !== ''
  const mod = shortcut?.toLowerCase().startsWith('mod+')
  const key = mod ? shortcut!.slice(4).toLowerCase() : shortcut

  const change = (next: string) => {
    setValue(next)
    onValueChange?.(next)
  }

  useEffect(() => {
    if (!key) return
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey) return
      const target = event.target as HTMLElement | null
      const typing = !!target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
      const hit = mod ? (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === key : !typing && !event.metaKey && !event.ctrlKey && event.key === key
      if (!hit) return
      event.preventDefault()
      input.current?.focus()
      input.current?.select()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [key, mod])

  return (
    <MotionFeatures features="max">
      <m.div
        {...morph}
        data-capsule=""
        data-slot="capsule-search"
        data-size={size}
        data-open={open || undefined}
        onClick={(event) => event.target === event.currentTarget && input.current?.focus()}
        style={{ ...morph.style, '--capsule-search-rest': width.rest, '--capsule-search-open': width.open, ...style } as CSSProperties}
        className={cn(
          'flex max-w-full shrink-0 cursor-text items-center gap-2 overflow-hidden own:rounded-2xl border own:border-line own:bg-surface ps-3 pe-1 text-fg own:shadow-xs',
          'focus-within:border-focus',
          heights[size],
          open ? 'w-(--capsule-search-open)' : 'w-(--capsule-search-rest)',
          className,
        )}
      >
        <m.span layout="position" aria-hidden className="flex shrink-0 text-fg-muted">
          <SearchIcon size={16} trigger="none" />
        </m.span>
        <m.input
          layout="position"
          {...(props as ComponentProps<typeof m.input>)}
          ref={input}
          type="search"
          data-slot="capsule-search-input"
          value={value}
          placeholder={placeholder ?? labels.search}
          aria-label={ariaLabel ?? labels.search}
          aria-keyshortcuts={key ? (mod ? `${apple ? 'Meta' : 'Control'}+${key.toUpperCase()}` : key) : undefined}
          onChange={(event) => change(event.target.value)}
          onFocus={(event) => {
            setFocused(true)
            onFocus?.(event)
          }}
          onBlur={(event) => {
            setFocused(false)
            onBlur?.(event)
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event)
            if (event.defaultPrevented) return
            if (event.key === 'Enter') onSubmit?.(value)
            else if (event.key === 'Escape') {
              event.preventDefault()
              if (value) change('')
              else input.current?.blur()
            }
          }}
          className="own:h-full own:min-w-0 flex-1 own:bg-transparent text-ui own:text-fg outline-none own:placeholder:text-fg-muted [&::-webkit-search-cancel-button]:hidden"
        />
        {value ? (
          <m.span layout="position" className="flex shrink-0">
            <Button
              variant="ghost"
              size={size === 'sm' ? 'icon-xs' : 'icon-sm'}
              aria-label={labels.clear}
              onClick={() => {
                change('')
                input.current?.focus()
              }}
              className="own:text-fg-muted"
            >
              <XIcon size={14} />
            </Button>
          </m.span>
        ) : (
          key &&
          !open && (
            <m.span layout="position" aria-hidden data-slot="capsule-search-hint" className="flex shrink-0 own:pe-1.5">
              {mod ? (
                <KbdGroup>
                  <Kbd>{apple ? '⌘' : labels.ctrlKey}</Kbd>
                  <Kbd>{key.toUpperCase()}</Kbd>
                </KbdGroup>
              ) : (
                <Kbd>{key}</Kbd>
              )}
            </m.span>
          )
        )}
      </m.div>
    </MotionFeatures>
  )
}

export { CapsuleSearch, type CapsuleSearchProps }
