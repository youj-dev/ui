// @vitest-environment node
import { renderToString } from 'react-dom/server'
import { YoujProvider, useSound, useSoundCue } from '@youj/core'
import { beacon, candidates, definePack } from './index'

/* Server-safe: a provider with sound on renders where there's no window, no
 * Web Audio and no gesture. The player, the pack and the listeners all wait
 * for the browser. */

function Status() {
  const sound = useSound()
  const cue = useSoundCue()
  return (
    <button type="button" onClick={() => cue('tap')}>
      {sound.enabled ? `Sound on at ${sound.volume}` : 'Sound off'}
    </button>
  )
}

test('a provider with sound on renders on a server that has no Web Audio', () => {
  expect(typeof window).toBe('undefined')
  const html = renderToString(
    <YoujProvider sound={{ pack: beacon, volume: 0.6 }}>
      <Status />
    </YoujProvider>,
  )
  expect(html).toContain('Sound on at 0.6')
})

test('without a provider, the same component renders as silent', () => {
  expect(renderToString(<Status />)).toContain('Sound off')
})

test('a pack of your own renders on the server too, and loads nothing there', () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch')
  const sounds = definePack({ sounds: { tap: candidates.tap.wood, error: '/sounds/error.wav' } })
  const html = renderToString(
    <YoujProvider sound={sounds}>
      <Status />
    </YoujProvider>,
  )
  expect(html).toContain('Sound on at 0.5')
  expect(fetchMock).not.toHaveBeenCalled()
  fetchMock.mockRestore()
})
