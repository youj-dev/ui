import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { DEFAULT_EFFECTS, EffectsInspector } from './effects-inspector'
import { effectsToCss } from './effects-inspector/data'

function renderBlock(props: Parameters<typeof EffectsInspector>[0] = {}) {
  return render(
    <YoujProvider reducedMotion="always">
      <EffectsInspector {...props} />
    </YoujProvider>,
  )
}
const css = () => document.querySelector('[data-slot=effects-css]')!.textContent!

describe('effectsToCss', () => {
  test('puts the stroke first, then the shadow, as one box-shadow list', () => {
    const out = effectsToCss(DEFAULT_EFFECTS).css
    expect(out['box-shadow']).toBe('inset 0 0 0 1px rgb(255 255 255 / 0.28), 0px 8px 24px -2px rgb(76 111 255 / 0.55)')
    expect(out.background).toBe('rgb(76 111 255 / 1)')
    expect(out.filter).toBeUndefined()
  })

  test('an inner shadow is inset, an outside stroke a spread, a center stroke both', () => {
    const base = DEFAULT_EFFECTS
    const inner = effectsToCss({ ...base, shadow: { ...base.shadow, type: 'inner' }, stroke: { ...base.stroke, position: 'outside', weight: 3 } }).css['box-shadow']
    expect(inner).toContain('0 0 0 3px')
    expect(inner).toContain('inset 0px 8px')
    const center = effectsToCss({ ...base, shadow: { ...base.shadow, enabled: false }, stroke: { ...base.stroke, position: 'center', weight: 4 } }).css['box-shadow']
    expect(center).toMatch(/^inset 0 0 0 2px .+, 0 0 0 2px /)
  })

  test('off, hidden and removed effects add nothing', () => {
    const none = effectsToCss({
      shadow: { ...DEFAULT_EFFECTS.shadow, enabled: false },
      stroke: { ...DEFAULT_EFFECTS.stroke, visible: false },
      fill: { ...DEFAULT_EFFECTS.fill, present: false },
      blur: DEFAULT_EFFECTS.blur,
    })
    expect(none.css).toEqual({})
    expect(none.blurred).toBeNull()
  })

  test('a uniform blur is a filter and a progressive one adds a mask between start and end', () => {
    const blur = { ...DEFAULT_EFFECTS.blur, enabled: true, radius: 6 }
    expect(effectsToCss({ ...DEFAULT_EFFECTS, blur }).css).toMatchObject({ filter: 'blur(6px)' })
    const progressive = effectsToCss({ ...DEFAULT_EFFECTS, blur: { ...blur, type: 'progressive', start: 90, end: 20 } }).css
    expect(progressive['mask-image']).toBe('linear-gradient(to bottom, transparent 20%, black 90%)')
  })
})

describe('effects inspector block', () => {
  test('is a section named by its title with a panel for each effect and the live CSS beside them', () => {
    renderBlock()
    expect(screen.getByRole('region', { name: 'Effects' })).toBeInTheDocument()
    for (const name of ['Drop shadow', 'Stroke', 'Fill', 'Layer blur']) expect(screen.getByRole('region', { name: name })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Preview' })).toBeInTheDocument()
    expect(css()).toContain('box-shadow: inset 0 0 0 1px')
  })

  test('editing a field rewrites the preview CSS and reports the new value', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    renderBlock({ onValueChange })
    const shadow = screen.getByRole('region', { name: 'Drop shadow' })
    await user.click(within(shadow).getByRole('spinbutton', { name: 'Blur' }))
    await user.keyboard('{Shift>}{ArrowUp}{/Shift}')
    expect(css()).toContain('0px 8px 34px -2px')
    expect(onValueChange).toHaveBeenLastCalledWith({ ...DEFAULT_EFFECTS, shadow: { ...DEFAULT_EFFECTS.shadow, blur: 34 } })
  })

  test('typing a hex into the fill recolors the button', async () => {
    const user = userEvent.setup()
    renderBlock()
    const fill = screen.getByRole('region', { name: 'Fill' })
    const hex = within(fill).getByRole('textbox', { name: 'Hex color' })
    await user.clear(hex)
    await user.type(hex, 'f00{Enter}')
    expect(css()).toContain('background: rgb(255 0 0 / 1);')
  })

  test('the checkbox and the eye take an effect out of the CSS without losing its settings', async () => {
    const user = userEvent.setup()
    renderBlock()
    const fill = screen.getByRole('region', { name: 'Fill' })
    await user.click(within(fill).getByRole('button', { name: 'Hide' }))
    expect(css()).not.toContain('background')
    await user.click(within(fill).getByRole('button', { name: 'Show' }))
    expect(css()).toContain('background')
    await user.click(within(fill).getByRole('checkbox'))
    expect(css()).not.toContain('background')
    expect(within(fill).getByRole('textbox', { name: 'Hex color' })).toBeDisabled()
  })

  test('the type menu switches a drop shadow to an inner one', async () => {
    const user = userEvent.setup()
    renderBlock()
    await user.click(screen.getByRole('button', { name: 'Change type, Drop shadow' }))
    await user.click(await screen.findByRole('menuitemradio', { name: 'Inner shadow' }))
    expect(screen.getByRole('region', { name: 'Inner shadow' })).toBeInTheDocument()
    expect(css()).toContain('inset 0px 8px 24px -2px')
  })

  test('layer blur: its range is inert until progressive, and the CSS gains a mask', async () => {
    const user = userEvent.setup()
    renderBlock({ defaultValue: { ...DEFAULT_EFFECTS, blur: { ...DEFAULT_EFFECTS.blur, enabled: true } } })
    const blur = screen.getByRole('region', { name: 'Layer blur' })
    expect(within(blur).getByRole('spinbutton', { name: 'Start' })).toBeDisabled()
    expect(css()).toContain('filter: blur(4px);')
    await user.click(within(blur).getByRole('button', { name: 'Progressive' }))
    expect(within(blur).getByRole('spinbutton', { name: 'Start' })).toBeEnabled()
    expect(css()).toContain('mask-image: linear-gradient(to bottom, transparent 30%, black 100%)')
  })

  test('removing an effect takes its panel out and Add effect brings it back', async () => {
    const user = userEvent.setup()
    renderBlock()
    await user.click(screen.getByRole('button', { name: 'Remove Stroke' }))
    expect(screen.queryByRole('region', { name: 'Stroke' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add effect' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Stroke' }))
    expect(screen.getByRole('region', { name: 'Stroke' })).toBeInTheDocument()
  })

  test('copy rewrites the strings; headingLevel and rest props reach the block', () => {
    renderBlock({ headingLevel: 1, 'data-testid': 'root', copy: { title: 'Effekte', fill: 'Füllung', blur: 'Unschärfe' } } as never)
    expect(screen.getByRole('heading', { level: 1, name: 'Effekte' })).toBeInTheDocument()
    expect(screen.getByTestId('root')).toHaveAttribute('aria-labelledby')
    expect(screen.getByRole('region', { name: 'Füllung' })).toBeInTheDocument()
  })
})
