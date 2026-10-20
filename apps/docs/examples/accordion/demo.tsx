'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@youj/react'

const FAQ = [
  {
    id: 'seats',
    question: 'What counts as a seat?',
    answer:
      'Anyone who can sign in to the workspace. Guests who only view shared links are free, and seats are prorated to the day when someone joins or leaves.',
  },
  {
    id: 'plans',
    question: 'Can I change plans mid-cycle?',
    answer: 'Yes. Upgrades apply at once and are prorated. Downgrades take effect at the end of the billing period, so you keep what you paid for.',
  },
  {
    id: 'limits',
    question: 'What happens if we go over a usage limit?',
    answer:
      'Nothing breaks. Billing contacts get an email at 80% and 100%, and overage is billed at the same unit price. Set a spend limit to pause new deployments instead.',
  },
  {
    id: 'open-source',
    question: 'Do you offer discounts for open source?',
    answer: 'Public, non-commercial projects get the Pro plan free. Apply from Settings → Billing with a link to the repository.',
  },
]

export default function AccordionDemo() {
  return (
    <div className="w-full max-w-xl">
      {/* Each trigger is an h3, so the section that holds them gets an h2. */}
      <h2 className="mb-1 text-ui-lg font-semibold text-fg">Billing questions</h2>
      {/* One open at a time. hiddenUntilFound lets the browser's find-in-page open a closed answer. */}
      <Accordion defaultValue={['seats']} hiddenUntilFound>
        {FAQ.map(({ id, question, answer }) => (
          <AccordionItem key={id} value={id}>
            <AccordionTrigger>{question}</AccordionTrigger>
            <AccordionContent>{answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
