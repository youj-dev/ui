'use client'

import { createContext, useContext, type ElementType, type MouseEvent, type ReactNode } from 'react'
import { useSidebar } from '../../../components/ui/sidebar'
import type { FrameNavItem, FrameNavSection, FrameTrail } from './model'

export type MobileNav = 'sheet' | 'tabs'

export interface FrameContextValue {
  nav: FrameNavSection[]
  /** The current page's id. */
  active: string | undefined
  /** Where the current page sits in the nav. */
  trail: FrameTrail | undefined
  mobileNav: MobileNav
  /** Goes to a page by id (the palette, a search result). */
  navigate: (id: string) => void
  /** A link's props for a nav item: its href, `aria-current` and the click that navigates. */
  link: (item: FrameNavItem) => { href: string; 'aria-current'?: 'page'; onClick: (event: MouseEvent<HTMLAnchorElement>) => void }
  /** What every nav link renders as: the frame's `linkComponent` (your router's Link), or `a`. */
  Link: ElementType
}

export const FrameContext = createContext<FrameContextValue | null>(null)

/** The frame's nav, current page and navigation, for the parts inside an AppFrame. */
export function useFrame() {
  const context = useContext(FrameContext)
  if (!context) throw new Error('useFrame must be used inside <AppFrame>.')
  return context
}

const RailContext = createContext(false)

/** Marks a region that's always narrow (the two-level sidebar's rail): the logo, workspace and account parts inside it show their compact form. */
export function FrameRail({ children }: { children: ReactNode }) {
  return <RailContext.Provider value>{children}</RailContext.Provider>
}

/** True inside a FrameRail. */
export function useFrameRail(): boolean {
  return useContext(RailContext)
}

/**
 * True where there's room for a mark but not a name: in a FrameRail, or in a
 * sidebar collapsed on a wide screen. Parts built on SidebarMenuButton fade
 * their labels with the collapse by themselves and only need useFrameRail.
 */
export function useFrameCompact(): boolean {
  const rail = useContext(RailContext)
  const { state, isMobile } = useSidebar()
  return rail || (state === 'collapsed' && !isMobile)
}
