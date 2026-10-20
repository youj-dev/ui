import { describe, expect, it } from 'vitest'
import { blockUsage, callbackParams, frameUsage, type BlockDoc } from './block-usage'

const booking: BlockDoc = {
  component: 'Booking',
  path: 'blocks/app/slot-booking',
  propsType: 'BookingProps',
  props: [
    { name: 'theme', type: 'ThemeInput', required: false },
    { name: 'copy', type: 'Partial<BookingCopy>', required: false },
    { name: 'services', type: 'Service[]', required: false, default: 'demo' },
    { name: 'defaultRange', type: "'7d' | '30d'", required: false },
    { name: 'onBook', type: '(slot: SlotGridSlot, service: Service) => Promise<unknown> | unknown', required: false },
    { name: 'linkComponent', type: 'ElementType', required: false },
  ],
  types: [],
  copy: { locale: 'en-US', title: 'Book a class', seatsLeft: '' },
}

describe('callbackParams', () => {
  it('reads the parameter names of a callback type', () => {
    expect(callbackParams('(slot: SlotGridSlot, service: Service) => Promise<unknown> | unknown')).toEqual(['slot', 'service'])
    expect(callbackParams('(moves: { id: string; cron: string }[], at?: Record<string, number>) => void')).toEqual(['moves', 'at'])
    expect(callbackParams('(pick: (a: number) => void) => void')).toEqual(['pick'])
    expect(callbackParams('() => void')).toEqual([])
  })
})

describe('blockUsage', () => {
  it('passes data through a typed wrapper, shows where copy goes and stubs each action', () => {
    const code = blockUsage(booking)!
    expect(code).toContain("import Link from 'next/link'")
    expect(code).toContain("import { Booking, type BookingProps } from '@/blocks/app/slot-booking'")
    expect(code).toContain("export function BookingView({ services }: Pick<BookingProps, 'services'>)")
    expect(code).toContain("copy={{ title: 'Book a class' }}")
    expect(code).toContain('linkComponent={Link}')
    expect(code).toContain('onBook={async (slot, service) => {')
    expect(code).not.toContain('theme=')
    expect(code).not.toContain('defaultRange')
  })

  it('falls back to ComponentProps when the block exports no props type', () => {
    const code = blockUsage({ ...booking, propsType: undefined })!
    expect(code).toContain("import type { ComponentProps } from 'react'")
    expect(code).toContain("Pick<ComponentProps<typeof Booking>, 'services'>")
  })

  it('has nothing to show for a demo that takes no data, copy or actions', () => {
    expect(blockUsage({ component: 'Faq', path: 'blocks/marketing/faq', props: [], types: [] })).toBeUndefined()
  })
})

describe('frameUsage', () => {
  const workspace: BlockDoc = {
    component: 'FrameSidebarWorkspace',
    path: 'blocks/frame/sidebar-workspace',
    propsType: 'FrameSidebarWorkspaceProps',
    props: [
      { name: 'header', type: 'ReactNode', required: false },
      { name: 'pinned', type: 'string[]', required: false },
      { name: 'onWidthChange', type: '(width: number) => void', required: false },
    ],
    types: [],
    copy: { resize: 'Resize sidebar', resizeValue: '' },
  }

  it('shows the sidebar in the frame it lives in, routed by the app: nav, current page, Link and the sidebar’s own data', () => {
    const code = frameUsage(workspace)
    expect(code).toContain("import { AppFrame, navPages, type FrameNavSection } from '@/blocks/frame/shell'")
    expect(code).toContain("import { FrameSidebarWorkspace, type FrameSidebarWorkspaceProps } from '@/blocks/frame/sidebar-workspace'")
    expect(code).toContain('export function AppShell({ nav, pinned, children }: AppShellProps)')
    expect(code).toContain("  pinned: FrameSidebarWorkspaceProps['pinned']")
    expect(code).toContain('active={navPages(nav).find((page) => page.item.href === pathname)?.item.id}')
    expect(code).toContain('linkComponent={Link}')
    expect(code).toContain('pinned={pinned}')
    expect(code).toContain("copy={{ resize: 'Resize sidebar' }}")
    expect(code).toContain('onWidthChange={(width) => {')
    expect(code).not.toContain('header=')
  })

  it('is the bare sidebar in its frame when it takes nothing of its own', () => {
    const code = frameUsage({ component: 'FrameSidebarIconRail', path: 'blocks/frame/sidebar-icon-rail', props: [], types: [] })
    expect(code).toContain('sidebar={<FrameSidebarIconRail />}')
    expect(code).toContain('export function AppShell({ nav, children }: AppShellProps)')
    expect(code).toContain('interface AppShellProps {\n  nav: FrameNavSection[]\n  children: ReactNode\n}')
  })
})
