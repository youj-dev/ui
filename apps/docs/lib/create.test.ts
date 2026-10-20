import { DEFAULT_FRAME } from '@youj/react/docs/create/config'
import { CREATE_CHANNEL, createPath, createPathFor, createQuery, readCreate, readCreateMessage } from './create'

describe('Create state in a URL', () => {
  it('reads what it writes: the frame and the theme', () => {
    const state = readCreate('sidebar=rail-panel&topbar=tabs&account=status&preset=brutal&accent=%23e5484d&name=Acme')
    expect(state.frame).toMatchObject({ sidebar: 'rail-panel', topbar: 'tabs', account: 'status' })
    expect(state.theme).toMatchObject({ id: 'acme', name: 'Acme', accent: '#e5484d', radius: 'none' })
    expect(readCreate(createQuery(state))).toEqual(state)
  })

  it('carries the screens and the typefaces, by name', () => {
    const state = readCreate('preset=terminal&screens=week-calendar,billing&sans=geist&display=fraunces')
    expect(state.frame.screens).toEqual(['app-week-calendar', 'app-billing'])
    expect(state.theme.fonts?.sans).toContain('Geist')
    expect(createQuery(state)).toBe('preset=terminal&sans=geist&display=fraunces&screens=week-calendar%2Cbilling')
    expect(readCreate(createQuery(state))).toEqual(state)
  })

  it('opens an older link’s page as the closest screen', () => {
    expect(readCreate('preset=graphite&page=calendar').frame.screens).toEqual(['app-week-calendar'])
    expect(readCreate('preset=graphite&page=blank').frame.screens).toEqual([])
  })

  it('carries the style beside the theme, and leaves classic, the default, out of the link', () => {
    const state = readCreate('preset=brutal&look=bezel')
    expect(state.style).toBe('bezel')
    expect(createQuery(state)).toBe('preset=brutal&look=bezel')
    expect(readCreate(createQuery(state))).toEqual(state)
    expect(readCreate('style=neon').style).toBe('classic')
    expect(createQuery({ ...state, style: 'classic' })).toBe('preset=brutal')
  })

  it('carries the size beside the style, and leaves the standard size out of the link', () => {
    const state = readCreate('preset=brutal&layout=compact&scale=90')
    expect(state.size).toEqual({ density: 'compact', scaling: '90%' })
    expect(createQuery(state)).toBe('preset=brutal&layout=compact&scale=90')
    expect(readCreate(createQuery(state))).toEqual(state)
    expect(readCreate('preset=brutal').size).toEqual({ density: 'roomy', scaling: '100%' })
    expect(createQuery({ ...state, size: { density: 'roomy', scaling: '100%' } })).toBe('preset=brutal')
  })

  it('opens on the default frame in Basalt and Classic, at /create with no query', () => {
    const state = readCreate('')
    expect(state.frame).toEqual(DEFAULT_FRAME)
    expect(state.theme.name).toBe('My theme')
    expect(state.theme.actions).toBe('accent')
    expect(state.style).toBe('classic')
    expect(createPath(state)).toBe('/create')
    expect(createPath(state, 'theme')).toBe('/create?step=theme')
  })

  it('opens with a frame block chosen, from its page in the Blocks gallery', () => {
    expect(createPathFor('frame-sidebar-rail-panel')).toBe('/create?sidebar=rail-panel')
    expect(createPathFor('frame-topbar-tabs')).toBe('/create?topbar=tabs')
    expect(createPathFor('frame-account-status')).toBe('/create?account=status')
    expect(createPathFor('frame-search-field')).toBe('/create?search=field')
    expect(createPathFor('frame-shell')).toBe('/create')
    expect(createPathFor('auth-login')).toBeUndefined()
  })
})

describe('readCreateMessage', () => {
  it('accepts a state message with a query', () => {
    expect(readCreateMessage({ channel: CREATE_CHANNEL, kind: 'state', query: 'sidebar=rail' })).toEqual({ channel: CREATE_CHANNEL, kind: 'state', query: 'sidebar=rail' })
  })

  it('accepts the frame’s hello', () => {
    expect(readCreateMessage({ channel: CREATE_CHANNEL, kind: 'hello' })).toEqual({ channel: CREATE_CHANNEL, kind: 'hello' })
  })

  it('rejects anything else', () => {
    expect(readCreateMessage(null)).toBeNull()
    expect(readCreateMessage('sidebar=rail')).toBeNull()
    expect(readCreateMessage({ channel: 'youj:frame', kind: 'state', query: '' })).toBeNull()
    expect(readCreateMessage({ channel: CREATE_CHANNEL, kind: 'ready', query: '' })).toBeNull()
    expect(readCreateMessage({ channel: CREATE_CHANNEL, kind: 'page', page: 'inbox' })).toBeNull()
    expect(readCreateMessage({ channel: CREATE_CHANNEL, kind: 'state', query: 42 })).toBeNull()
    expect(readCreateMessage({ channel: CREATE_CHANNEL, kind: 'state', query: 'x'.repeat(5000) })).toBeNull()
  })
})
