'use client'

import { JsonViewer } from '@youj/react'

const TOKEN = {
  access_token:
    'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzQyIiwic2NvcGUiOiJyZWFkOm9yZGVycyB3cml0ZTpvcmRlcnMiLCJpYXQiOjE3MzI0NDE2MDAsImV4cCI6MTczMjQ0NTIwMH0.c2lnbmF0dXJlLWdvZXMtaGVyZQ',
  token_type: 'Bearer',
  expires_in: 3600,
  scope: 'read:orders write:orders',
  error_detail: [
    'PaymentError: card_declined',
    '    at chargeInvoice (billing/charge.ts:88:11)',
    '    at retry (lib/retry.ts:41:18)',
  ].join('\n'),
}

export default function JsonViewerLongStrings() {
  return <JsonViewer label="Token response" value={TOKEN} collapseStringsAfter={40} className="w-full max-w-lg" />
}
