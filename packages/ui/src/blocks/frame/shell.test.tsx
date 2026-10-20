import type { ComponentProps } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { AppFrame, useFrame } from './shell'
import { NAV } from './shell/data'
import { FrameSidebarClassic } from './sidebar-classic'
import { FrameTopbarBreadcrumb } from './topbar-breadcrumb'

/* AppFrame's `linkComponent`: every nav link in the frame's parts renders as
 * the app's router Link, with the nav's href, and still moves the page. */

function RouterLink(props: ComponentProps<'a'>) {
  return <a data-router-link="" {...props} />
}

function Page() {
  const { trail } = useFrame()
  return <h1>{(trail?.child ?? trail?.item)?.label}</h1>
}

describe('AppFrame linkComponent', () => {
  test('sidebar and top bar links render as the given component and still navigate', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always">
        <AppFrame nav={NAV} linkComponent={RouterLink} sidebar={<FrameSidebarClassic />} topbar={<FrameTopbarBreadcrumb />}>
          <Page />
        </AppFrame>
      </YoujProvider>,
    )
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(3)
    for (const l of links) expect(l).toHaveAttribute('data-router-link')
    const inbox = screen.getByRole('link', { name: /^Inbox/ })
    await user.click(inbox)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Inbox')
    expect(inbox).toHaveAttribute('aria-current', 'page')
  })
})
