'use client'

import { JsonViewer } from '@youj/react'

const EVENT = {
  id: 'evt_01JD8Q4M2Z9X',
  type: 'invoice.payment_failed',
  created: '2026-11-24T09:41:07Z',
  livemode: false,
  attempt: 3,
  amount_due: 4900,
  currency: 'eur',
  customer: {
    id: 'cus_8812',
    name: 'Mara Okafor',
    email: 'mara@northwind.example',
    tags: ['enterprise', 'eu-west'],
  },
  request: {
    method: 'POST',
    url: 'https://api.northwind.example/v1/invoices/inv_2231/pay',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': 'b6f1c2e0-9d3a-4b8e-a1c4-7f0e2d9b5a11',
    },
  },
  error: {
    code: 'card_declined',
    message: 'Your card was declined. The issuing bank refused the charge; ask the customer to use another card or to contact their bank.',
    retryable: true,
    next_retry_at: null,
  },
  metadata: {},
}

export default function JsonViewerDemo() {
  return <JsonViewer label="Event payload" value={EVENT} className="max-h-[400px] w-full max-w-xl" />
}
