import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CodePanel, type CodeFile } from './code-panel'

const file = (path: string): CodeFile => ({ path, code: `// ${path}`, highlighted: <pre>{`// ${path}`}</pre> })
const files = ['examples/tasks/tasks.tsx', 'examples/tasks/data.ts', 'examples/tasks/components/board.tsx', 'examples/tasks/components/header.tsx'].map(file)

describe('CodePanel', () => {
  it('lists an app’s own files first, then each subfolder once with its files beneath it', () => {
    render(<CodePanel idBase="t" files={files} download="example-tasks" height="30rem" />)
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['tasks.tsx1', 'data.ts1', 'components/board.tsx1', 'components/header.tsx1'])
    expect(screen.getAllByText('components')).toHaveLength(1)
  })

  it('walks nested files with the arrow keys like any other', () => {
    render(<CodePanel idBase="t" files={files} download="example-tasks" height="30rem" />)
    fireEvent.keyDown(screen.getByRole('tab', { name: /^data\.ts/ }), { key: 'ArrowDown' })
    expect(screen.getByRole('tab', { name: /^components\/board\.tsx/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('// examples/tasks/components/board.tsx')
  })

  it('collapses the tree behind a toggle when asked, so the code takes the width, and shows it on demand', async () => {
    const user = userEvent.setup()
    render(<CodePanel idBase="t" files={files} download="example-tasks" height="30rem" collapsibleTree />)
    const toggle = screen.getByRole('button', { name: 'Show the file tree' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('tablist', { name: 'Files' })).toBeNull()
    await user.click(toggle)
    expect(screen.getByRole('button', { name: 'Hide the file tree' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('tablist', { name: 'Files' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Hide the file tree' }))
    expect(screen.queryByRole('tablist', { name: 'Files' })).toBeNull()
  })

  it('has no tree and no toggle for a single file when the tree collapses', () => {
    render(<CodePanel idBase="t" files={[files[0]!]} download="example-tasks" height="30rem" collapsibleTree />)
    expect(screen.queryByRole('tablist', { name: 'Files' })).toBeNull()
    expect(screen.queryByRole('button', { name: /file tree/ })).toBeNull()
  })

  describe('with published files', () => {
    const remote: CodeFile[] = ['blocks/app/search-results.tsx', 'blocks/app/search-results/data.ts'].map((path, i) => ({ path, lines: 10 + i, src: `/code/blocks/app-search-results/${path}.json` }))
    const fetchCode = vi.fn(async (url: string) => Response.json({ code: `// ${url}`, html: `<pre class="shiki"><code><span class="line">// ${url}</span></code></pre>` }))
    beforeEach(() => {
      fetchCode.mockClear()
      vi.stubGlobal('fetch', fetchCode)
    })
    afterEach(() => vi.unstubAllGlobals())

    it('lists each file with its length and fetches nothing while hidden', () => {
      render(<CodePanel idBase="r" files={remote} download="app-search-results" height="30rem" open={false} />)
      expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['search-results.tsx10', 'search-results/data.ts11'])
      expect(fetchCode).not.toHaveBeenCalled()
    })

    it('fetches the file it shows once open, and the next one when it’s picked', async () => {
      render(<CodePanel idBase="r" files={remote} download="app-search-results" height="30rem" />)
      expect(fetchCode).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-busy', 'true')
      expect(screen.getByRole('button', { name: 'Copy search-results.tsx' })).toBeDisabled()
      await vi.waitFor(() => expect(screen.getByRole('tabpanel')).toHaveTextContent('// /code/blocks/app-search-results/blocks/app/search-results.tsx.json'))
      expect(screen.getByRole('tabpanel')).not.toHaveAttribute('aria-busy')
      expect(screen.getByRole('button', { name: 'Copy search-results.tsx' })).toBeEnabled()
      fireEvent.pointerEnter(screen.getByRole('tab', { name: /data\.ts/ }))
      expect(fetchCode).toHaveBeenLastCalledWith('/code/blocks/app-search-results/blocks/app/search-results/data.ts.json')
      fireEvent.click(screen.getByRole('tab', { name: /data\.ts/ }))
      await vi.waitFor(() => expect(screen.getByRole('tabpanel')).toHaveTextContent('search-results/data.ts.json'))
      // Back to the first: here already, shown at once, not fetched again.
      fireEvent.click(screen.getByRole('tab', { name: /^search-results\.tsx/ }))
      expect(screen.getByRole('tabpanel')).toHaveTextContent('search-results.tsx.json')
      expect(fetchCode).toHaveBeenCalledTimes(2)
      await act(async () => {})
    })
  })
})
