'use client'

import { useEffect, useRef, useState } from 'react'
import { formatBytes, type ImageEditorCopy } from './data'
import type { Size } from './geometry'

/* The image being edited: where it comes from, whether it has loaded (and
 * its own size), and a new one checked against the rules (type, size,
 * dimensions) before it's opened. A picked, dropped or pasted file becomes
 * an object URL that's given back when it's replaced, removed or the block
 * goes. */

interface SourceOptions {
  initial: string | null
  crossOrigin?: 'anonymous' | 'use-credentials'
  accept: string
  maxSize: number
  minDimensions?: { width: number; height: number }
  copy: ImageEditorCopy
  /** A new image passed the rules and is about to show. */
  onOpen: (file: File) => void
}

const nameOf = (src: string | null) =>
  (src ?? 'image')
    .split('/')
    .pop()!
    .replace(/\.[^.]+$/, '')

export function useSource({ initial, crossOrigin, accept, maxSize, minDimensions, copy, onOpen }: SourceOptions) {
  const [src, setSrc] = useState(initial)
  const [name, setName] = useState(() => nameOf(initial))
  const [error, setError] = useState<string>()
  const owned = useRef<string | null>(null)

  const [loaded, setLoaded] = useState<{ src: string; natural?: Size }>()
  useEffect(() => {
    if (!src) return
    let alive = true
    const img = new Image()
    if (crossOrigin) img.crossOrigin = crossOrigin
    img.onload = () => alive && setLoaded({ src, natural: { width: img.naturalWidth, height: img.naturalHeight } })
    img.onerror = () => alive && setLoaded({ src })
    img.src = src
    return () => {
      alive = false
    }
  }, [src, crossOrigin])
  useEffect(() => () => void (owned.current && URL.revokeObjectURL(owned.current)), [])

  const status: 'empty' | 'loading' | 'ready' | 'broken' = !src ? 'empty' : loaded?.src !== src ? 'loading' : loaded.natural ? 'ready' : 'broken'

  const show = (next: string | null, label = nameOf(next)) => {
    if (owned.current && owned.current !== next) URL.revokeObjectURL(owned.current)
    owned.current = next?.startsWith('blob:') ? next : null
    setSrc(next)
    setName(label)
    setError(undefined)
  }

  const open = (file: File) => {
    setError(undefined)
    const type = file.type.toLowerCase()
    const rules = accept.split(',').map((rule) => rule.trim().toLowerCase())
    if (!rules.some((rule) => rule === type || (rule.endsWith('/*') && type.startsWith(rule.slice(0, -1)))))
      return setError(copy.notAnImage(file.name))
    if (file.size > maxSize) return setError(copy.tooLarge(file.name, formatBytes(file.size, copy.locale), formatBytes(maxSize, copy.locale)))
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      if (minDimensions && (img.naturalWidth < minDimensions.width || img.naturalHeight < minDimensions.height)) {
        URL.revokeObjectURL(url)
        return setError(copy.tooSmall(file.name, img.naturalWidth, img.naturalHeight, copy.minRule(minDimensions.width, minDimensions.height)))
      }
      onOpen(file)
      show(url, file.name.replace(/\.[^.]+$/, ''))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      setError(copy.broken)
    }
    img.src = url
  }

  // The rules, as the empty field states them: "JPG, PNG · up to 20 MB · at least 1200 × 400 px".
  const types = accept
    .split(',')
    .map((rule) => rule.trim().split('/')[1]?.toUpperCase().replace('JPEG', 'JPG').replace('WEBP', 'WebP'))
    .filter(Boolean)
    .join(', ')
  const rules = [copy.emptyRules(types, formatBytes(maxSize, copy.locale)), minDimensions && copy.minRule(minDimensions.width, minDimensions.height)]
    .filter(Boolean)
    .join(' · ')

  return { src, name, error, status, rules, natural: status === 'ready' ? loaded!.natural! : { width: 1, height: 1 }, open, show }
}
