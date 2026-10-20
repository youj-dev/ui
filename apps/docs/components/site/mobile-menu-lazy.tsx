'use client'

import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { MenuIcon } from '@youj/icons/components/youj/icons/menu'
import type { MobileMenu as MenuType } from '@/components/site/mobile-menu'
import { loadTree } from '@/components/site/docs-tree'

type Props = ComponentProps<typeof MenuType>

let Menu: typeof MenuType | undefined
let loading: Promise<typeof MenuType> | undefined

function load() {
  loading ??= import('@/components/site/mobile-menu').then((module) => (Menu = module.MobileMenu))
  return loading
}

/**
 * The mobile menu's button, drawn as the drawer's own trigger draws it, until
 * the menu is wanted. Its drawer, the docs tree and the settings are a chunk
 * of their own: pointing at the button, touching or focusing it fetches them,
 * and a press puts the real menu in the button's place, looking the same,
 * and opens it as soon as it's in (usually already).
 */
export function MobileMenu(props: Props) {
  const [ready, setReady] = useState(Menu !== undefined)
  const [pressed, setPressed] = useState(false)
  const root = useRef<HTMLSpanElement>(null)

  // One intent fetches the drawer's code and the docs tree together. Fetching doesn't swap the button: a press under way would lose its target.
  const fetchMenu = () => {
    void load()
    void loadTree().catch(() => {})
  }

  // A press before the menu was in opens it once it is: the real trigger is pressed for it, so the drawer knows where focus goes back to.
  // A frame later: in the commit that mounts it, the drawer doesn't take a press yet.
  useEffect(() => {
    if (!ready || !pressed) return
    const frame = requestAnimationFrame(() => {
      setPressed(false)
      root.current?.querySelector<HTMLButtonElement>('[data-slot=drawer-trigger]')?.click()
    })
    return () => cancelAnimationFrame(frame)
  }, [ready, pressed])

  if (ready && Menu) {
    return (
      <span ref={root} className="contents">
        <Menu {...props} />
      </span>
    )
  }

  return (
    <button
      type="button"
      aria-label="Open menu"
      aria-haspopup="dialog"
      aria-expanded={false}
      onPointerEnter={fetchMenu}
      onPointerDown={fetchMenu}
      onFocus={fetchMenu}
      onClick={() => {
        setPressed(true)
        fetchMenu()
        void load().then(() => setReady(true))
      }}
      className="inline-grid size-8 touch:size-11 place-items-center rounded-lg text-fg-muted transition-colors yj-duration-fast ease-standard hover:bg-hover hover:text-fg focus-ring lg:hidden"
    >
      <MenuIcon size={18} strokeWidth={1.6} active={pressed} />
    </button>
  )
}
