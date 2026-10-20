import { act, cleanup, render } from '@testing-library/react'
import { createRef, StrictMode, type ComponentType, type Ref } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { MiniatureHandle, MiniatureMeta, MiniatureProps } from '../engine/types'
import { installAudio, mediaListenerCount, setMedia, useFrames } from './browser'

type Component<H extends MiniatureHandle, P extends object = object> = ComponentType<MiniatureProps & { ref?: Ref<H>; progress?: number | null; done?: boolean } & P>

const pointerDown = (el: Element) => act(() => void el.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true })))

/** Renders a miniature with a handle; `inside` is its shadow root, where it draws. */
export function mount<H extends MiniatureHandle, P extends object = object>(Component: Component<H, P>, props: MiniatureProps & { progress?: number | null; done?: boolean } & P = {} as MiniatureProps & P) {
  const ref = createRef<H>()
  const Mounted = Component as ComponentType<object>
  const view = render(<Mounted ref={ref} {...props} />)
  const host = view.container.firstElementChild as HTMLDivElement
  const inside = host.shadowRoot!
  return { ...view, ref, host, inside, svg: () => inside.querySelector('svg')!, root: () => inside.querySelector('.yjm-root') as HTMLElement, handle: () => ref.current! }
}

/**
 * What every miniature must do, whatever it draws: render a sized stage on the
 * server, draw on mount inside its own shadow root, take every key it lists,
 * keep the page's keys, go still when asked, and leave nothing behind.
 */
export function describeMiniature<H extends MiniatureHandle>(Component: Component<H>, meta: MiniatureMeta) {
  describe(`${meta.name}: the miniature contract`, () => {
    afterEach(() => {
      cleanup()
      vi.useRealTimers()
    })

    it('renders an empty, sized stage on the server', () => {
      const html = renderToString(<Component />)
      const [, , w, h] = meta.viewBox.split(' ')
      expect(html).toContain(`aspect-ratio:${w} / ${h}`)
      expect(html).toContain('role="group"')
      expect(html).toContain(`aria-label="${meta.label.replace(/&/g, '&amp;')}"`)
      expect(html).not.toContain('<svg')
    })

    it('draws on mount, inside its shadow root, framed as its metadata says', () => {
      const { inside, svg, host } = mount(Component)
      expect(inside.querySelector('style')?.textContent).toContain('.yjm-root')
      expect(svg().querySelector('defs')!.children.length).toBeGreaterThan(3)
      expect([...svg().children].find((c) => c.localName === 'g')!.childElementCount).toBeGreaterThan(10)
      expect(svg().getAttribute('viewBox')).toBe(meta.viewBox)
      expect(host).toHaveClass('yjm', `yjm-${meta.id}`)
      expect(host).toHaveAttribute('aria-label', meta.label)
      expect(host).toHaveAttribute('tabindex', '0')
    })

    it('keeps its stylesheet, ids and classes out of the page', () => {
      const before = document.querySelectorAll('style').length
      const { host } = mount(Component)
      expect(document.querySelectorAll('style')).toHaveLength(before)
      for (const id of ['soft', 'glow', 'bloom', 'stage-floor-fill']) expect(document.getElementById(id)).toBeNull()
      // Only the description lives in the light DOM.
      expect(host.children).toHaveLength(1)
      expect(host.className).toBe(`yjm yjm-${meta.id}`)
    })

    it('two on a page draw independently', () => {
      const { container } = render(
        <>
          <Component />
          <Component />
        </>,
      )
      const [a, b] = [...container.querySelectorAll<HTMLElement>('.yjm')].map((el) => el.shadowRoot!)
      expect(a?.querySelector('svg g')).toBeTruthy()
      expect(b?.querySelector('svg g')).toBeTruthy()
      expect(a!.querySelector('svg')).not.toBe(b!.querySelector('svg'))
    })

    it('survives StrictMode: mounted twice, it draws once and every key acts once', async () => {
      const run = useFrames()
      const ref = createRef<H>()
      const { container } = render(
        <StrictMode>
          <Component ref={ref} />
        </StrictMode>,
      )
      const inside = container.querySelector<HTMLElement>('.yjm')!.shadowRoot!
      expect(inside.querySelectorAll('svg')).toHaveLength(1)
      expect(inside.querySelectorAll('.yjm-root')).toHaveLength(1)
      await run(100)
      const toggle = meta.keys.find((k) => k.toggle)
      if (toggle) {
        const key = toggle.keys[0]!
        const before = ref.current!.getSnapshot().pressed[key]
        act(() => ref.current!.press(key))
        await run(50)
        expect(ref.current!.getSnapshot().pressed[key]).toBe(!before)
      }
    })

    it('takes every key it lists, by name or by press(), without throwing', async () => {
      const run = useFrames()
      const { handle } = mount(Component, { reducedMotion: 'always' })
      await run(100)
      for (const hint of meta.keys)
        for (const key of hint.keys) {
          act(() => handle().press(key))
          await run(50)
        }
      act(() => handle().press('space'))
      await run(200)
      expect(handle().getSnapshot().readout).not.toBe('')
    })

    it('publishes its readout through onStateChange and the handle', async () => {
      const run = useFrames()
      const onStateChange = vi.fn()
      const { handle } = mount(Component, { onStateChange })
      await run(400)
      const snapshot = handle().getSnapshot()
      expect(snapshot.readout).toBeTruthy()
      expect(snapshot.state).toBeTruthy()
      if (onStateChange.mock.calls.length) expect(onStateChange).toHaveBeenLastCalledWith(snapshot)
    })

    it('leaves the page alone: keys typed elsewhere never reach it', async () => {
      const run = useFrames()
      const input = document.body.appendChild(document.createElement('input'))
      const { handle } = mount(Component, { keyboard: 'global' })
      await run(200)
      const before = handle().getSnapshot()
      input.focus()
      for (const hint of meta.keys) for (const key of hint.keys) input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
      await run(50)
      expect(handle().getSnapshot().pressed).toEqual(before.pressed)
      input.remove()
    })

    it('as a still picture: an img, nothing focusable, no live region', () => {
      const { host, svg, inside } = mount(Component, { interactive: false })
      expect(host).toHaveAttribute('role', 'img')
      expect(host).not.toHaveAttribute('tabindex')
      expect(svg()).toHaveAttribute('aria-hidden', 'true')
      expect(svg().querySelectorAll('[tabindex]')).toHaveLength(0)
      expect(inside.querySelector('[role=status]')).toBeNull()
    })

    it('resolves reduced motion and the mode for its own stylesheet', () => {
      const { root, rerender, ref } = mount(Component)
      expect(root()).not.toHaveAttribute('data-reduced')
      expect(root()).not.toHaveAttribute('data-dark')
      setMedia({ reduce: true, dark: true })
      expect(root()).toHaveAttribute('data-reduced')
      expect(root()).toHaveAttribute('data-dark')
      rerender(<Component ref={ref} reducedMotion="never" mode="light" />)
      expect(root()).not.toHaveAttribute('data-reduced')
      expect(root()).not.toHaveAttribute('data-dark')
      setMedia({ dark: false })
      rerender(<Component ref={ref} reducedMotion="always" mode="system" />)
      expect(root()).not.toHaveAttribute('data-dark')
      act(() => document.documentElement.setAttribute('data-theme', 'dark'))
      return Promise.resolve().then(() => {
        expect(root()).toHaveAttribute('data-reduced')
        expect(root()).toHaveAttribute('data-dark')
        document.documentElement.removeAttribute('data-theme')
      })
    })

    it('follows the YoujProvider around it: reduced when it forces it, full when it says never', () => {
      const wrapped = (props: Record<string, string>, style?: string) => {
        const wrapper = document.createElement('div')
        for (const [k, v] of Object.entries(props)) wrapper.setAttribute(k, v)
        if (style) wrapper.setAttribute('style', style)
        document.body.append(wrapper)
        const view = render(<Component />, { container: wrapper.appendChild(document.createElement('div')) })
        return { ...view, wrapper, root: () => (view.container.firstElementChild as HTMLElement).shadowRoot!.querySelector('.yjm-root') as HTMLElement }
      }
      const forced = wrapped({ 'data-yj-reduced': '' }, '--yj-motion: 0')
      expect(forced.root()).toHaveAttribute('data-reduced')
      forced.unmount()
      forced.wrapper.remove()
      setMedia({ reduce: true })
      const never = wrapped({}, '--yj-motion: 1')
      expect(never.root()).not.toHaveAttribute('data-reduced')
      act(() => never.wrapper.setAttribute('style', '--yj-motion: 0'))
      return Promise.resolve().then(() => {
        expect(never.root()).toHaveAttribute('data-reduced')
        never.unmount()
        never.wrapper.remove()
        setMedia({ reduce: false })
      })
    })

    it('makes no sound unless asked, and none before a gesture', async () => {
      const audio = installAudio()
      try {
        const run = useFrames()
        const quiet = mount(Component)
        pointerDown(quiet.host)
        for (const hint of meta.keys.slice(0, 2)) act(() => quiet.handle().press(hint.keys[0]!))
        await run(100)
        expect(audio.created).toHaveLength(0)
        quiet.unmount()
        const loud = mount(Component, { sound: true })
        await run(100)
        expect(audio.created).toHaveLength(0)
        pointerDown(loud.host)
        for (const hint of meta.keys) for (const key of hint.keys) act(() => loud.handle().press(key))
        await run(100)
        expect(audio.created.length).toBeLessThanOrEqual(1)
        loud.unmount()
        for (const ctx of audio.created) expect(ctx.close).toHaveBeenCalled()
      } finally {
        audio.uninstall()
      }
    })

    it('leaves nothing behind when it unmounts', async () => {
      const run = useFrames()
      const add = vi.spyOn(document, 'addEventListener')
      const remove = vi.spyOn(document, 'removeEventListener')
      const media = mediaListenerCount()
      const { unmount, handle, inside } = mount(Component)
      await run(100)
      act(() => handle().press(meta.keys[0]!.keys[0]!))
      unmount()
      const added = add.mock.calls.map(([type, fn]) => `${type}:${String(fn)}`)
      const removed = remove.mock.calls.map(([type, fn]) => `${type}:${String(fn)}`)
      expect(removed.sort()).toEqual(added.sort())
      expect(mediaListenerCount()).toBe(media)
      expect(vi.getTimerCount()).toBe(0)
      expect(inside.childNodes).toHaveLength(0)
    })
  })
}
