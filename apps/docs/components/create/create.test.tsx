import { useState } from 'react'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider, type YoujLook } from '@youj/core'
import { DEFAULT_FRAME, type FrameConfig } from '@youj/react/docs/create/config'
import { DEFAULT_SIZE, type SizeConfig } from '@youj/react/docs/create/size-url'
import { readTheme } from '@youj/react/docs/create/theme-url'
import { createPath } from '@/lib/create'
import { ExportDialog } from './export-dialog'
import { exportState, writtenFiles } from './export-files'
import { FrameOptions, PartOptions } from './frame-options'
import { ScreenOptions } from './screen-options'
import { highlightTsx } from './highlight'

/* Create's Frame, Parts and Screens steps and its "Get the code" dialog:
 * every part is a menu and every extra a switch, screens are added from the
 * catalog and ordered; the export leads with one command, and the screens can
 * stay behind. */

/* The derivation never lets a theme made in Create miss AA, so the blocked
 * export is shown with a stand-in failure. */
const contrast = vi.hoisted(() => ({ fail: false }))
vi.mock('@youj/core/lib/youj/theme', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@youj/core/lib/youj/theme')>()
  return {
    ...actual,
    themeErrors: (theme: Parameters<typeof actual.themeErrors>[0]) =>
      contrast.fail
        ? [{ level: 'error', code: 'contrast', mode: 'light', token: 'fg-subtle', against: 'canvas', ratio: 3.2, min: 4.5, message: 'fg-subtle on canvas misses AA' }]
        : actual.themeErrors(theme),
  }
})
afterEach(() => {
  contrast.fail = false
})

function mockClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
}

function Frame({ onChange, frame: initial = DEFAULT_FRAME, step = 'frame' }: { onChange: (frame: FrameConfig) => void; frame?: FrameConfig; step?: 'frame' | 'parts' | 'screens' }) {
  const [frame, setFrame] = useState(initial)
  const Options = step === 'parts' ? PartOptions : step === 'screens' ? ScreenOptions : FrameOptions
  return (
    <YoujProvider reducedMotion="always">
      <Options
        frame={frame}
        onChange={(patch) => {
          const next = { ...frame, ...patch }
          setFrame(next)
          onChange(next)
        }}
      />
    </YoujProvider>
  )
}

describe('the Frame and Parts steps', () => {
  test('each part is a menu named by its row, and its options say what they are', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { unmount } = render(<Frame onChange={onChange} step="parts" />)
    for (const name of ['Account', 'Search']) expect(screen.getByRole('combobox', { name })).toBeInTheDocument()
    unmount()
    render(<Frame onChange={onChange} />)
    for (const name of ['Sidebar', 'Top bar', 'Header', 'On phones']) expect(screen.getByRole('combobox', { name })).toBeInTheDocument()
    await user.click(screen.getByRole('combobox', { name: 'Sidebar' }))
    const railPanel = await screen.findByRole('option', { name: /^Rail \+ panel/ })
    expect(railPanel).toHaveTextContent('Round keys for sections beside a panel of their pages as a tree')
    await user.click(railPanel)
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ sidebar: 'rail-panel' }))
    expect(screen.getByRole('combobox', { name: 'Sidebar' })).toHaveTextContent('Rail + panel')
  })

  test('the screens step lists the frame’s screens in nav order, home first, and adds from the catalog by category', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Frame onChange={onChange} step="screens" />)
    const added = within(screen.getByRole('list', { name: 'Screens in your app' }))
    expect(added.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['GeneralAnalytics overviewHome', 'WorkspaceTask board', 'AdminSettings'])
    expect(screen.getByRole('group', { name: 'Dashboards' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Analytics overview:/ })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: /^Billing:/ }))
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ screens: ['app-analytics-overview', 'app-task-board', 'app-settings', 'app-billing'] }))
    expect(screen.getByRole('status')).toHaveTextContent('Billing added')
    await user.click(screen.getByRole('button', { name: /^Analytics overview:/ }))
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ screens: ['app-task-board', 'app-settings', 'app-billing'] }))
  })

  test('search narrows the catalog, and says when nothing matches', async () => {
    const user = userEvent.setup()
    render(<Frame onChange={vi.fn()} step="screens" />)
    await user.type(screen.getByRole('searchbox', { name: 'Search screens' }), 'fleet')
    expect(screen.getAllByRole('button', { name: /:/ }).map((b) => b.getAttribute('aria-label')?.split(':')[0])).toEqual(['Logistics'])
    await user.clear(screen.getByRole('searchbox', { name: 'Search screens' }))
    await user.type(screen.getByRole('searchbox', { name: 'Search screens' }), 'zebra')
    expect(screen.getByText('No screens match “zebra”.')).toBeInTheDocument()
  })

  test('a screen moves within its group of the nav, and none is the frame alone', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Frame onChange={onChange} step="screens" frame={{ ...DEFAULT_FRAME, screens: ['app-settings', 'app-billing'] }} />)
    expect(screen.getByRole('button', { name: 'Move Settings up' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Move Settings down' }))
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ screens: ['app-billing', 'app-settings'] }))
    await user.click(screen.getByRole('button', { name: 'Remove all' }))
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ screens: [] }))
    expect(screen.getByText(/No screens: the frame alone/)).toBeInTheDocument()
  })

  test('extras are switches', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Frame onChange={onChange} step="parts" />)
    const bell = screen.getByRole('switch', { name: 'Notifications' })
    expect(bell).toBeChecked()
    await user.click(bell)
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ notifications: false }))
  })
})

function Export({ screens = ['app-week-calendar'], query = '', style = 'classic' as YoujLook, size = DEFAULT_SIZE as SizeConfig, onTheme = () => {} }) {
  const [include, setInclude] = useState(true)
  const [open, setOpen] = useState(false)
  const designed = { frame: { ...DEFAULT_FRAME, screens }, theme: readTheme(new URLSearchParams(query)), style, size }
  const state = exportState(designed, include)
  const link = `https://www.youj.dev${createPath(state)}`
  const files = writtenFiles(state, link, 'package').map((f) => ({ ...f, highlighted: highlightTsx(f.code) }))
  return (
    <YoujProvider reducedMotion="always">
      <ExportDialog
        open={open}
        onOpenChange={setOpen}
        trigger={<button type="button">Get the code</button>}
        state={state}
        designed={designed.frame}
        includeScreens={include}
        onIncludeScreensChange={setInclude}
        link={link}
        shareLink={`https://www.youj.dev${createPath(designed)}`}
        files={files}
        onTheme={onTheme}
      />
    </YoujProvider>
  )
}

/** Opens the dialog from its trigger, as a reader would. */
async function openExport(props: Parameters<typeof Export>[0] = {}) {
  render(<Export {...props} />)
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Get the code' })))
  return screen.findByRole('dialog', { name: 'Get the code' })
}

/** Opens a section from the nav, as a reader would, and returns its panel. */
const section = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(screen.getByRole('tab', { name }))
  return screen.getByRole('tabpanel', { name })
}

const stepByStep = (user: ReturnType<typeof userEvent.setup>) => section(user, 'Instructions')

describe('the Get the code dialog', () => {
  test('opens from its trigger on the command, with a nav of its sections, and gives focus back on Escape', async () => {
    const user = userEvent.setup()
    render(<Export />)
    const trigger = screen.getByRole('button', { name: 'Get the code' })
    await user.click(trigger)
    const dialog = await screen.findByRole('dialog', { name: 'Get the code' })
    const nav = within(dialog).getByRole('tablist', { name: 'The code' })
    expect(nav).toHaveAttribute('aria-orientation', 'vertical')
    expect(within(nav).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Command', 'Code', 'Download', 'Instructions'])
    const command = within(dialog).getByRole('tabpanel', { name: 'Command' })
    expect(within(command).getByRole('heading', { level: 2, name: 'Command' })).toBeInTheDocument()
    expect(within(command).getByRole('group', { name: 'Create command' })).toHaveTextContent("npx @youj/cli create 'https://www.youj.dev/create?screens=week-calendar'")
    expect(within(command).getByRole('group', { name: 'Share link' })).toHaveTextContent('https://www.youj.dev/create?screens=week-calendar')
    expect(within(command).getByText('Passes WCAG AA contrast in light and dark')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })

  test('each section holds its part: every file under Code, the .zip under Download, the install command under Instructions', async () => {
    const user = userEvent.setup()
    await openExport()
    const code = await section(user, 'Code')
    const files = within(code).getAllByRole('tab').map((t) => t.textContent ?? '')
    expect(files.some((name) => name.includes('app-shell.tsx'))).toBe(true)
    expect(files.some((name) => name.includes('theme.ts'))).toBe(true)
    const download = await section(user, 'Download')
    expect(within(download).getByRole('button', { name: 'Download .zip' })).toBeEnabled()
    expect(within(download).getByText('youj-frame.zip')).toBeInTheDocument()
    const steps = await stepByStep(user)
    expect(within(steps).getByRole('group', { name: 'Install command' })).toHaveTextContent('npx @youj/cli add frame-shell')
  })

  test('the nav takes the arrow keys, and every visit opens on the command again', async () => {
    const user = userEvent.setup()
    await openExport()
    await user.click(screen.getByRole('tab', { name: 'Command' }))
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('tab', { name: 'Code' })).toHaveFocus()
    expect(screen.getByRole('tab', { name: 'Code' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: 'Code' })).toBeInTheDocument()
    await user.keyboard('{End}')
    expect(screen.getByRole('tabpanel', { name: 'Instructions' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Get the code' }))
    await screen.findByRole('dialog', { name: 'Get the code' })
    expect(screen.getByRole('tab', { name: 'Command' })).toHaveAttribute('aria-selected', 'true')
  })

  test('leads with one command, and its copy says so', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    mockClipboard(writeText)
    await openExport()
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy command' })))
    expect(writeText).toHaveBeenCalledWith("npx @youj/cli create 'https://www.youj.dev/create?screens=week-calendar'")
    expect(screen.getByText('Command copied')).toBeInTheDocument()
  })

  test('a theme that misses AA contrast blocks the command and the .zip, and leads to the fix', async () => {
    const user = userEvent.setup()
    const onTheme = vi.fn()
    contrast.fail = true
    await openExport({ onTheme })
    expect(screen.getByRole('button', { name: 'Copy command' })).toBeDisabled()
    expect(screen.getByText(/WCAG AA contrast, so the export is blocked/)).toHaveTextContent('fg-subtle on canvas (light): 3.20:1, needs 4.5:1')
    const download = await section(user, 'Download')
    expect(within(download).getByRole('button', { name: 'Download .zip' })).toBeDisabled()
    await user.click(within(download).getByRole('button', { name: 'Review the theme' }))
    expect(onTheme).toHaveBeenCalled()
  })

  test('the screens can stay behind: the command then sets up the frame alone', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    mockClipboard(writeText)
    await openExport()
    const include = screen.getByRole('switch', { name: /Include the week calendar screen/ })
    expect(include).toBeChecked()
    await act(async () => fireEvent.click(include))
    expect(include).not.toBeChecked()
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy command' })))
    expect(writeText).toHaveBeenLastCalledWith("npx @youj/cli create 'https://www.youj.dev/create?screens='")
  })

  test('doing it by hand is its own section: the parts, the shell, nav and screens, then the theme as TypeScript or CSS, and its fonts', async () => {
    const user = userEvent.setup()
    await openExport({ query: 'preset=graphite&sans=geist' })
    const steps = await stepByStep(user)
    expect(within(steps).getByRole('group', { name: 'Install command' })).toHaveTextContent('npx @youj/cli add frame-shell')
    expect(within(screen.getByRole('tablist', { name: 'Shell files' })).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Shell', 'Nav', 'Home', 'Layout', 'Week calendar'])
    const theme = screen.getByRole('tablist', { name: 'Theme files' })
    expect(within(theme).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Theme', 'Fonts', 'CSS'])
    await user.click(within(theme).getByRole('tab', { name: 'lib/fonts.ts' }))
    expect(screen.getByLabelText('lib/fonts.ts source')).toHaveTextContent("import { Geist } from 'next/font/google'")
    await user.click(within(screen.getByRole('tablist', { name: 'Theme files' })).getByRole('tab', { name: 'styles/theme.css' }))
    expect(screen.getByLabelText('styles/theme.css source')).toHaveTextContent(/\[data-yj-theme='my-theme'\] \{ --yj-neutral-hue: \d+;.*--yj-font-sans: 'Geist'/)
  })

  test('classic, the default, installs no recipes and leaves the provider as it is', async () => {
    const user = userEvent.setup()
    await openExport()
    const steps = await stepByStep(user)
    expect(within(steps).getByRole('group', { name: 'Install command' })).toHaveTextContent(/npx @youj\/cli add frame-shell .* app-week-calendar$/)
    expect(screen.queryByText(/The style’s recipes land in/)).not.toBeInTheDocument()
    expect(screen.getByText(/Give your root/)).not.toHaveTextContent('look=')
  })

  test('bezel travels in the link and onto the provider, and installs its recipes', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    await openExport({ style: 'bezel' })
    mockClipboard(writeText)
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy command' })))
    expect(writeText).toHaveBeenCalledWith("npx @youj/cli create 'https://www.youj.dev/create?screens=week-calendar&look=bezel'")
    const steps = await stepByStep(user)
    expect(within(steps).getByRole('group', { name: 'Install command' })).toHaveTextContent(/npx @youj\/cli add frame-shell .* app-week-calendar youj-look-bezel$/)
    expect(screen.getByText(/The style’s recipes land in/)).toHaveTextContent('styles/bezel.css')
    expect(screen.getByText(/Give your root/)).toHaveTextContent('the theme and look="bezel"')
  })

  test('writes no size on the provider by default, and a picked one in the link, the theme file and the provider', async () => {
    const user = userEvent.setup()
    await openExport()
    await stepByStep(user)
    expect(screen.getByText(/Give your root/)).toHaveTextContent('at the standard size (the provider’s own, so no size props)')
    cleanup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    await openExport({ size: { density: 'compact', scaling: '110%' } })
    mockClipboard(writeText)
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy command' })))
    expect(writeText).toHaveBeenCalledWith("npx @youj/cli create 'https://www.youj.dev/create?screens=week-calendar&layout=compact&scale=110'")
    await stepByStep(user)
    expect(screen.getByText(/Give your root/)).toHaveTextContent('at your size, density="compact" scaling="110%"')
  })
})
