import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render } from '@testing-library/react'
import { YoujProvider } from '@youj/core'
import { SegmentedControl, SegmentedControlItem } from '../components/ui/segmented-control'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group'
import { Tooltip, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip'

/* A label riding Bezel's selected key takes the key's lettering (the full text
 * color, fg; its AA is checked in ui-tokens.test.ts), while the
 * others stay muted, so the choice reads in its words as well as its key. The
 * lettering rule has to reach the real DOM: an item a wrapper renders (a
 * TooltipTrigger's render prop, as the docs toolbar does) loses its own
 * data-slot, so a rule keyed on the item's slot misses it and the chosen label
 * stays as muted as the rest. */

const css = readFileSync(resolve(__dirname, 'bezel.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

/** Splits a selector list on its top-level commas. */
function split(list: string) {
  const out: string[] = []
  let depth = 0
  let from = 0
  for (let i = 0; i < list.length; i++) {
    if (list[i] === '(') depth++
    else if (list[i] === ')') depth--
    else if (list[i] === ',' && depth === 0) {
      out.push(list.slice(from, i).trim())
      from = i + 1
    }
  }
  return [...out, list.slice(from).trim()]
}

/** Selectors of the innermost rules whose body sets `declaration`, with the scope gate (&, which closes its compound) dropped. */
function rulesSetting(declaration: RegExp) {
  return [...css.matchAll(/([^{};]+)\{([^{}]*)\}/g)]
    .filter(([, , body]) => declaration.test(body!))
    .flatMap(([, prelude]) => split(prelude!.trim()).map((s) => s.replace(/&/g, ':where(*)')))
}

const lettered = rulesSetting(/(^|;)\s*color:\s*var\(--color-fg\)/)
const letters = (el: Element) => lettered.some((selector) => el.matches(selector))

test('finds the lettering rules', () => {
  expect(lettered.length).toBeGreaterThanOrEqual(3)
})

describe('every label on the key takes the key’s lettering, however the item is rendered', () => {
  const wrap = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

  test('SegmentedControl, with plain items and items rendered by a TooltipTrigger', () => {
    const { container } = wrap(
      <TooltipProvider>
        <SegmentedControl variant="pill" aria-label="Style" defaultValue="bezel">
          {['bezel', 'classic'].map((value) => (
            <Tooltip key={value}>
              <TooltipTrigger render={<SegmentedControlItem value={value} />}>{value}</TooltipTrigger>
            </Tooltip>
          ))}
          <SegmentedControlItem value="plain">plain</SegmentedControlItem>
        </SegmentedControl>
      </TooltipProvider>,
    )
    const pressed = container.querySelector('[aria-pressed="true"]')!
    expect(pressed.getAttribute('data-slot')).toBe('tooltip-trigger')
    expect(letters(pressed)).toBe(true)
    for (const el of container.querySelectorAll('[aria-pressed="false"]')) expect(letters(el)).toBe(false)
  })

  test('ToggleGroup: segmented single and multiple, and a default group whose pressed item raises itself', () => {
    const { container } = wrap(
      <>
        <ToggleGroup variant="pill" defaultValue={['a']} aria-label="Single">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup variant="pill" multiple defaultValue={['a']} aria-label="Multiple">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup defaultValue={['a']} aria-label="Default">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
        </ToggleGroup>
      </>,
    )
    const pressed = container.querySelectorAll('[aria-pressed="true"]')
    expect(pressed).toHaveLength(3)
    for (const el of pressed) expect([el.closest('[role=group]')!.getAttribute('aria-label'), letters(el)]).toEqual([expect.any(String), true])
    for (const el of container.querySelectorAll('[aria-pressed="false"]')) expect(letters(el)).toBe(false)
  })

  test('Tabs: the active trigger', () => {
    const { container } = wrap(
      <Tabs defaultValue="a">
        <TabsList variant="pill">
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
      </Tabs>,
    )
    expect(letters(container.querySelector('[role=tab][aria-selected="true"]')!)).toBe(true)
    expect(letters(container.querySelector('[role=tab][aria-selected="false"]')!)).toBe(false)
  })
})
