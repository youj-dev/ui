'use client'

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { animate, m, useMotionValue } from 'motion/react'
import { CameraIcon } from '@youj/icons/components/youj/icons/camera'
import { ZoomInIcon } from '@youj/icons/components/youj/icons/zoom-in'
import { ZoomOutIcon } from '@youj/icons/components/youj/icons/zoom-out'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { useComponentLabels } from '@youj/core/labels'
import { avatarUploadLabels } from '@youj/core/labels'
import { clamp, cn } from '../../lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { Button } from './button'
import { AsyncButton } from './async-button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog'
import { FieldError } from './field'
import { formatBytes, useFileDrop } from './file-upload'
import { Slider } from './slider'
import { MotionFeatures } from '@youj/core'

/* A profile photo you can replace: pick or drop an image, then frame it in a
 * circular crop before it is saved.
 * - The avatar is the button (and a drop target); a scrim and motion's
 *   CameraIcon rise over it on hover or focus.
 * - The crop dialog: drag to move, pinch, scroll or use the Zoom slider to
 *   zoom (1–4×, anchored on the circle's center). The photo tracks the
 *   pointer 1:1; pulled past an edge it gives with resistance and springs
 *   back on release (smooth spring), so the circle is always filled. A thirds
 *   grid shows while you move it. Keyboard: arrows move (Shift for larger
 *   steps), + and − zoom, 0 resets.
 * - Save draws the crop to a canvas and hands you a square File
 *   (`outputSize` px) through `onSave`, as Button's onAction: spinner, then a
 *   drawn check, and the dialog closes itself.
 * Reduced motion: no spring back (it clamps), no scrim fade. */

interface CropState {
  /** Offset of the photo's center from the circle's center, in viewport px. */
  x: number
  y: number
  zoom: number
}

/**
 * The square of the source image, in its own pixels, that a circle of
 * `diameter` px shows when the photo is scaled to cover it, zoomed by `zoom`
 * and moved by (x, y) from center.
 */
function cropRegion(natural: { width: number; height: number }, diameter: number, { x, y, zoom }: CropState) {
  const scale = (diameter / Math.min(natural.width, natural.height)) * zoom
  const side = diameter / scale
  return {
    x: natural.width / 2 - x / scale - side / 2,
    y: natural.height / 2 - y / scale - side / 2,
    size: side,
  }
}

const MIN_ZOOM = 1
const MAX_ZOOM = 4

interface AvatarUploadProps {
  /** The current photo. */
  src?: string | null
  /** Shown when there is no photo (initials). */
  fallback?: ReactNode
  /** Names the photo for assistive tech, e.g. the person's name. */
  name?: string
  /** Receives the cropped square image. Resolve when saved; reject to show the error. */
  onSave: (file: File) => unknown
  /** Shows a Remove button while there is a photo. */
  onRemove?: () => unknown
  /** Default 'image/png,image/jpeg,image/webp'. */
  accept?: string
  /** In bytes. Default 10 MB. */
  maxSize?: number
  /** Output edge in px. Default 512. */
  outputSize?: number
  /** Default 'image/jpeg'. */
  outputType?: 'image/jpeg' | 'image/png' | 'image/webp'
  /** Avatar edge in px. Default 64. */
  size?: number
  disabled?: boolean
  className?: string
}

function AvatarUpload({
  src,
  fallback,
  name,
  onSave,
  onRemove,
  accept = 'image/png,image/jpeg,image/webp',
  maxSize = 10 * 1024 * 1024,
  outputSize = 512,
  outputType = 'image/jpeg',
  size = 64,
  disabled = false,
  className,
}: AvatarUploadProps) {
  const k = useYouj()
  const locale = useLocale()
  const labels = useComponentLabels(avatarUploadLabels)
  const input = useRef<HTMLInputElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const cropArea = useRef<HTMLDivElement>(null)
  const hintId = useId()
  const [picked, setPicked] = useState<{ file: File; url: string } | null>(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  // The saved crop, shown until the parent passes a new `src`.
  const [preview, setPreview] = useState<string | null>(null)
  const [previewFor, setPreviewFor] = useState(src)
  if (previewFor !== src) {
    setPreviewFor(src)
    setPreview(null)
  }
  const srcRef = useRef(src)
  srcRef.current = src
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview])
  useEffect(() => () => void (picked && URL.revokeObjectURL(picked.url)), [picked])

  const types = accept.split(',').map((t) => t.trim().split('/')[1]!.toUpperCase().replace('JPEG', 'JPG').replace('WEBP', 'WebP'))
  const hint = `${labels.fileTypeList(types)} · ${labels.fileMaxSize(formatBytes(maxSize, locale), false)}`

  const choose = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    const allowed = accept.split(',').map((t) => t.trim())
    if (!allowed.includes(file.type)) return setError(labels.avatarUnsupported(file.name, types.join(', ')))
    if (file.size > maxSize) return setError(labels.fileTooLarge(file.name, formatBytes(file.size, locale), formatBytes(maxSize, locale)))
    setError(undefined)
    setPicked({ file, url: URL.createObjectURL(file) })
    setOpen(true)
  }
  const drop = useFileDrop(choose, disabled)
  const shown = preview ?? src ?? undefined

  return (
    <MotionFeatures>
      <div data-slot="avatar-upload" className={cn('own:flex flex-col own:gap-2', className)}>
        <div className="own:flex items-center own:gap-4">
          <button
            ref={trigger}
            type="button"
            disabled={disabled}
            data-dragging={drop.over || undefined}
            aria-label={shown ? labels.avatarChangePhoto : labels.avatarUploadPhoto}
            aria-describedby={hintId}
            onClick={() => input.current?.click()}
            {...drop.props}
            style={{ width: size, height: size }}
            className={cn(
              'group/avatar-upload relative shrink-0 own:rounded-full focus-ring disabled:cursor-not-allowed disabled:opacity-50',
              'data-dragging:outline-2 data-dragging:outline-offset-2 data-dragging:outline-accent data-dragging:outline-dashed',
            )}
          >
            <Avatar aria-hidden className="size-full">
              {shown && <AvatarImage src={shown} alt={name ? labels.avatarPhotoOf(name) : labels.avatarProfilePhoto} />}
              <AvatarFallback className="own:text-ui-lg">{fallback}</AvatarFallback>
            </Avatar>
            <span
              aria-hidden
              data-reduced-motion={k.reduced || undefined}
              className={cn(
                'absolute inset-0 z-10 own:grid place-items-center rounded-full own:text-canvas opacity-0',
                'bg-[color-mix(in_oklab,var(--color-shadow)_52%,transparent)] transition-opacity yj-duration-fast ease-standard',
                'group-hover/avatar-upload:opacity-100 group-focus-visible/avatar-upload:opacity-100 group-data-dragging/avatar-upload:opacity-100',
                'group-disabled/avatar-upload:opacity-0',
              )}
            >
              <CameraIcon size={Math.round(size * 0.32)} strokeWidth={1.75} className="own:text-[white]" />
            </span>
          </button>
          <div className="own:flex flex-col items-start own:gap-1.5">
            <div className="own:flex items-center own:gap-1.5">
              <Button variant="outline" size="sm" disabled={disabled} onClick={() => input.current?.click()}>
                {shown ? labels.avatarChangePhoto : labels.avatarUploadPhoto}
              </Button>
              {shown && onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={async () => {
                    await onRemove()
                    setPreview(null)
                    trigger.current?.focus()
                  }}
                >
                  {labels.avatarRemove}
                </Button>
              )}
            </div>
            <span id={hintId} className="own:text-ui-sm own:text-fg-muted">
              {hint}
            </span>
          </div>
        </div>
        <FieldError errors={error ? [{ message: error }] : []} />
        <input
          ref={input}
          type="file"
          accept={accept}
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          onChange={(event) => {
            choose(event.currentTarget.files)
            event.currentTarget.value = ''
          }}
        />
        <Dialog
          open={open}
          onOpenChange={setOpen}
          onOpenChangeComplete={(isOpen) => {
            if (!isOpen) setPicked(null)
          }}
        >
          <DialogContent className="max-w-sm" initialFocus={cropArea} finalFocus={trigger}>
            <DialogHeader>
              <DialogTitle>{labels.avatarCropTitle}</DialogTitle>
              <DialogDescription>{labels.avatarCropDescription}</DialogDescription>
            </DialogHeader>
            {picked && (
              <Cropper
                area={cropArea}
                src={picked.url}
                outputSize={outputSize}
                outputType={outputType}
                fileName={picked.file.name}
                onCancel={() => setOpen(false)}
                onSave={async (file) => {
                  const before = srcRef.current
                  await onSave(file)
                  // Show the crop until the parent passes its new src (unless it already has).
                  if (srcRef.current === before) setPreview(URL.createObjectURL(file))
                  // Let the check draw, then close.
                  setTimeout(() => setOpen(false), k.reduced ? 0 : k.ms('deliberate') * 1.5)
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MotionFeatures>
  )
}

interface CropperProps {
  /** The crop area, which takes focus when the dialog opens. */
  area: RefObject<HTMLDivElement | null>
  src: string
  fileName: string
  outputSize: number
  outputType: string
  onSave: (file: File) => Promise<void>
  onCancel: () => void
}

const PAD = 20

function Cropper({ area, src, fileName, outputSize, outputType, onSave, onCancel }: CropperProps) {
  const k = useYouj()
  const labels = useComponentLabels(avatarUploadLabels)
  const image = useRef<HTMLImageElement>(null)
  const instructionsId = useId()
  const [viewport, setViewport] = useState(0)
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null)
  const [zoom, setZoomState] = useState(1)
  const [moving, setMoving] = useState(false)
  const [failed, setFailed] = useState(false)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scale = useMotionValue(1)

  useLayoutEffect(() => {
    const el = area.current
    if (!el) return
    const measure = () => setViewport(el.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const diameter = Math.max(0, viewport - PAD * 2)
  const base = natural ? diameter / Math.min(natural.width, natural.height) : 1
  const width = natural ? natural.width * base : 0
  const height = natural ? natural.height * base : 0

  /** How far the photo's center may move from the circle's center at a zoom. */
  const limits = useCallback(
    (z: number) => ({ x: Math.max(0, (width * z - diameter) / 2), y: Math.max(0, (height * z - diameter) / 2) }),
    [width, height, diameter],
  )

  const settle = (z = zoom) => {
    const max = limits(z)
    const targets = [
      [x, clamp(x.get(), -max.x, max.x)],
      [y, clamp(y.get(), -max.y, max.y)],
    ] as const
    for (const [value, target] of targets) {
      if (value.get() === target) continue
      if (k.reduced) value.set(target)
      else animate(value, target, k.spring('smooth'))
    }
  }

  const setZoom = (next: number) => {
    const z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next))
    // Keep the point under the circle's center where it is.
    const ratio = z / zoom
    const max = limits(z)
    x.set(clamp(x.get() * ratio, -max.x, max.x))
    y.set(clamp(y.get() * ratio, -max.y, max.y))
    scale.set(z)
    setZoomState(z)
  }

  // Wheel zoom needs a non-passive listener to keep the page from scrolling.
  const zoomRef = useRef(setZoom)
  zoomRef.current = setZoom
  const zoomValue = useRef(zoom)
  zoomValue.current = zoom
  useEffect(() => {
    const el = area.current
    if (!el) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      zoomRef.current(zoomValue.current * Math.exp(-event.deltaY * 0.0015))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // Pointers: one drags, two pinch.
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{ x: number; y: number; px: number; py: number; distance: number; zoom: number } | null>(null)
  const beginGesture = () => {
    const points = [...pointers.current.values()]
    const cx = points.reduce((s, p) => s + p.x, 0) / points.length
    const cy = points.reduce((s, p) => s + p.y, 0) / points.length
    const distance = points.length > 1 ? Math.hypot(points[0]!.x - points[1]!.x, points[0]!.y - points[1]!.y) : 0
    gesture.current = { x: x.get(), y: y.get(), px: cx, py: cy, distance, zoom }
  }
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!natural) return
    event.currentTarget.setPointerCapture(event.pointerId)
    x.stop()
    y.stop()
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    beginGesture()
    setMoving(true)
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const points = [...pointers.current.values()]
    const g = gesture.current
    if (points.length > 1 && g.distance > 0) {
      const d = Math.hypot(points[0]!.x - points[1]!.x, points[0]!.y - points[1]!.y)
      setZoom(g.zoom * (d / g.distance))
      return
    }
    // Past an edge the photo gives at a third of the pointer's pace.
    const max = limits(zoom)
    const give = (v: number, m: number) => (Math.abs(v) <= m ? v : Math.sign(v) * (m + (Math.abs(v) - m) / 3))
    x.set(give(g.x + event.clientX - g.px, max.x))
    y.set(give(g.y + event.clientY - g.py, max.y))
  }
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId)
    if (pointers.current.size > 0) return beginGesture()
    gesture.current = null
    setMoving(false)
    settle()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 32 : 8
    const max = limits(zoom)
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl'
    const move = (dx: number, dy: number) => {
      x.set(clamp(x.get() + dx, -max.x, max.x))
      y.set(clamp(y.get() + dy, -max.y, max.y))
    }
    // Arrows move the photo, like dragging it.
    if (event.key === 'ArrowLeft') move(rtl ? step : -step, 0)
    else if (event.key === 'ArrowRight') move(rtl ? -step : step, 0)
    else if (event.key === 'ArrowUp') move(0, -step)
    else if (event.key === 'ArrowDown') move(0, step)
    else if (event.key === '+' || event.key === '=') setZoom(zoom + 0.25)
    else if (event.key === '-' || event.key === '_') setZoom(zoom - 0.25)
    else if (event.key === '0') {
      x.set(0)
      y.set(0)
      setZoom(1)
    } else return
    event.preventDefault()
  }

  const save = async () => {
    const img = image.current
    if (!img || !natural) throw new Error('No image')
    const region = cropRegion(natural, diameter, { x: x.get(), y: y.get(), zoom })
    const canvas = document.createElement('canvas')
    canvas.width = outputSize
    canvas.height = outputSize
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas unavailable')
    context.imageSmoothingQuality = 'high'
    context.drawImage(img, region.x, region.y, region.size, region.size, 0, 0, outputSize, outputSize)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outputType, 0.92))
    if (!blob) throw new Error('Couldn’t encode the image')
    const ext = outputType.split('/')[1]!.replace('jpeg', 'jpg')
    await onSave(new File([blob], `${fileName.replace(/\.[^.]+$/, '')}-avatar.${ext}`, { type: outputType }))
  }

  return (
    <>
      <div
        ref={area}
        tabIndex={natural ? 0 : -1}
        role="group"
        aria-roledescription={labels.avatarCropArea}
        aria-label={labels.avatarCropLabel}
        aria-describedby={instructionsId}
        data-moving={moving || undefined}
        data-reduced-motion={k.reduced || undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className={cn(
          'group/crop relative aspect-square w-full touch-none overflow-hidden rounded-lg bg-band select-none focus-ring',
          natural ? 'cursor-grab data-moving:cursor-grabbing' : '',
        )}
      >
        <span id={instructionsId} className="sr-only">
          {labels.avatarCropInstructions}
        </span>
        {!failed && (
          <m.img
            ref={image}
            src={src}
            alt=""
            draggable={false}
            onLoad={(event) => {
              const { naturalWidth, naturalHeight } = event.currentTarget
              setNatural({ width: naturalWidth, height: naturalHeight })
            }}
            onError={() => setFailed(true)}
            className={cn('pointer-events-none absolute max-w-none', !natural && 'invisible')}
            style={{ width, height, left: (viewport - width) / 2, top: (viewport - height) / 2, x, y, scale }}
          />
        )}
        {failed && (
          <p role="alert" className="absolute inset-0 own:grid place-items-center own:p-6 text-center own:text-ui own:text-danger-text">
            {labels.avatarReadFailed}
          </p>
        )}
        {/* The circle: everything outside it is dimmed; a thirds grid shows while moving. */}
        <span
          aria-hidden
          className="pointer-events-none absolute overflow-hidden rounded-full shadow-[0_0_0_100vmax_color-mix(in_oklab,var(--color-shadow)_64%,transparent)]"
          style={{ inset: PAD }}
        >
          <span className="absolute inset-0 rounded-full border-2 border-[color-mix(in_oklab,white_85%,transparent)]" />
          <span
            className={cn(
              'absolute inset-0 opacity-0 transition-opacity yj-duration-fast ease-standard group-data-moving/crop:opacity-100',
              'bg-[linear-gradient(to_right,transparent_calc(33.33%-0.5px),color-mix(in_oklab,white_45%,transparent)_calc(33.33%-0.5px)_calc(33.33%+0.5px),transparent_calc(33.33%+0.5px)_calc(66.66%-0.5px),color-mix(in_oklab,white_45%,transparent)_calc(66.66%-0.5px)_calc(66.66%+0.5px),transparent_calc(66.66%+0.5px)),linear-gradient(to_bottom,transparent_calc(33.33%-0.5px),color-mix(in_oklab,white_45%,transparent)_calc(33.33%-0.5px)_calc(33.33%+0.5px),transparent_calc(33.33%+0.5px)_calc(66.66%-0.5px),color-mix(in_oklab,white_45%,transparent)_calc(66.66%-0.5px)_calc(66.66%+0.5px),transparent_calc(66.66%+0.5px))]',
            )}
          />
        </span>
      </div>
      <div className="own:flex items-center own:gap-2">
        <Button variant="ghost" size="icon-sm" aria-label={labels.avatarZoomOut} disabled={zoom <= MIN_ZOOM} onClick={() => setZoom(zoom - 0.5)}>
          <ZoomOutIcon />
        </Button>
        <Slider
          aria-label={labels.avatarZoom}
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onValueChange={(value) => setZoom(Array.isArray(value) ? value[0]! : value)}
          format={{ style: 'percent', maximumFractionDigits: 0 }}
          disabled={!natural}
        />
        <Button variant="ghost" size="icon-sm" aria-label={labels.avatarZoomIn} disabled={zoom >= MAX_ZOOM} onClick={() => setZoom(zoom + 0.5)}>
          <ZoomInIcon trigger="none" />
        </Button>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          {labels.cancel}
        </Button>
        <AsyncButton onAction={save} disabled={!natural} pendingLabel={labels.saving} successLabel={labels.saved} errorLabel={labels.saveFailed}>
          {labels.avatarSavePhoto}
        </AsyncButton>
      </DialogFooter>
    </>
  )
}

export { AvatarUpload, cropRegion, type AvatarUploadProps }
