import type { Meta, StoryObj } from '@storybook/react-vite'
import { AlertTriangleIcon, CheckCircleIcon, CircleDashedIcon } from '@youj/icons'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion'
import { Badge } from './badge'

const meta: Meta<typeof Accordion> = {
  title: 'UI/Layout/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Base UI accordion. Each trigger is a heading button with aria-expanded and aria-controls; its panel is a labeled region. Tab moves between triggers and Enter / Space toggles (the APG dropped arrow-key roving for accordions, and Base UI 1.8 follows it). One item at a time by default, or `multiple`. Panels wear motion\'s yj-collapse preset: height eases to the measured size (then auto) while the content fades, and toggling mid-way reverses from where it is. The chevron is youj\'s ChevronDownIcon turned over by its `active` state on the snappy spring. `hiddenUntilFound` lets find-in-page open a closed panel. Reduced motion opens and turns instantly.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Accordion>

const FAQ = [
  {
    q: 'What counts as a seat?',
    a: 'Anyone who can sign in to the workspace. Guests who only view shared links are free, and seats are prorated to the day when someone joins or leaves.',
  },
  {
    q: 'Can I change plans mid-cycle?',
    a: 'Yes. Upgrades apply at once and are prorated; downgrades take effect at the end of the current billing period, so you keep what you paid for.',
  },
  {
    q: 'What happens if we go over a usage limit?',
    a: 'Nothing breaks. Billing contacts get an email at 80% and 100%, and overage is billed at the same unit price. Set a spend limit to pause new deployments instead.',
  },
  {
    q: 'Do you offer discounts for open source?',
    a: 'Public, non-commercial projects get the Pro plan free. Apply from Settings → Billing with a link to the repository.',
  },
]

function Faq() {
  return (
    <div className="w-full max-w-[560px]">
      <h2 className="mb-2 text-ui-lg font-semibold text-fg">Billing questions</h2>
      <Accordion defaultValue={[0]} hiddenUntilFound>
        {FAQ.map((item, i) => (
          <AccordionItem key={item.q} value={i}>
            <AccordionTrigger>{item.q}</AccordionTrigger>
            <AccordionContent>{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

/** A billing FAQ: one open at a time. Toggle quickly to see the height reverse mid-way; ⌘F for "prorated" opens the panel that has it. */
export const Hero: Story = {
  render: () => <Faq />,
}

const CHECKS = [
  { id: 'build', title: 'Build', status: 'passed', detail: 'Compiled 214 modules in 18.4s. Output: 1.9 MB, 312 KB gzipped.' },
  { id: 'types', title: 'Type check', status: 'passed', detail: 'No errors in 1,208 files.' },
  {
    id: 'bundle',
    title: 'Bundle size',
    status: 'warning',
    detail: 'The pricing route grew by 38 KB (+12%). The largest addition is date-fns/locale, imported in pricing-grid.tsx.',
  },
  { id: 'e2e', title: 'End-to-end tests', status: 'running', detail: '41 of 96 specs done on 4 workers.' },
] as const

const STATUS = {
  passed: { icon: CheckCircleIcon, className: 'text-success', badge: 'success', label: 'Passed' },
  warning: { icon: AlertTriangleIcon, className: 'text-warning', badge: 'warning', label: 'Warning' },
  running: { icon: CircleDashedIcon, className: 'text-fg-muted', badge: 'secondary', label: 'Running' },
} as const

/** `multiple`: several checks can be open at once. The running check is disabled until it finishes. */
export const Multiple: Story = {
  render: () => (
    <div className="w-full max-w-[560px] rounded-xl border border-line bg-surface px-4">
      <Accordion multiple defaultValue={['bundle']}>
        {CHECKS.map((check) => {
          const s = STATUS[check.status]
          return (
            <AccordionItem key={check.id} value={check.id} disabled={check.status === 'running'}>
              <AccordionTrigger>
                <span className="flex items-center gap-2.5">
                  <s.icon aria-hidden className={s.className} />
                  {check.title}
                </span>
                <Badge variant={s.badge} className="ms-auto">
                  {s.label}
                </Badge>
              </AccordionTrigger>
              <AccordionContent className="ps-6.5">{check.detail}</AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  ),
}

/** Reduced motion: panels open and close at once and the chevron flips without turning. */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <Faq />
    </YoujProvider>
  ),
}
