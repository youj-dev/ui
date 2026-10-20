import type { ReactElement } from 'react'
import { render, waitFor } from '@testing-library/react'
import { Callout, Cards, CodeBlock, Steps } from './blocks'
import { InstallTabsView } from './install-tabs-view'
import { Reference } from './reference'
import { ScrollTable } from './scroll-table'

// Cards can lead with a live demo; none is needed here.
vi.mock('@/examples', () => ({ examples: {} }))

/* A docs page is one column (--docs-column, styles/site.css), and every block
 * fills it, so the title, the text, previews, code, tables and the Reference
 * all share its two edges. A block that sized itself (a max width, or a track
 * of its own) would step off them. */
const root = (ui: ReactElement) => render(ui).container.firstElementChild as HTMLElement
const sizesItself = (el: HTMLElement) => el.hasAttribute('data-track') || /(^|\s)max-w-/.test(el.className)

afterEach(() => {
  window.location.hash = ''
})

describe('docs column', () => {
  it('lets every block fill the column: none sizes itself', () => {
    const blocks = [
      <CodeBlock key="code">{'npx youj init'}</CodeBlock>,
      <InstallTabsView key="install" packageCommand="pnpm add @youj/react" packageImport="" registryCommand="npx youj add button" registryDeps={[]} />,
      <Callout key="callout">{'Note'}</Callout>,
      <Steps key="steps">{'One'}</Steps>,
      <Cards key="cards">{'Card'}</Cards>,
      <ScrollTable key="table">
        <tbody>
          <tr>
            <td>Radius</td>
          </tr>
        </tbody>
      </ScrollTable>,
      <Reference key="reference">{'Props'}</Reference>,
    ]
    for (const block of blocks) expect(sizesItself(root(block))).toBe(false)
  })

  it("opens the Reference's sections into the page's flow, with the page's type", () => {
    const details = root(<Reference>{'Props'}</Reference>)
    const flow = details.querySelector(':scope > .docs-flow')
    expect(flow).toHaveClass('prose')
    expect(flow).toHaveTextContent('Props')
  })

  it('opens the Reference when a link lands on a heading inside it', async () => {
    Element.prototype.scrollIntoView = vi.fn()
    const details = root(
      <Reference>
        <h2 id="props">Props</h2>
      </Reference>,
    ) as HTMLDetailsElement
    expect(details.open).toBe(false)

    window.location.hash = '#props'
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    await waitFor(() => expect(details.open).toBe(true))
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled())
  })
})
