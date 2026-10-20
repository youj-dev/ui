import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core'
import { InstallField } from './install-field'

const renderField = () =>
  render(
    <YoujProvider reducedMotion="always">
      <InstallField />
    </YoujProvider>,
  )

describe('InstallField', () => {
  beforeEach(() => localStorage.clear())

  it('shows the npm command with a copy button', () => {
    renderField()
    expect(screen.getByRole('group', { name: 'Install command' })).toHaveTextContent('npx @youj/cli init')
    expect(screen.getByRole('button', { name: 'Copy install command' })).toBeVisible()
  })

  it.each([['pnpm', 'pnpm dlx @youj/cli init'], ['yarn', 'yarn dlx @youj/cli init'], ['bun', 'bunx @youj/cli init'], ['npm', 'npx @youj/cli init']])('words the command for %s when picked in the menu', async (name, command) => {
    const user = userEvent.setup()
    renderField()
    await user.click(screen.getByRole('button', { name: 'Install options' }))
    await user.click(await screen.findByRole('menuitemradio', { name }))
    expect(screen.getByRole('group', { name: 'Install command' })).toHaveTextContent(command)
  })

  it('shows the mode toggle only when a mode is passed', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { unmount } = renderField()
    await user.click(screen.getByRole('button', { name: 'Install options' }))
    expect(await screen.findByRole('menuitemradio', { name: 'npm' })).toBeVisible()
    expect(screen.queryByRole('menuitemradio', { name: 'Copy in' })).toBeNull()
    unmount()
    render(
      <YoujProvider reducedMotion="always">
        <InstallField mode={{ value: 'package', onChange }} />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Install options' }))
    expect(await screen.findByRole('menuitemradio', { name: 'Package' })).toBeChecked()
    await user.click(screen.getByRole('menuitemradio', { name: 'Copy in' }))
    expect(onChange).toHaveBeenCalledWith('registry')
  })

  it('words package installs in the manager’s add command', () => {
    render(
      <YoujProvider reducedMotion="always">
        <InstallField install={{ kind: 'package', packages: '@youj/react recharts' }} label="Package" />
      </YoujProvider>,
    )
    expect(screen.getByRole('group', { name: 'Package' })).toHaveTextContent('npm i @youj/react recharts')
  })

  it.each([['pnpm', 'pnpm add -D tailwindcss'], ['yarn', 'yarn add --dev tailwindcss'], ['bun', 'bun add -D tailwindcss'], ['npm', 'npm i -D tailwindcss']])('flags a dev dependency the way %s does', async (name, command) => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always">
        <InstallField install={{ kind: 'package', packages: 'tailwindcss', dev: true }} label="Dev" />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Install options' }))
    await user.click(await screen.findByRole('menuitemradio', { name }))
    expect(screen.getByRole('group', { name: 'Dev' })).toHaveTextContent(command)
  })

  it('picks an AI tool instead of a package manager for a client command, and remembers the pick', async () => {
    const user = userEvent.setup()
    const field = (
      <YoujProvider reducedMotion="always">
        <InstallField install={{ kind: 'client', commands: { claude: 'claude mcp add --transport http youj https://mcp.youj.dev', codex: 'codex mcp add youj --url https://mcp.youj.dev' } }} label="Connect" />
      </YoujProvider>
    )
    const { unmount } = render(field)
    expect(screen.getByRole('group', { name: 'Connect' })).toHaveTextContent('claude mcp add --transport http youj https://mcp.youj.dev')
    await user.click(screen.getByRole('button', { name: 'Install options' }))
    expect(screen.queryByRole('menuitemradio', { name: 'pnpm' })).toBeNull()
    expect(screen.queryByRole('menuitemradio', { name: 'Gemini CLI' })).toBeNull()
    await user.click(await screen.findByRole('menuitemradio', { name: 'Codex' }))
    expect(screen.getByRole('group', { name: 'Connect' })).toHaveTextContent('codex mcp add youj --url https://mcp.youj.dev')
    expect(screen.getByRole('button', { name: 'Copy command' })).toBeVisible()
    unmount()
    render(field)
    expect(screen.getByRole('group', { name: 'Connect' })).toHaveTextContent('codex mcp add youj --url')
  })
})
