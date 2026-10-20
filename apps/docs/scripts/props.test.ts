// @vitest-environment node
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { blockFiles, componentFiles, extractBlockProps, extractProps, splitDefault, type ComponentDoc } from './props'

const here = fileURLToPath(new URL('.', import.meta.url))
const repo = join(here, '../../..')
const prop = (doc: ComponentDoc | undefined, name: string) => doc?.props.find((p) => p.name === name)

describe('extractProps on a fixture', () => {
  const docs = extractProps([join(here, '__fixtures__/badge.tsx')], here)
  const badge = docs.Badge

  it('documents exported components and interfaces, and skips everything else', () => {
    expect(Object.keys(docs).sort()).toEqual(['Arrow', 'Badge', 'BadgeItem', 'BadgeProps'])
  })

  it('documents an exported data interface (an item of a list prop) like props', () => {
    expect(docs.BadgeItem?.props).toEqual([
      { name: 'label', type: 'string', required: true, description: 'Shown on the badge.' },
      { name: 'href', type: 'string', required: false },
    ])
  })

  it('lists only props the package declares and names the external base', () => {
    expect(badge?.props.map((p) => p.name)).toEqual(['label', 'size', 'step', 'amount', 'tone', 'count', 'children'])
    expect(badge?.extends).toEqual(['HTMLAttributes<HTMLSpanElement>'])
  })

  it('marks required props and keeps doc comments', () => {
    expect(prop(badge, 'label')).toMatchObject({ required: true, type: 'string', description: 'The text on the badge.' })
    expect(prop(badge, 'size')?.required).toBe(false)
  })

  it('keeps an alias as written and expands its literal members in source order', () => {
    expect(prop(badge, 'size')).toMatchObject({ type: 'Size', values: ["'sm'", "'md'", "'lg'"] })
    expect(prop(badge, 'step')).toMatchObject({ type: 'Step', values: ["'tight'", "'base'", "'loose'"] })
  })

  it('takes defaults from destructuring and drops the matching "Default" sentence', () => {
    expect(prop(badge, 'size')).toMatchObject({ default: "'md'", description: 'Visual size.' })
    expect(prop(badge, 'amount')).toMatchObject({ default: '0.5', description: 'Fraction that must be visible. Only whole badges count.' })
  })

  it('reads @default tags, and leaves prose defaults in the description', () => {
    expect(prop(badge, 'count')?.default).toBe('3')
    expect(prop(badge, 'tone')).toMatchObject({ description: 'Accent color. Default: whatever the theme says.' })
    expect(prop(badge, 'tone')?.default).toBeUndefined()
  })

  it('finds defaults destructured in the component body', () => {
    expect(prop(docs.Arrow, 'direction')).toMatchObject({ default: "'up'", type: "'up' | 'down'" })
  })
})

describe('extractProps on a file that exports at the foot', () => {
  const docs = extractProps([join(here, '__fixtures__/badge.tsx'), join(here, '__fixtures__/field.tsx')], here)

  it('documents components and *Props interfaces exported by name at the end of the file', () => {
    expect(docs.Chip).toMatchObject({ file: '__fixtures__/field.tsx', extends: ["ComponentProps<'span'>"] })
    expect(prop(docs.Chip, 'removable')).toMatchObject({ type: 'boolean', default: 'false', description: 'Shows a remove button.' })
    expect(docs.ChipProps?.props.map((p) => p.name)).toEqual(['removable'])
  })

  it('lists a component with no props of its own by what its props pass through to', () => {
    expect(docs.TextInput).toEqual({ name: 'TextInput', file: '__fixtures__/field.tsx', props: [], extends: ["ComponentProps<'input'>"] })
    expect(docs.Group?.extends).toEqual(['HTMLAttributes<HTMLDivElement>', "ComponentProps<'fieldset'>"])
    expect(docs.Panel?.extends).toEqual(["ComponentProps<'section'>", "Pick<HTMLAttributes<HTMLElement>, 'title'>"])
  })

  it('skips functions whose argument is not a props object, and documents re-exports once, where declared', () => {
    expect(docs.Count).toBeUndefined()
    expect(docs.Badge?.file).toBe('__fixtures__/badge.tsx')
  })
})

describe('splitDefault', () => {
  it('keeps decimals inside the default', () => {
    expect(splitDefault('How much shows. Default 0.3.')).toEqual({ description: 'How much shows.', default: '0.3' })
  })

  it('finds the sentence anywhere', () => {
    expect(splitDefault('Grain, 0–1. Default 0.5. Dither is always on.')).toEqual({ description: 'Grain, 0–1. Dither is always on.', default: '0.5' })
  })

  it('leaves text without a default alone', () => {
    expect(splitDefault('Just a description.')).toEqual({ description: 'Just a description.' })
  })
})

describe('extractProps on the workspace packages', () => {
  const docs = extractProps(componentFiles(join(repo, 'packages')), repo)

  it('documents Reveal from its real source', () => {
    const reveal = docs.Reveal
    expect(reveal?.file).toBe('packages/motion/src/components/youj/motion/reveal.tsx')
    expect(prop(reveal, 'variant')).toMatchObject({ type: 'RevealVariant', default: "'rise'" })
    expect(prop(reveal, 'variant')?.values).toContain("'wipe-up'")
    expect(prop(reveal, 'duration')?.values).toEqual(["'instant'", "'fast'", "'base'", "'slow'", "'deliberate'"])
    expect(reveal?.extends).toEqual(["HTMLMotionProps<'div'>"])
  })

  it('never lists inherited DOM props', () => {
    expect(prop(docs.Counter, 'onClick')).toBeUndefined()
    expect(prop(docs.Counter, 'value')).toMatchObject({ required: true, type: 'number' })
  })

  it('documents @youj/react components, which export at the foot', () => {
    expect(docs.Button?.file).toBe('packages/ui/src/components/ui/button.tsx')
    expect(prop(docs.Button, 'loadingLabel')).toBeDefined()
    // Its own prop is listed; Base UI's pass through, named once as what it extends.
    expect(docs.Checkbox).toMatchObject({ props: [{ name: 'sound', default: 'true' }], extends: ['CheckboxPrimitive.Root.Props'] })
  })
})

describe('extractBlockProps on the blocks', () => {
  const files = blockFiles(join(repo, 'packages'))
  const docs = extractBlockProps(files, repo)
  const booking = docs['app-slot-booking']!
  const bookingProp = (name: string) => booking.props.find((p) => p.name === name)

  it('documents every block entry under its registry name', () => {
    expect(Object.keys(docs)).toHaveLength(files.length)
    expect(booking).toMatchObject({ component: 'SlotBooking', path: 'blocks/app/slot-booking', propsType: 'SlotBookingProps' })
  })

  it('reads demo-data defaults as prose, or as "demo", never as the constant that holds them', () => {
    expect(bookingProp('schedule')?.default).toBe("the demo's timetable")
    expect(bookingProp('services')?.default).toBe('demo')
    expect(bookingProp('variant')?.default).toBe("'calendar'")
  })

  it('lists the keys of copy with their default strings', () => {
    expect(booking.copy).toMatchObject({ title: 'Book a class' })
  })
})
