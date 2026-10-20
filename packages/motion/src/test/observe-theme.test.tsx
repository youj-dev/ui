import { useRef, useState } from 'react'
import { act, render } from '@testing-library/react'
import { ThemeScope } from '@youj/core/lib/youj/provider'
import { observeTheme } from '../components/youj/backgrounds/gl'
import { useThemeChange } from '../components/youj/players/use-player-env'

/* The canvas, WebGL and Lottie pieces re-read token colors on a theme change
 * (core's theme/observe.test.tsx covers observeThemeChange itself). */

const flush = () => act(async () => {})

function tree() {
  const html = document.documentElement
  const scope = document.createElement('div')
  scope.setAttribute('data-yj-theme', '')
  const plain = document.createElement('div')
  const host = document.createElement('div')
  scope.append(plain)
  plain.append(host)
  document.body.append(scope)
  return { html, scope, plain, host }
}

afterEach(() => {
  document.body.innerHTML = ''
  for (const name of ['data-theme', 'data-yj-theme', 'data-yj-motion', 'style', 'class']) document.documentElement.removeAttribute(name)
})

test("the WebGL backgrounds' observeTheme follows scopes above their host", async () => {
  const t = tree()
  const onChange = vi.fn()
  const stop = observeTheme(onChange, t.host)
  t.scope.style.setProperty('--yj-neutral-hue', '80')
  await flush()
  expect(onChange).toHaveBeenCalledTimes(1)
  stop()
})

function Player({ onChange }: { onChange: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useThemeChange(ref, onChange)
  return <div ref={ref} />
}

test("the Lottie player's useThemeChange fires when a ThemeScope above it changes theme", async () => {
  const onChange = vi.fn()
  let setAccent: (accent: string) => void = () => {}
  function Page() {
    const [accent, set] = useState('#ff5a1f')
    setAccent = set
    return (
      <ThemeScope theme={{ accent }}>
        <Player onChange={onChange} />
      </ThemeScope>
    )
  }
  render(<Page />)
  await flush()
  expect(onChange).not.toHaveBeenCalled()
  act(() => setAccent('#10b981'))
  await flush()
  expect(onChange).toHaveBeenCalledTimes(1)
})
