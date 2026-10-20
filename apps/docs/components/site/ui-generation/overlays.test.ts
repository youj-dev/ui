import { watchOverlays } from './overlays'

const built = vi.hoisted(() => ({ runs: 0 }))
vi.mock('@youj/motion/components/youj/effects/entrance/ready', () => ({ ready: async () => {} }))
vi.mock('@youj/motion/components/youj/effects/generate/engine', () => ({
  generate: () => {
    built.runs++
    return { finished: new Promise(() => {}), cancel: () => {} }
  },
}))

function open() {
  const host = document.createElement('div')
  host.style.position = 'relative'
  const dialog = document.createElement('div')
  dialog.setAttribute('role', 'dialog')
  dialog.getAnimations = () => []
  host.append(dialog)
  document.body.append(host)
}
// youj-allow: sleep a negative case has nothing to wait for: the watcher either started a build by now or never will
const flush = () => new Promise((r) => setTimeout(r, 20))

describe('overlays', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    built.runs = 0
  })

  it('builds a dialog that opens while a demo is arriving', async () => {
    const stop = watchOverlays()
    const live = document.createElement('div')
    live.setAttribute('data-gen-live', '')
    document.body.append(live)
    open()
    await flush()
    expect(built.runs).toBe(1)
    stop()
  })

  it('leaves a dialog the reader opens afterwards alone', async () => {
    const stop = watchOverlays()
    open()
    await flush()
    expect(built.runs).toBe(0)
    stop()
  })
})
