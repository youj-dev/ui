'use client'

import {
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { CheckIcon } from '@youj/icons/components/youj/icons/check'
import { EraserIcon } from '@youj/icons/components/youj/icons/eraser'
import { UndoIcon } from '@youj/icons/components/youj/icons/undo'
import { useLocale, useYouj } from '@youj/core/lib/youj/provider'
import { signaturePadLabels, useComponentLabels } from '@youj/core/labels'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { strokePath, useStrokeInput, type StrokePoint } from '../../hooks/use-stroke'
import { cn, dateTimeFormat } from '../../lib/utils'
import { AsyncButton } from './async-button'
import { Button } from './button'
import { useFieldControl } from './field'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

/* A signature, drawn or typed, then accepted: one self-contained surface.
 * - The pad is the container: a card with full-width Draw | Sign by typing
 *   tabs on top (the kit's underline Tabs, its indicator gliding between the
 *   halves), the signing area under them, and a footer with Undo and Clear
 *   (quiet icon buttons) and the Accept action.
 * - Ink: each stroke is one filled path of varying width (a pen's own
 *   pressure, or for a mouse or a finger a pressure from speed), smoothed from
 *   every coalesced sample. Points are stored as fractions of the pad's width,
 *   so the pad can resize (it keeps its `aspectRatio`) and the signature
 *   scales with it, never cropped or lost.
 * - Sign by typing (`typeInstead`, on by default) is a field that sets the
 *   name in a script face, the keyboard path to a signature; Enter on the
 *   focused drawing area switches there too. Each mode keeps its own draft.
 * - Accept runs the kit's AsyncButton: it awaits `onAccept(value)` (spinner),
 *   draws its check, and the signature locks: read-only, the signing line turns
 *   to the success ink with a small tick at its end, the ink settles onto its line, tabs, Undo and Clear
 *   are disabled, and a quiet Re-sign unlocks it. A rejection shows its
 *   message on the button. `locked`/`defaultLocked`/`onLockedChange` hold the
 *   lock from outside.
 * - The value is `{ kind: 'drawn', strokes }` or `{ kind: 'typed', text }`, or
 *   null while empty. The ref exports it: `toSVG()` and `toDataURL()` (PNG).
 * - Forms: `name` submits the PNG data URL of an accepted signature only;
 *   `required` blocks submit until one is accepted. In a Field it takes the
 *   label, description, invalid and disabled.
 * - `readOnly` shows the signature without tabs or footer; `disabled` dims it.
 * Motion: the placeholder fades on the fast token as ink arrives; on accept
 * the line eases to the success ink, the tick draws, and the ink settles on
 * the slow token; tabs and
 * the button bring their own. Reduced motion swaps each at once. */

/** Fallback stack for a typed signature: the script faces systems ship, then the generic cursive. */
const SCRIPT_FONT = "'Segoe Script', 'Bradley Hand', 'Snell Roundhand', 'Apple Chancery', 'Brush Script MT', cursive"

/** The pad's drawing units: 1000 across, whatever its size on screen. */
const UNITS = 1000

type SignatureValue = { kind: 'drawn'; strokes: StrokePoint[][] } | { kind: 'typed'; text: string }
type SignatureMode = 'draw' | 'type'

interface SignaturePadHandle {
  clear: () => void
  undo: () => void
  /** The signature as a standalone SVG document, in the current ink color; empty while unsigned. */
  toSVG: () => string
  /** The signature as a PNG data URL on a transparent ground, `scale` times the pad's size (default 2); empty while unsigned. */
  toDataURL: (scale?: number) => string
}

interface SignaturePadProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange' | 'children' | 'ref'> {
  value?: SignatureValue | null
  defaultValue?: SignatureValue | null
  onValueChange?: (value: SignatureValue | null) => void
  /**
   * Runs when the signer presses Accept, with the signature. The button waits
   * for it (spinner), then shows its check and the pad locks; a rejection
   * shows its message on the button and keeps the pad open. Without it, Accept
   * locks at once.
   */
  onAccept?: (value: SignatureValue) => Promise<unknown> | unknown
  /** The signature is accepted and read-only (controlled). */
  locked?: boolean
  /** Starts accepted and read-only (uncontrolled). Default false. */
  defaultLocked?: boolean
  /** Called with true once a signature is accepted, and false when Re-sign unlocks it. */
  onLockedChange?: (locked: boolean) => void
  /** Offers Sign by typing beside Draw, so a signature needs no pointer. Default true. */
  typeInstead?: boolean
  /** The signing area's width over its height. Default 3. */
  aspectRatio?: number
  /** The pen at full pressure, in pixels on a 500px-wide pad; it scales with the pad. Default 3. */
  strokeWidth?: number
  /** The face a typed signature is set in. Default: a script stack ending in `cursive`. */
  typeFont?: string
  /** Submits the accepted signature as a PNG data URL with a native form. */
  name?: string
  /** Blocks a native submit until a signature is accepted. */
  required?: boolean
  disabled?: boolean
  /** Shows the signature without tabs, Undo, Clear or Accept. */
  readOnly?: boolean
  /** The pad's accessible name when no Field label names it. Default: the labels' "Signature". */
  label?: string
  /** With sound on (`YoujProvider`’s `sound`), the tabs and the Accept outcome sound. `false` keeps this pad silent. Default true. */
  sound?: boolean
  /** The handle: `clear`, `undo`, `toSVG`, `toDataURL`. */
  ref?: Ref<SignaturePadHandle>
}

const strokeD = (stroke: readonly StrokePoint[], size: number) =>
  strokePath(
    stroke.map(([x, y, p]) => [x * UNITS, y * UNITS, p]),
    { size },
  )

const isEmpty = (value: SignatureValue | null) => !value || (value.kind === 'drawn' ? value.strokes.length === 0 : !value.text.trim())

const errorText = (error: unknown) => (error instanceof Error ? error.message : typeof error === 'string' ? error : '')

function SignaturePad({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  onAccept,
  locked: lockedProp,
  defaultLocked = false,
  onLockedChange,
  typeInstead = true,
  aspectRatio = 3,
  strokeWidth = 3,
  typeFont = SCRIPT_FONT,
  name,
  required: requiredProp,
  disabled: disabledProp,
  readOnly = false,
  label,
  sound = true,
  id,
  ref,
  className,
  style,
  ...props
}: SignaturePadProps) {
  const k = useYouj()
  const locale = useLocale()
  const labels = useComponentLabels(signaturePadLabels)
  const control = useFieldControl(id)
  const disabled = disabledProp || control.disabled
  const required = requiredProp ?? control.required
  const [value, setValue] = useControllableState<SignatureValue | null>(valueProp, defaultValue)
  const [locked, setLocked] = useState(lockedProp ?? defaultLocked)
  const isLocked = lockedProp ?? locked
  const [lockedAt, setLockedAt] = useState<Date | null>(null)
  // The Accept button holds its check a moment before Re-sign takes its place.
  const [celebrating, setCelebrating] = useState(false)
  const celebratingRef = useRef(false)
  const editable = !disabled && !readOnly && !isLocked
  const [mode, setMode] = useState<SignatureMode>(value?.kind === 'typed' ? 'type' : 'draw')
  const [live, setLive] = useState<StrokePoint[] | null>(null)
  const liveRef = useRef<StrokePoint[] | null>(null)
  // Each mode's draft, so switching to typing and back keeps the drawing.
  const drafts = useRef<{ draw: StrokePoint[][]; type: string }>({ draw: [], type: '' })
  const root = useRef<HTMLDivElement>(null)
  const surface = useRef<HTMLDivElement>(null)
  const typed = useRef<HTMLInputElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const acceptRef = useRef<HTMLButtonElement>(null)
  const focusTyped = useRef(false)
  const hintId = useId()
  const { announce, announcer } = useAnnouncer()

  const height = UNITS / aspectRatio
  const size = strokeWidth * 2 * (UNITS / 1000)
  const strokes = value?.kind === 'drawn' ? value.strokes : []
  const text = value?.kind === 'typed' ? value.text : ''
  if (value?.kind === 'drawn') drafts.current.draw = value.strokes
  if (value?.kind === 'typed') drafts.current.type = value.text
  const shownMode: SignatureMode = value ? (value.kind === 'typed' ? 'type' : 'draw') : mode
  const empty = shownMode === 'draw' ? strokes.length === 0 && !live : !text.trim()

  const commit = (next: SignatureValue | null) => {
    const normal = next && isEmpty(next) ? null : next
    setValue(normal)
    onValueChange?.(normal)
  }

  const lock = (next: boolean) => {
    setLocked(next)
    setLockedAt(next ? new Date() : null)
    onLockedChange?.(next)
  }

  const box = () => (surface.current ?? root.current)!.getBoundingClientRect()
  const stroke = useStrokeInput({
    enabled: editable && shownMode === 'draw',
    toPoint: (x, y) => {
      const r = box()
      const round = (n: number) => Math.round(n * 10000) / 10000
      return [round((x - r.left) / r.width), round((y - r.top) / r.width)]
    },
    onStart: (point) => {
      liveRef.current = [point]
      setLive(liveRef.current)
    },
    onExtend: (points) => {
      if (!liveRef.current) return
      liveRef.current = [...liveRef.current, ...points]
      setLive(liveRef.current)
    },
    onEnd: (canceled) => {
      const done = liveRef.current
      liveRef.current = null
      setLive(null)
      if (done && !canceled) commit({ kind: 'drawn', strokes: [...drafts.current.draw, done] })
    },
  })

  const ink = () => (root.current ? getComputedStyle(root.current).color : '') || 'currentColor'

  const toSVG = () => {
    if (isEmpty(value)) return ''
    const color = ink()
    const body =
      value!.kind === 'drawn'
        ? value!.strokes.map((s) => `<path d="${strokeD(s, size)}"/>`).join('')
        : `<text x="${UNITS / 2}" y="${height * 0.68}" text-anchor="middle" font-family="${typeFont.replaceAll('"', "'")}" font-size="${height * 0.42}">${escapeXml(value!.text)}</text>`
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${UNITS} ${round(height)}" width="${UNITS}" height="${round(height)}" fill="${color}">${body}</svg>`
  }

  const toDataURL = (scale = 2) => {
    if (isEmpty(value) || typeof document === 'undefined') return ''
    const r = (surface.current ?? root.current)?.getBoundingClientRect()
    const width = Math.max(1, Math.round((r?.width || 600) * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = Math.round(width / aspectRatio)
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''
    ctx.scale(width / UNITS, width / UNITS)
    ctx.fillStyle = ink()
    if (value!.kind === 'drawn') {
      for (const s of value!.strokes) ctx.fill(new Path2D(strokeD(s, size)))
    } else {
      ctx.font = `${height * 0.42}px ${typeFont}`
      ctx.textAlign = 'center'
      ctx.fillText(value!.text, UNITS / 2, height * 0.68)
    }
    return canvas.toDataURL('image/png')
  }

  const undo = () => {
    if (isLocked || shownMode !== 'draw' || !strokes.length) return
    commit({ kind: 'drawn', strokes: strokes.slice(0, -1) })
  }
  const clear = () => {
    if (isLocked) return
    drafts.current = { draw: [], type: '' }
    commit(null)
    announce(labels.signatureCleared)
  }

  useImperativeHandle(ref, () => ({ clear, undo, toSVG, toDataURL }))

  // The form's copy follows the accepted signature, in the ink color of the moment; a draft submits nothing.
  // biome-ignore lint/correctness/useExhaustiveDependencies: redrawn only when the signature or its lock changes
  useEffect(() => {
    if (input.current) input.current.value = isLocked ? toDataURL() : ''
    // eslint-disable-next-line react-hooks/exhaustive-deps -- redrawn only when the signature or its lock changes
  }, [value, isLocked])

  const switchMode = (next: SignatureMode) => {
    if (next === shownMode || !editable) return
    setMode(next)
    commit(next === 'type' ? { kind: 'typed', text: drafts.current.type } : { kind: 'drawn', strokes: drafts.current.draw })
    focusTyped.current = next === 'type'
  }

  // A switch to typing puts the caret in the field once it has mounted.
  useEffect(() => {
    if (!focusTyped.current || shownMode !== 'type') return
    focusTyped.current = false
    typed.current?.focus()
  }, [shownMode])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!editable || e.target !== e.currentTarget) return
    if (e.key === 'Enter' && typeInstead) {
      e.preventDefault()
      switchMode('type')
    } else if (e.key.toLowerCase() === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
      e.preventDefault()
      undo()
    }
  }

  const resign = () => {
    lock(false)
    announce(labels.signatureUnlocked)
    requestAnimationFrame(() => (shownMode === 'type' ? typed.current : surface.current)?.focus())
  }

  const describedBy = [hintId, control.describedBy].filter(Boolean).join(' ') || undefined
  const name_ = control.labelId ? undefined : (label ?? labels.signaturePad)
  const showChrome = !readOnly
  const time = lockedAt ? dateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(lockedAt) : ''

  // The ink settles onto its line as the signature locks.
  const settle = cn(!k.reduced && 'transition-[scale,translate] yj-duration-slow ease-emphasized', isLocked && 'scale-[0.97] translate-y-[2%]')

  const drawArea = (
    <div
      ref={surface}
      data-slot="signature-pad-surface"
      id={control.id}
      role="group"
      aria-label={name_}
      aria-labelledby={control.labelId}
      aria-describedby={describedBy}
      aria-invalid={control.invalid || undefined}
      aria-disabled={disabled || undefined}
      tabIndex={!disabled ? 0 : undefined}
      onKeyDown={onKeyDown}
      {...stroke.handlers}
      className={cn(
        'absolute inset-0 own:outline-none',
        editable && 'cursor-crosshair touch-none select-none',
        // The ring sits inside the area, so the card never clips it.
        'own:focus-visible:outline-2 own:focus-visible:outline-solid own:focus-visible:outline-focus own:focus-visible:-outline-offset-2',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute start-(--signature-inset) bottom-[24%] own:mb-1.5 own:text-ui-sm own:text-fg-subtle',
          !k.reduced && 'transition-opacity yj-duration-fast ease-standard',
          empty ? 'opacity-100' : 'opacity-0',
        )}
      >
        {labels.signHere}
      </span>
      <svg
        data-slot="signature-pad-ink"
        aria-hidden
        viewBox={`0 0 ${UNITS} ${round(height)}`}
        preserveAspectRatio="xMidYMid meet"
        className={cn('pointer-events-none absolute inset-0 own:size-full origin-bottom fill-current', settle)}
      >
        {strokes.map((s, i) => (
          <path key={i} d={strokeD(s, size)} />
        ))}
        {live && <path d={strokeD(live, size)} />}
      </svg>
    </div>
  )

  const typeArea = (
    <input
      ref={typed}
      id={control.id}
      data-slot="signature-pad-typed"
      value={text}
      placeholder={labels.signatureTypedName}
      disabled={disabled}
      readOnly={readOnly || isLocked}
      autoComplete="name"
      spellCheck={false}
      aria-labelledby={control.labelId}
      aria-label={name_}
      aria-describedby={control.describedBy}
      aria-invalid={control.invalid || undefined}
      onChange={(e) => {
        drafts.current.type = e.target.value
        commit({ kind: 'typed', text: e.target.value })
      }}
      style={{ fontFamily: typeFont }}
      className={cn(
        'absolute inset-x-(--signature-inset) bottom-[24%] own:h-[52%] own:min-w-0 origin-bottom own:bg-transparent own:text-center own:text-fg own:outline-none',
        'own:text-[clamp(--spacing(6),7cqw,--spacing(12))] own:placeholder:font-sans own:placeholder:text-ui own:placeholder:text-fg-subtle',
        // The field's ring, drawn inside the field so the area's edge never clips it, with room for the name inside it.
        'own:rounded-md own:px-3 own:focus-visible:outline-2 own:focus-visible:outline-solid own:focus-visible:outline-focus own:focus-visible:-outline-offset-2',
        settle,
      )}
    />
  )

  // The signing area: the line to sign on, the ink or the typed name, and a quiet tick at the line's end once accepted.
  const area = (body: ReactNode) => (
    <div
      data-slot="signature-pad-area"
      style={{ aspectRatio } as CSSProperties}
      className="@container relative own:w-full own:min-w-0 overflow-hidden"
    >
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-(--signature-inset) bottom-[24%] border-b',
          isLocked ? 'own:border-success-line' : 'own:border-line',
          !k.reduced && 'transition-[border-color] yj-duration-slow ease-standard',
        )}
      />
      {body}
      {isLocked && (
        <span aria-hidden data-slot="signature-pad-accepted" className="pointer-events-none absolute end-(--signature-inset) bottom-[24%] own:mb-1.5 own:text-success-text">
          <CheckIcon trigger={k.reduced ? 'none' : 'mount'} size={18} strokeWidth={2.25} />
        </span>
      )}
    </div>
  )

  const tool = (labelText: string, icon: ReactNode, onClick: () => void, off: boolean) => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label={labelText} disabled={off} onClick={onClick} />}>{icon}</TooltipTrigger>
      <TooltipContent>{labelText}</TooltipContent>
    </Tooltip>
  )

  return (
    <div
      ref={root}
      data-slot="signature-pad"
      data-yj-mode={shownMode}
      data-yj-empty={empty || undefined}
      data-yj-locked={isLocked || undefined}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      className={cn(
        'group/signature relative own:flex own:w-full own:min-w-0 flex-col overflow-hidden',
        '[--signature-radius:min(var(--radius-xl),var(--ui--panel-radius-max,var(--radius-xl)))] own:rounded-(--signature-radius)',
        // One inset for everything: the tabs' edges, the signing line, the typed name, the tick and the footer line up.
        '[--signature-inset:--spacing(5)]',
        'own:border own:border-line-control own:bg-surface own:text-fg own:shadow-xs',
        !k.reduced && 'transition-[border-color,box-shadow] yj-duration-fast ease-standard',
        control.invalid && 'own:border-danger',
        readOnly && 'own:border-dashed',
        disabled && 'opacity-50',
        className,
      )}
      style={style}
      {...props}
    >
      <span id={hintId} className="sr-only">
        {editable ? labels.signaturePadHint : ''}
      </span>
      {isLocked && <span className="sr-only">{time ? labels.signatureSignedAt(time) : labels.signatureSigned}</span>}

      {typeInstead && showChrome ? (
        <Tabs value={shownMode} onValueChange={(next) => switchMode(next as SignatureMode)} sound={sound} className="own:gap-0">
          {/* The list's frame draws the track, so the inset goes around the whole list: track and indicator line up with the signing line. */}
          <div className="own:mx-(--signature-inset)">
          <TabsList aria-label={labels.signatureMethod} className="flex-1" activateOnFocus={false}>
            <TabsTrigger value="draw" disabled={!editable} className="flex-1">
              {labels.signatureDraw}
            </TabsTrigger>
            <TabsTrigger value="type" disabled={!editable} className="flex-1">
              {labels.signatureType}
            </TabsTrigger>
          </TabsList>
          </div>
          <TabsContent value="draw" tabIndex={-1} className="own:rounded-none">
            {area(drawArea)}
          </TabsContent>
          <TabsContent value="type" tabIndex={-1} className="own:rounded-none">
            {area(typeArea)}
          </TabsContent>
        </Tabs>
      ) : (
        area(shownMode === 'draw' ? drawArea : typeArea)
      )}

      {showChrome && (
        <div data-slot="signature-pad-footer" className="own:flex own:items-center own:gap-1 own:px-(--signature-inset) own:pb-3 [&>:first-child]:-ms-1.5">
          {shownMode === 'draw' && tool(labels.undo, <UndoIcon className="rtl:-scale-x-100" />, undo, !editable || !strokes.length)}
          {tool(labels.clear, <EraserIcon />, clear, !editable || empty)}
          <div className="ms-auto own:flex items-center">
            {isLocked && !celebrating ? (
              <Button variant="ghost" size="sm" sound={sound} disabled={disabled} onClick={resign}>
                {labels.signatureResign}
              </Button>
            ) : (
              <AsyncButton
                ref={acceptRef}
                size="sm"
                sound={sound}
                disabled={disabled || empty || (isLocked && !celebrating)}
                onAction={() => onAccept?.(value!)}
                pendingLabel={labels.signatureAccepting}
                successLabel={labels.signatureAccepted}
                errorLabel={errorText}
                onActionStateChange={(state) => {
                  if (state === 'success') {
                    celebratingRef.current = true
                    setCelebrating(true)
                    lock(true)
                  } else if (state === 'idle' && celebratingRef.current) {
                    celebratingRef.current = false
                    setCelebrating(false)
                    if (isLocked) announce(labels.signatureLocked)
                  }
                }}
              >
                {labels.signatureAccept}
              </AsyncButton>
            )}
          </div>
        </div>
      )}

      {(name || required) && (
        // Not type="hidden": a hidden input can't be required. It's out of view and out of the tab order; an invalid submit focuses where the signer goes next.
        <input
          ref={input}
          data-slot="signature-pad-input"
          type="text"
          name={name}
          required={required}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden
          defaultValue=""
          onInvalid={() => (empty ? (shownMode === 'type' ? typed.current : surface.current) : acceptRef.current)?.focus()}
          className="pointer-events-none absolute own:size-px opacity-0"
        />
      )}
      {announcer}
    </div>
  )
}

const round = (n: number) => Math.round(n * 100) / 100

function escapeXml(text: string) {
  return text.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`)
}

export { SignaturePad }
export type { SignaturePadHandle, SignaturePadProps, SignatureValue }
