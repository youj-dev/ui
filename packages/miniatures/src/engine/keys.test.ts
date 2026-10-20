import { describe, expect, it } from 'vitest'
import { belongsToPage, codeOf, keyEvent, normalizeKey, shortcutName } from './keys'

describe('keys', () => {
  it('normalizes names to KeyboardEvent.key', () => {
    expect(['space', 'Space', ' ', 'spacebar'].map(normalizeKey)).toEqual([' ', ' ', ' ', ' '])
    expect(['enter', 'up', 'ArrowDown', 'left', 'esc'].map(normalizeKey)).toEqual(['Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'Escape'])
    expect(['C', 'c', '3', 'F5'].map(normalizeKey)).toEqual(['c', 'c', '3', 'F5'])
  })

  it('carries Shift for the keys a figure binds to the reverse of another', () => {
    expect(['Shift+W', 'shift+r', 'shift+ArrowUp'].map(normalizeKey)).toEqual(['shift+w', 'shift+r', 'shift+ArrowUp'])
    expect(keyEvent('shift+w')).toEqual({ key: 'W', code: 'KeyW', shiftKey: true })
    expect(keyEvent(' ')).toEqual({ key: ' ', code: 'Space', shiftKey: false })
    expect(shortcutName('shift+w')).toBe('Shift+W')
  })

  it('names codes and shortcuts', () => {
    expect([' ', 'c', '4', 'ArrowUp'].map(codeOf)).toEqual(['Space', 'KeyC', 'Digit4', 'ArrowUp'])
    expect([' ', 'c', 'ArrowUp'].map(shortcutName)).toEqual(['Space', 'C', 'ArrowUp'])
  })

  it('knows which keystrokes belong to the page', () => {
    const el = (html: string) => {
      document.body.innerHTML = html
      return document.body.firstElementChild!
    }
    expect(belongsToPage('d', el('<input>'))).toBe(true)
    expect(belongsToPage('d', el('<div contenteditable></div>'))).toBe(true)
    expect(belongsToPage(' ', el('<button></button>'))).toBe(true)
    expect(belongsToPage('Enter', el('<a href="#">x</a>'))).toBe(true)
    expect(belongsToPage('d', el('<button></button>'))).toBe(false)
    expect(belongsToPage('ArrowUp', el('<div role="slider"></div>'))).toBe(true)
    expect(belongsToPage('ArrowUp', el('<div></div>'))).toBe(false)
    expect(belongsToPage(' ', document.body)).toBe(false)
  })
})
