import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChevronRightIcon, GitBranchIcon } from '@youj/icons'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Badge } from './badge'
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './breadcrumb'

const meta: Meta<typeof BreadcrumbList> = {
  title: 'UI/Navigation/Breadcrumb',
  component: BreadcrumbList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'shadcn\'s breadcrumb in youj\'s type: a named `nav` around an ordered list, 13px muted crumbs, the current page in full ink (plain text with aria-current="page", not a link to itself), slanted hairline separators hidden from assistive tech. Long labels truncate at 12rem. Give the list `maxItems` and a long path folds its middle crumbs into an ellipsis button ("Show 3 more"); pressing it unfolds them in place (each crumb\'s width grows from zero so the ones after glide aside, staggered on the tight step) and moves focus to the first revealed crumb. A new path starts folded again. Reduced motion unfolds at once.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof BreadcrumbList>

function Logo({ letter }: { letter: string }) {
  return (
    <span aria-hidden className="grid size-4 place-items-center rounded-[4px] bg-fg text-[9px] font-bold text-canvas">
      {letter}
    </span>
  )
}

/** A deployment's header: workspace, project, section, then the current deployment. */
export const Hero: Story = {
  render: () => (
    <div className="flex w-full max-w-[640px] flex-col gap-3 rounded-xl border border-line bg-surface p-5">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#acme">
              <Logo letter="A" />
              Acme
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#web">web</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#deployments">Deployments</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-mono text-ui-sm">dpl_8f2a91c</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center gap-3">
        <h2 className="text-[20px] font-semibold tracking-tight text-fg">Tighten pricing grid on mobile</h2>
        <Badge variant="success">Ready</Badge>
      </div>
      <p className="flex items-center gap-1.5 text-ui text-fg-muted">
        <GitBranchIcon className="size-3.5" />
        main · 4 minutes ago by Ada
      </p>
    </div>
  ),
}

const PATH = ['Acme', 'Engineering', 'Platform', 'Services', 'Billing API', 'Environments', 'Production']

function DeepPath({ maxItems = 4 }: { maxItems?: number }) {
  return (
    <Breadcrumb>
      <BreadcrumbList maxItems={maxItems}>
        {PATH.map((name, i) => (
          <BreadcrumbItemGroup key={name} last={i === PATH.length - 1} name={name} />
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

/* Crumbs from data: an item and the separator after it, folded as one unit. */
function BreadcrumbItemGroup({ name, last }: { name: string; last: boolean }) {
  return (
    <>
      <BreadcrumbItem>{last ? <BreadcrumbPage>{name}</BreadcrumbPage> : <BreadcrumbLink href={`#${name}`}>{name}</BreadcrumbLink>}</BreadcrumbItem>
      {!last && <BreadcrumbSeparator />}
    </>
  )
}

/**
 * Seven levels with `maxItems={4}`: the root and the last two stay, the middle folds into "Show 4 more".
 * Press it (or Tab to it and press Enter): the crumbs unfold in place and focus lands on the first one.
 */
export const Collapsed: Story = {
  render: () => (
    <div className="w-full max-w-[720px] rounded-xl border border-line bg-surface px-5 py-4">
      <Breadcrumb>
        <BreadcrumbList maxItems={4}>
          {PATH.map((name, i) =>
            i === PATH.length - 1 ? (
              <BreadcrumbItem key={name}>
                <BreadcrumbPage>{name}</BreadcrumbPage>
              </BreadcrumbItem>
            ) : (
              [
                <BreadcrumbItem key={name}>
                  <BreadcrumbLink href={`#${name}`}>{name}</BreadcrumbLink>
                </BreadcrumbItem>,
                <BreadcrumbSeparator key={`${name}-sep`} />,
              ]
            ),
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  ),
}

/** Names longer than 12rem truncate with an ellipsis; the full name stays in the link's accessible name. */
export const LongLabels: Story = {
  render: () => (
    <div className="w-full max-w-[560px] rounded-xl border border-line bg-surface px-5 py-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#org">Acme Corporation International Holdings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#repo">marketing-site-redesign-2026-experiments</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Preview for the pricing page with the new annual toggle</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  ),
}

/** Any mark can separate crumbs; here a chevron. A static ellipsis marks a gap the app decided not to show. */
export const CustomSeparator: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#docs">Docs</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <ChevronRightIcon trigger="none" />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <ChevronRightIcon trigger="none" />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>Theming</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
}

/** Data-driven crumbs: each item comes with its separator in a small component, and the list folds whole units. `maxItems={3}` keeps the root and the last two. */
export const FromData: Story = {
  render: () => (
    <div className="w-full max-w-[720px] rounded-xl border border-line bg-surface px-5 py-4">
      <DeepPath maxItems={3} />
    </div>
  ),
}

/** dir="rtl": the path reads from the right, and the separators lean the other way. */
export const RightToLeft: Story = {
  render: () => (
    <div dir="rtl" className="w-full max-w-[720px] rounded-xl border border-line bg-surface px-5 py-4">
      <DeepPath />
    </div>
  ),
}

/** Reduced motion: the folded crumbs appear at once. */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <div className="w-full max-w-[720px] rounded-xl border border-line bg-surface px-5 py-4">
        <DeepPath />
      </div>
    </YoujProvider>
  ),
}
