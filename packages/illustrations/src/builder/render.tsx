'use client'

import { createElement, useState, type ComponentType, type ReactElement, type ReactNode } from 'react'
import { IsoBox } from '../components/youj/graphics/iso-box'
import { IsoCylinder } from '../components/youj/graphics/iso-cylinder'
import { IsoPlatform } from '../components/youj/graphics/iso-platform'
import type { IsoShape } from '../components/youj/graphics/iso-scene'
import { IsoFloor } from '../components/youj/graphics/grids'
import { band, bob, circle, Group, Hollow, IllustrationStage, INK, Lathe, Mark, orb, Prism, rect, rounded, type IllustrationProps } from '../components/youj/graphics/illustrations/kit'
import { sceneSlug, type BuilderScene, type Part } from './model'
import { bubble, heart, isList, partSpec, sceneSpec, star, type Component, type ElementSpec, type Value } from './spec'

/* A builder scene drawn by the kit itself: the spec's elements on the
 * illustrations' stage, so it sorts, shades, assembles, comes apart and
 * holds still under reduced motion exactly as a shipped scene does. On the
 * canvas each part is wrapped in a <g data-part> (sorted like the shape it
 * holds), so a pointer can find it and a drag can move it without a render;
 * the wrapper adds nothing else to the drawing. */

const COMPONENTS: Record<Component, ComponentType<Record<string, unknown>>> = {
  IsoBox: IsoBox as never,
  IsoCylinder: IsoCylinder as never,
  IsoPlatform: IsoPlatform as never,
  IsoFloor: IsoFloor as never,
  Prism: Prism as never,
  Lathe: Lathe as never,
  Group: Group as never,
  Mark: Mark as never,
  Hollow: Hollow as never,
}

function evaluate(value: Value, props: IllustrationProps): unknown {
  if (typeof value !== 'object' || isList(value)) return value
  if ('bob' in value) return bob(props, value.bob)
  if ('ink' in value) return INK[value.ink]
  const [a = 0, b = 0, c = 0, d = 0, e = 0, f = 0, g] = value.args
  switch (value.call) {
    case 'rounded':
      return rounded(a, b, c, d, e)
    case 'orb':
      return orb(a)
    case 'heart':
      return heart(a, b)
    case 'star':
      return star(a, b)
    case 'bubble':
      return bubble(a, b)
    case 'band':
      return band(a, b, c, d, e, f, g)
    case 'rect':
      return rect(a, b, c, d)
    case 'circle':
      return circle(a, b, c, d || undefined)
  }
}

interface TaggedProps {
  id: string
  children: ReactElement
}

/** A part's own group on the canvas, sorted and framed as the shape inside it. */
function TaggedImpl({ id, children }: TaggedProps) {
  return <g data-part={id}>{children}</g>
}
const shapeOf = (el: ReactElement) => el.type as IsoShape<unknown>
const Tagged = Object.assign(TaggedImpl, {
  isoBounds: ({ children }: TaggedProps) => shapeOf(children).isoBounds!(children.props),
}) as IsoShape<TaggedProps>

function element(spec: ElementSpec, key: string, props: IllustrationProps, annotate: boolean, children?: ReactNode[]): ReactElement {
  const values = Object.fromEntries(spec.props.map(([name, value]) => [name, evaluate(value, props)]))
  const tagged = annotate && spec.part
  // A part's own marks and openings go inside it; a group's members come in from outside.
  const inside = children ?? spec.children?.map((child, i) => element(child, `${key}-${i}`, props, false))
  const el = createElement(COMPONENTS[spec.component], { key: tagged ? undefined : key, ...values }, ...(inside ?? []))
  return tagged ? <Tagged key={key} id={spec.part!}>{el}</Tagged> : el
}

interface Cached {
  still: boolean
  annotate: boolean
  el: ReactElement
}

/** One part on its own, for a glyph. */
export const partElement = (part: Part) => element(partSpec(part), part.id, {}, false)

/** A part's element, kept while the part is the same object, so a drag that changes one part re-renders only that one. */
function cachedPart(part: Part, props: IllustrationProps, annotate: boolean, cache: WeakMap<Part, Cached>) {
  const still = props.float === false
  const hit = cache.get(part)
  if (hit && hit.still === still && hit.annotate === annotate) return hit.el
  const el = element(partSpec(part), part.id, props, annotate)
  cache.set(part, { still, annotate, el })
  return el
}

/** The scene's elements for the stage: the same list, in the same order, the generated code writes. */
export function sceneElements(scene: BuilderScene, props: IllustrationProps, annotate = false, cache = new WeakMap<Part, Cached>()): ReactElement[] {
  const byId = new Map(scene.parts.map((p) => [p.id, p]))
  return sceneSpec(scene).map((spec, i) => {
    if (spec.part) return cachedPart(byId.get(spec.part)!, props, annotate, cache)
    if (spec.component === 'Group') {
      const members = (spec.children ?? []).map((child) => cachedPart(byId.get(child.part!)!, props, annotate, cache))
      return element(spec, `group-${i}`, props, annotate, members)
    }
    return element(spec, 'base', props, annotate)
  })
}

export interface BuiltSceneProps extends IllustrationProps {
  scene: BuilderScene
  /** Wrap each part in a <g data-part> for the canvas. */
  annotate?: boolean
}

/** A builder scene on the illustrations' stage. */
export function BuiltScene({ scene, annotate = false, ...props }: BuiltSceneProps) {
  const [cache] = useState(() => new WeakMap<Part, Cached>())
  return (
    <IllustrationStage id={sceneSlug(scene.name)} {...props}>
      {sceneElements(scene, props, annotate, cache)}
    </IllustrationStage>
  )
}
