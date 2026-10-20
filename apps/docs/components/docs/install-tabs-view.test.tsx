import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core'
import { forManager, PACKAGE_MANAGERS } from '@/lib/package-manager'
import { InstallTabsView, PackageInstallView } from './install-tabs-view'

const renderIn = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('InstallTabsView', () => {
  it('shows a copy-in-only item with no mode toggle, its CLI command and import', async () => {
    const user = userEvent.setup()
    renderIn(<InstallTabsView registryCommand="npx youj add marketing-cta-banner" registryImport="import { CtaBanner } from '@/blocks/marketing/cta-banner'" registryDeps={[]} />)
    await user.click(screen.getByRole('button', { name: 'Install options' }))
    expect(await screen.findByRole('menuitemradio', { name: 'npm' })).toBeVisible()
    expect(screen.queryByRole('menuitemradio', { name: 'Copy in' })).toBeNull()
    await user.keyboard('{Escape}')
    expect(screen.getByRole('group', { name: 'Copy-in install' })).toHaveTextContent('npx youj add marketing-cta-banner')
    expect(screen.getByRole('group', { name: 'Import' })).toHaveTextContent("import { CtaBanner } from '@/blocks/marketing/cta-banner'")
  })

  it('opens on the package install with its import, and switches to the copy-in', async () => {
    const user = userEvent.setup()
    renderIn(<InstallTabsView packageCommand="pnpm add @youj/react recharts" packageImport="import { Button } from '@youj/react'" registryCommand="npx youj add button" registryDeps={['youj-core']} />)
    expect(screen.getByRole('group', { name: 'Package install' })).toHaveTextContent('npm i @youj/react recharts')
    expect(screen.getByRole('group', { name: 'Import' })).toHaveTextContent("import { Button } from '@youj/react'")
    expect(screen.queryByText(/Also installs/)).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Install options' }))
    await user.click(await screen.findByRole('menuitemradio', { name: 'Copy in' }))
    expect(screen.getByRole('group', { name: 'Copy-in install' })).toHaveTextContent('npx youj add button')
    expect(screen.getByText(/Also installs/)).toHaveTextContent('youj-core')
    expect(screen.getByRole('button', { name: 'Copy install command' })).toBeVisible()
  })
})

describe('PackageInstallView', () => {
  it('words a dev install and a CLI command for npm', () => {
    renderIn(
      <>
        <PackageInstallView command="pnpm add -D tailwindcss @tailwindcss/vite" label="Tailwind" />
        <PackageInstallView command="npx youj init" label="Init" />
      </>,
    )
    expect(screen.getByRole('group', { name: 'Tailwind' })).toHaveTextContent('npm i -D tailwindcss @tailwindcss/vite')
    expect(screen.getByRole('group', { name: 'Init' })).toHaveTextContent('npx youj init')
  })
})

describe('forManager', () => {
  it('maps pnpm’s commands to the others', () => {
    expect(PACKAGE_MANAGERS.map((pm) => forManager('pnpm add next-themes', pm))).toEqual(['pnpm add next-themes', 'npm install next-themes', 'yarn add next-themes', 'bun add next-themes'])
    expect(PACKAGE_MANAGERS.map((pm) => forManager('npx youj add button', pm))).toEqual(['npx youj add button', 'npx youj add button', 'npx youj add button', 'npx youj add button'])
  })
})
