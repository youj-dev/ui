import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureRobotArm, type MiniatureRobotArmKey, robotArm } from './robot-arm'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureRobotArm, robotArm)

describe('RobotArm', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  const control = (inside: ShadowRoot, label: string) => inside.querySelector<SVGElement>(`[aria-label="${label}"]`)!

  it('starts with ready servos, an open gripper and feed enabled', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureRobotArm, { reducedMotion: 'always' })
    await run(100)
    expect(handle().getSnapshot()).toEqual(robotArm.initial)
    expect(control(inside, 'Open or close the parallel gripper (G)')).toHaveAttribute('aria-pressed', 'false')
    expect(inside.querySelector('.scr')).toHaveTextContent('READY')
    expect(inside.querySelector('.slg')).toHaveClass('on')
    expect(inside.querySelector('.sla')).not.toHaveClass('on')
    expect(inside.querySelector('.slr')).not.toHaveClass('on')
    await run(1000)
    expect(handle().getSnapshot()).toEqual(robotArm.initial)
  })

  it('Space starts, pauses and resumes a cycle that places a parcel', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureRobotArm, { reducedMotion: 'always' })
    act(() => handle().press('space'))
    expect(handle().getSnapshot()).toEqual({
      readout: 'STEP 01 · 00 placed', state: '01 · AIM AT PARCEL',
      pressed: { ' ': true, f: true, e: false },
    })
    expect(control(inside, 'Run or pause the pick-and-place cycle (Space)')).toHaveAttribute('aria-pressed', 'true')
    act(() => handle().press(' '))
    await run(1000)
    expect(handle().getSnapshot().readout).toBe('HOLD · 01 · 00 placed')
    expect(handle().getSnapshot().state).toBe('CYCLE PAUSED')
    expect(handle().getSnapshot().pressed[' ']).toBe(false)
    expect(inside.querySelector('.scr')).toHaveTextContent('HOLD')
    act(() => handle().press(' '))
    expect(handle().getSnapshot().state).toBe('01 · AIM AT PARCEL')
    await run(1200)
    expect(handle().getSnapshot()).toEqual({
      readout: '06 axes · 01 placed', state: 'CYCLE COMPLETE',
      pressed: { ' ': false, f: true, e: false },
    })
    expect(control(inside, 'Open or close the parallel gripper (G)')).toHaveAttribute('aria-pressed', 'false')
  })

  it('fills all three slots and Space clears the table for a new batch', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureRobotArm, { reducedMotion: 'always' })
    for (const placed of [1, 2, 3]) {
      act(() => handle().press(' '))
      await run(1200)
      expect(handle().getSnapshot().readout).toBe(`06 axes · 0${placed} placed`)
      expect(handle().getSnapshot().pressed[' ']).toBe(false)
    }
    expect(handle().getSnapshot().state).toBe('BATCH COMPLETE · SPACE FOR NEW')
    act(() => handle().press(' '))
    expect(handle().getSnapshot().readout).toBe('06 axes · 00 placed')
    expect(handle().getSnapshot().state).toBe('NEW BATCH · SPACE TO RUN')
    act(() => handle().press(' '))
    await run(1200)
    expect(handle().getSnapshot().readout).toBe('06 axes · 01 placed')
  })

  it.each([
    ['1', 117], ['2', 113], ['3', -95], ['4', 12], ['5', -72], ['6', 207],
  ] as const)('%s jogs its joint, lights its ring and preserves focus through depth sorting', async (key, degrees) => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureRobotArm, { reducedMotion: 'always' })
    const joint = control(inside, `Jog joint ${key} (${key})`)
    const before = joint.innerHTML
    act(() => joint.focus())
    expect(inside.activeElement).toBe(joint)
    act(() => handle().press(key))
    await run(100)
    expect(handle().getSnapshot().readout).toBe(`J${key} ${degrees}° · 00 placed`)
    expect(handle().getSnapshot().state).toBe(`MANUAL · JOINT ${key}`)
    expect(handle().getSnapshot().pressed).toEqual(robotArm.initial.pressed)
    expect(joint.innerHTML).not.toBe(before)
    expect(joint.querySelector('.jring')).toHaveClass('a')
    expect(inside.querySelector('.scr')?.textContent).toBe(`J${key} ${String(degrees).padStart(4, ' ')}°`)
    expect(inside.activeElement).toBe(joint)
    await run(1000)
    expect(joint.querySelector('.jring')).not.toHaveClass('a')
    expect(inside.querySelector('.scr')).toHaveTextContent('READY')
  })

  it('G closes and opens the gripper and updates its drawn control', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureRobotArm, { reducedMotion: 'always' })
    const gripper = control(inside, 'Open or close the parallel gripper (G)')
    act(() => handle().press('g'))
    expect(handle().getSnapshot().state).toBe('JAWS · CLOSING')
    await run(100)
    expect(handle().getSnapshot().readout).toBe('GRIP CLOSED · 00 placed')
    expect(handle().getSnapshot().state).toBe('JAWS CLOSED')
    expect(gripper).toHaveAttribute('aria-pressed', 'true')
    expect(gripper.querySelector('.lamp')).toHaveClass('a')
    act(() => handle().press('g'))
    expect(handle().getSnapshot().state).toBe('JAWS · OPENING')
    await run(100)
    expect(handle().getSnapshot().readout).toBe('GRIP OPEN · 00 placed')
    expect(handle().getSnapshot().state).toBe('JAWS OPEN')
    expect(gripper).toHaveAttribute('aria-pressed', 'false')
    expect(gripper.querySelector('.lamp')).toHaveClass('g')
  })

  it('F holds the feed; another cycle waits for a parcel until F feeds it', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureRobotArm, { reducedMotion: 'always' })
    const selector = control(inside, 'Conveyor feed selector: hold or feed (F)')
    act(() => handle().press('f'))
    await run(100)
    expect(handle().getSnapshot().readout).toBe('BELT HOLD · 00 placed')
    expect(handle().getSnapshot().state).toBe('CONVEYOR · HOLD')
    expect(handle().getSnapshot().pressed.f).toBe(false)
    expect(selector).toHaveAttribute('aria-pressed', 'false')
    expect(selector.querySelector('path.detail')).toHaveAttribute('d', 'M9,13L5.6,13')
    expect(inside.querySelector('.sla')).toHaveClass('on')
    act(() => handle().press(' '))
    await run(1200)
    act(() => handle().press(' '))
    expect(handle().getSnapshot().readout).toBe('NO PARCEL · 01 placed')
    expect(handle().getSnapshot().state).toBe('FEED HELD · PRESS F')
    act(() => handle().press('f'))
    expect(handle().getSnapshot().readout).toBe('BELT RUN · 01 placed')
    expect(handle().getSnapshot().state).toBe('CONVEYOR · FEED')
    expect(handle().getSnapshot().pressed.f).toBe(true)
    expect(selector).toHaveAttribute('aria-pressed', 'true')
    expect(selector.querySelector('path.detail')).toHaveAttribute('d', 'M9,13L9,9.4')
    await run(16)
    expect(svg()).toHaveClass('belting')
    await run(100)
    expect(svg()).not.toHaveClass('belting')
    act(() => handle().press(' '))
    await run(1200)
    expect(handle().getSnapshot().readout).toBe('06 axes · 02 placed')
  })

  it('E halts a running cycle, blocks every action and resets the servos', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureRobotArm, { reducedMotion: 'always' })
    act(() => handle().press(' '))
    await run(100)
    act(() => handle().press('e'))
    await run(100)
    const halted = handle().getSnapshot()
    expect(halted).toEqual({
      readout: 'HALT · 00 placed', state: 'E-STOP ACTIVE · E TO RESET',
      pressed: { ' ': false, f: true, e: true },
    })
    const stop = control(inside, 'Emergency stop (E)')
    expect(stop).toHaveAttribute('aria-pressed', 'true')
    expect(stop.querySelector('g')).toHaveAttribute('transform', 'translate(46.5 20.5) scale(.84) translate(-46.5 -20.5)')
    expect(inside.querySelector('.slr')).toHaveClass('on')
    expect(inside.querySelector('.scr')).toHaveTextContent('E-STOP')
    const joint = control(inside, 'Jog joint 2 (2)')
    const frozen = joint.innerHTML
    for (const key of [' ', '1', '2', '3', '4', '5', '6', 'g', 'f'] satisfies MiniatureRobotArmKey[]) {
      act(() => handle().press(key))
      await run(100)
      expect(handle().getSnapshot()).toEqual(halted)
      expect(joint.innerHTML).toBe(frozen)
    }
    act(() => handle().press('e'))
    await run(100)
    expect(handle().getSnapshot()).toEqual(robotArm.initial)
    expect(stop).toHaveAttribute('aria-pressed', 'false')
    expect(inside.querySelector('.slr')).not.toHaveClass('on')
    act(() => handle().press(' '))
    await run(1200)
    expect(handle().getSnapshot().readout).toBe('06 axes · 01 placed')
  })
})
