import { mapParts, shapeCode, shownText, type PartInfo } from './code-map'

const DEMO = `'use client'

import { useState } from 'react'
import { Field, FieldGroup, FieldLabel, Switch } from '@youj/react'
import { ShareIcon } from '@youj/icons'

const SETTINGS = [
  { id: 'a', label: 'Previews' },
  { id: 'b', label: 'Protection' },
  { id: 'c', label: 'Cache' },
  { id: 'd', label: 'Insights' },
]

export default function Demo() {
  const [on, setOn] = useState(true)
  return (
    <FieldGroup className="rounded-xl border">
      {SETTINGS.map((s) => (
        <Field key={s.id}>
          <FieldLabel>{s.label}</FieldLabel>
          <Switch
            checked={on}
            onCheckedChange={(next) => {
              setOn(next)
              console.log(next)
            }}
          />
        </Field>
      ))}
      <Button>
        <ShareIcon />
        Share
      </Button>
    </FieldGroup>
  )
}

export { Demo }`

const lines = () => {
  const raw = DEMO.split('\n')
  const shown = shapeCode(DEMO)
  return { raw, shown, texts: shown.map((s) => shownText(raw, s)) }
}
const part = (p: Partial<PartInfo>): PartInfo => ({ slots: [''], tag: 'div', ...p })
const lineOf = (texts: string[], needle: string) => texts.findIndex((t) => t.includes(needle))

describe('shapeCode', () => {
  it('folds the directive and imports into one line, and drops the trailing re-export', () => {
    const { shown, texts } = lines()
    expect(shown[0]).toEqual({ fold: '3 imports', indent: 0 })
    expect(texts.some((t) => t.includes('import'))).toBe(false)
    expect(texts.at(-1)).toBe('}')
  })

  it('folds a long data block and a handler in a prop in place, but never JSX', () => {
    const { texts } = lines()
    expect(texts).toContain("const SETTINGS = [ ⋯ ]")
    expect(texts.find((t) => t.includes('onCheckedChange'))).toBe('            onCheckedChange={(next) => { ⋯ }}')
    expect(texts.some((t) => t.includes('<FieldLabel>'))).toBe(true)
    expect(texts.some((t) => t.includes("label: 'Previews'"))).toBe(false)
  })
})

describe('mapParts', () => {
  it('pairs parts with the lines that write them: by slot, by icon, by text', () => {
    const { texts } = lines()
    const map = mapParts(texts, [
      part({ slots: ['field-group'] }),
      part({ slots: ['field-label', 'field'], tag: 'label', text: 'Previews' }),
      part({ slots: ['switch', 'field'], tag: 'span', role: 'switch' }),
      part({ slots: ['', 'button'], tag: 'svg', icon: 'share' }),
      part({ slots: [], tag: '', text: 'Share' }),
    ])
    expect(map).toEqual([
      lineOf(texts, '<FieldGroup'),
      lineOf(texts, '<FieldLabel>'),
      lineOf(texts, '<Switch'),
      lineOf(texts, '<ShareIcon'),
      texts.findIndex((t) => t.trim() === 'Share'),
    ])
  })

  it('gives every part a .map draws to the one line that writes them', () => {
    const { texts } = lines()
    const labels = ['Previews', 'Protection', 'Cache', 'Insights'].map((text) => part({ slots: ['field-label'], tag: 'label', text }))
    expect(new Set(mapParts(texts, labels))).toEqual(new Set([lineOf(texts, '<FieldLabel>')]))
  })

  it('deals a name several lines share out in order', () => {
    const texts = ['<Card>', '  <Button>One</Button>', '  <Button>Two</Button>', '</Card>']
    const buttons = [part({ slots: ['button'], tag: 'button' }), part({ slots: ['button'], tag: 'button' })]
    expect(mapParts(texts, buttons)).toEqual([1, 2])
  })

  it('deals parts no line names over the written lines after the last named one, one after another', () => {
    const texts = ['return (', '  <Shell>', '    <Form', '      copy={copy}', '      onSubmit={submit}', '    />', '  </Shell>', ')']
    const map = mapParts(texts, [part({ slots: ['shell'] }), part({ tag: 'h2' }), part({ tag: 'input' }), part({ tag: 'p' })])
    // the shell on its line; the rest follow it down the written lines (the closing lines take none)
    expect(map).toEqual([1, 1, 2, 3])
  })
})
