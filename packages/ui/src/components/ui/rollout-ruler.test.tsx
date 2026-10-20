import { useState } from 'react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { RolloutRuler, type RolloutRulerProps } from './rollout-ruler'

const reduced = (ui: React.ReactNode, labels?: Record<string, string>) =>
  render(
    <YoujProvider reducedMotion="always" labels={labels}>
      {ui}
    </YoujProvider>,
  )

function Controlled(props: Partial<RolloutRulerProps> & { onChange?: (v: number) => void }) {
  const [value, setValue] = useState(props.defaultValue ?? 10)
  return (
    <RolloutRuler
      label="Rolled out to"
      {...props}
      value={value}
      onValueChange={(v) => {
        setValue(v)
        props.onChange?.(v)
      }}
    />
  )
}

describe('RolloutRuler', () => {
  test('is a slider over the stages, spoken with the stage’s name', () => {
    reduced(<RolloutRuler label="Rolled out to" defaultValue={5} />)
    const slider = screen.getByRole('slider', { name: 'Rolled out to' })
    // Six stops: off and the five default stages; the thumb stands on Beta.
    expect(slider).toHaveAttribute('min', '0')
    expect(slider).toHaveAttribute('max', '5')
    expect(slider).toHaveAttribute('aria-valuenow', '2')
    expect(slider).toHaveAttribute('aria-valuetext', 'Beta at 5%')
  })

  test('the arrow keys step gate to gate; Home and End jump to off and GA', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    reduced(<Controlled onChange={onChange} />)
    const slider = screen.getByRole('slider')
    act(() => slider.focus())
    await user.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenLastCalledWith(50)
    // A numeric stage is spoken as its percentage alone.
    expect(slider).toHaveAttribute('aria-valuetext', '50%')
    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(onChange).toHaveBeenLastCalledWith(5)
    await user.keyboard('{End}')
    expect(onChange).toHaveBeenLastCalledWith(100)
    expect(slider).toHaveAttribute('aria-valuetext', 'GA at 100%')
    await user.keyboard('{Home}')
    expect(onChange).toHaveBeenLastCalledWith(0)
    expect(slider).toHaveAttribute('aria-valuetext', 'Off')
  })

  test('snaps any value to the nearest gate, and custom stages sort themselves', () => {
    reduced(
      <RolloutRuler
        label="Canary"
        value={27}
        stages={[
          { value: 100, label: 'All' },
          { value: 0.5, label: 'Canary' },
          { value: 25, label: '25%' },
        ]}
      />,
    )
    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('max', '3')
    expect(slider).toHaveAttribute('aria-valuenow', '2')
    const names = [...document.querySelectorAll('[data-slot="rollout-ruler-stage"]')].map((n) => n.textContent)
    expect(names).toEqual(['Canary', '25%', 'All'])
  })

  test('lights the ticks it has rolled out, the runway to the next gate, and names the current gate', () => {
    const { container } = reduced(<RolloutRuler defaultValue={10} />)
    const zones = [...container.querySelectorAll('[data-slot="rollout-ruler-tick"]')].map((t) => t.getAttribute('data-zone'))
    // 5 stages × 10 intervals: 31 ticks up to 10%, 10 more to 50%, the rest dim.
    expect(zones.filter((z) => z === 'rolled-out')).toHaveLength(31)
    expect(zones.filter((z) => z === 'runway')).toHaveLength(10)
    expect(zones.filter((z) => z === 'idle')).toHaveLength(10)
    expect(container.querySelector('[data-slot="rollout-ruler-stage"][data-current]')).toHaveTextContent('10%')
  })

  test('read-only, it is a meter; the small track has no names, axis or knob', () => {
    const { container } = reduced(
      <>
        <RolloutRuler readOnly value={50} label="semantic-search" />
        <RolloutRuler readOnly size="sm" value={1} label="usage-billing" />
      </>,
    )
    expect(screen.queryByRole('slider')).toBeNull()
    expect(screen.getByRole('meter', { name: 'semantic-search' })).toHaveAttribute('aria-valuetext', '50%')
    const small = screen.getByRole('meter', { name: 'usage-billing' })
    expect(small).toHaveAttribute('aria-valuetext', 'Internal at 1%')
    expect(small.querySelector('[data-slot="rollout-ruler-stage"], [data-slot="rollout-ruler-axis"], [data-slot="rollout-ruler-knob"]')).toBeNull()
    expect(container.querySelectorAll('[data-slot="rollout-ruler-knob"]')).toHaveLength(0)
  })

  test('translates its stage names and spoken text through the labels', () => {
    reduced(<RolloutRuler defaultValue={1} />, { rollout: 'Einführung', rolloutInternal: 'Intern' })
    const slider = screen.getByRole('slider', { name: 'Einführung' })
    expect(slider).toHaveAttribute('aria-valuetext', 'Intern at 1%')
  })

  test('disabled, it takes no input; reduced motion marks it for CSS', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { container } = reduced(<RolloutRuler defaultValue={10} disabled onValueChange={onChange} />)
    await user.keyboard('{Tab}{ArrowRight}')
    expect(onChange).not.toHaveBeenCalled()
    expect(container.querySelector('[data-slot="rollout-ruler"]')).toHaveAttribute('data-reduced-motion')
  })
})
